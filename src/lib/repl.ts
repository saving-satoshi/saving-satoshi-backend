import path from 'path'
import fs from 'fs/promises'
import { v4 as uuid } from 'uuid'
import Docker from "dockerode"
import {
  CONTAINER_WORKING_DIRECTORY,
  LANG_PATH,
  LANGUAGE_CONFIG,
  SupportedLanguage
} from 'config'
import Stream from './stream'
import logger from './logger'

export const docker = new Docker()

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
      HostConfig: {
        Binds: [`${userCodePath}:/usr/app/${config.mainFile}`],
        Memory: 256 * 1024 * 1024,
        AutoRemove: true,
      },
    };
    await new Promise((resolve, reject) => {
      docker.run(config.baseImage, config.command, process.stdout, options, function(err, data) {
        let success = true
        if (err) {
          send({
            type: 'error',
            payload: {
              type: 'TimeoutError',
              message: `RuntimeError: Script took to long to complete.`,
            },
          })
          success = false
        }

        send({ type: 'end', payload: success, channel: 'runtime' })
      });
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
