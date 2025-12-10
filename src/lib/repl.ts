import path from 'path'
import fs from 'fs/promises'
import { v4 as uuid } from 'uuid'
import Docker from 'lib/docker'
import {
  BASE_IMAGE_NAMES,
  LANG_PATH,
  LANGUAGE_CMD,
} from 'config'
import Stream from './stream'
import logger from './logger'

export async function run(code: string, language: string, context: any) {
  if (!context.jobs) throw new Error('JobManager not initialized')

  const id = uuid()
  const rpath = path.join(LANG_PATH, language, id)
  await fs.mkdir(rpath, { recursive: true })

  const decodedCode = Buffer.from(code, 'base64').toString('utf-8')

  switch (language) {
    case 'javascript':
      await fs.writeFile(path.join(rpath, 'index.js'), decodedCode, 'utf-8')
      break
    case 'python':
      await fs.writeFile(path.join(rpath, 'main.py'), decodedCode, 'utf-8')
      break

    // No new languages this can go
    case 'go':
      await fs.writeFile(path.join(rpath, 'main.go'), decodedCode, 'utf-8')
      await fs.copyFile(
        path.join(LANG_PATH, 'go', 'go.mod'),
        path.join(rpath, 'go.mod')
      )
      break
    case 'rust':
      await fs.mkdir(path.join(rpath, 'src'))
      await fs.copyFile(
        path.join(LANG_PATH, 'rust', 'Cargo.toml'),
        path.join(rpath, 'Cargo.toml')
      )
      await fs.writeFile(
        path.join(rpath, 'src', 'main.rs'),
        decodedCode,
        'utf-8'
      )
      break
    case 'cpp':
      await fs.writeFile(path.join(rpath, 'main.cpp'), decodedCode, 'utf-8')
      break
    default:
      throw new Error(`Unsupported language: ${language}`)
  }

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

    const baseImage = BASE_IMAGE_NAMES[language]

    const success = await Docker.runContainer(
      id,
      baseImage,
      rpath,
      send,
      runStream,
      {
        socketId: context.socketId,
        jobs: context.jobs,
        volume: `${rpath}:/usr/app/user`,
        cmd: LANGUAGE_CMD[language],
        workingDir: '/usr/app/user',
        memory: 256 * 1024 * 1024,
        cpuShares: 512,
        timeout: Number(process.env.MAX_SCRIPT_EXECUTION_TIME) || 15000,
      }
    )

    if (!success) {
      send({
        type: 'error',
        payload: {
          type: 'TimeoutError',
          message: `RuntimeError: Script took to long to complete.`,
        },
      })
    }

    send({ type: 'end', payload: success, channel: 'runtime' })
  } catch (ex) {
    logger.error('Container execution failed:', ex)
    await context.jobs.cleanup(context.socketId)

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
      await context.jobs.cleanup(context.socketId)
    } catch (error) {
      logger.error('Cleanup failed:', error)
    }
  }
}
