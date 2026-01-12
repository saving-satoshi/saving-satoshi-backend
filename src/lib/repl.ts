import path from 'path'
import fs from 'fs/promises'
import { v4 as uuid } from 'uuid'
import Docker from "dockerode"
import {
  CONTAINER_WORKING_DIRECTORY,
  LANG_PATH,
  LANGUAGE_CONFIG,
  MAX_SCRIPT_EXECUTION_TIME,
  SupportedLanguage
} from 'config'
import Stream from './stream'
import logger from './logger'

export const docker = new Docker()
const replDockerLabel = 'saving-satoshi-backend.repl'

export async function run(code: string, language: string, context: any) {
  const config = LANGUAGE_CONFIG[language as SupportedLanguage]
  if (!config) throw new Error(`Unsupported language: ${language}`)

  const id = uuid()
  const rpath = path.join(LANG_PATH, language, id)
  await fs.mkdir(rpath, { recursive: true })

  const decodedCode = Buffer.from(code, 'base64').toString('utf-8')
  await fs.writeFile(path.join(rpath, config.mainFile), decodedCode, 'utf-8')

  const userCodePath = path.join(rpath, config.mainFile)

  const send = async (payload: any) => {
    context.socket.send(
      JSON.stringify({ ...payload, payload: payload.payload })
    )
    return Promise.resolve()
  }

  const runStream = new Stream(send, language, (r) => r, 'output')

  try {
    send({ type: 'status', payload: 'running', channel: 'build' })
    logger.debug(`[system] starting container ${id}`)

    const options = {
      name: id,
      Tty: true,
      AttachStdout: true,
      AttachStderr: true,
      StopTimeout: 0, // Stop the container immediately, instead of the 10s grace period.
      WorkingDir: CONTAINER_WORKING_DIRECTORY,
      Labels: {
        'managed-by': replDockerLabel,
      },
      HostConfig: {
        Binds: [`${userCodePath}:/usr/app/${config.mainFile}`],
        Memory: 256 * 1024 * 1024,
        AutoRemove: true,
      },
    };

    let timedOut = false

    await new Promise<void>((resolve, reject) => {
      // Setup a timeout in case user submitted code contains long-running processes.
      const timeoutId = setTimeout(async () => {
        timedOut = true
        logger.warn(`Container ${id} timed out after ${MAX_SCRIPT_EXECUTION_TIME}ms`)

        // Send error back to client.
        send({
          type: 'error',
          payload: {
            type: 'TimeoutError',
            message: `RuntimeError: Script took too long to complete.`,
          },
        })
        send({ type: 'end', payload: false, channel: 'runtime' })

        // Stop timed-out container by name - avoids race condition with container event.
        try {
          const container = docker.getContainer(id)
          await container.stop()
          logger.info(`Container ${id} stopped by timeout handler`)
        } catch (e) {
          // Container may not exist yet, already stopped, or already removed
          logger.debug(`Could not stop container ${id}: ${e.message}`)
        }

        resolve()
      }, MAX_SCRIPT_EXECUTION_TIME)

      // Run the container.
      docker.run(config.baseImage, config.command, runStream, options, (err, data) => {
        clearTimeout(timeoutId)

        if (timedOut) {
          return
        }

        let success = true
        if (err) {
          send({
            type: 'error',
            payload: {
              type: 'RuntimeError',
              message: err.message || 'Script execution failed.',
            },
          })
          success = false
        }

        send({ type: 'end', payload: success, channel: 'runtime' })
        resolve()
      })
    });

  } catch (ex) {
    logger.error('Container execution failed:', ex)

    send({
      type: 'output',
      payload: `[system] Error running container: ${ex.message}`,
      channel: 'runtime',
    })
    send({ type: 'end', payload: ex.message, channel: 'runtime' })
    context.socket.close()
  } finally {
    try {
      await fs.rm(rpath, { recursive: true })
    } catch (error) {
      logger.error('Cleanup failed:', error)
    }
  }
}

// Callback to clean up repl-managed containers by label in the event of server restart.
async function stopAllReplContainers(): Promise<number> {
  const containers = await docker.listContainers({
    filters: { label: [`managed-by=${replDockerLabel}`] },
  })

  if (containers.length === 0) {
    return 0
  }

  logger.info(`Stopping ${containers.length} container(s)...`)

  await Promise.all(
    containers.map(async (containerInfo) => {
      try {
        const container = docker.getContainer(containerInfo.Id)
        await container.stop()
        logger.debug(`Stopped container ${containerInfo.Id.slice(0, 12)}`)
      } catch (e) {
        logger.error(`Failed to stop container ${containerInfo.Id.slice(0, 12)}: ${e.message}`)
      }
    })
  )

  return containers.length
}

export async function shutdown() {
  const stopped = await stopAllReplContainers()
  if (stopped > 0) {
    logger.info(`Stopped ${stopped} container(s)`)
  }
}
