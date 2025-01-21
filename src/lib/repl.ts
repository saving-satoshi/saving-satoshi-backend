import path from 'path'
import fs from 'fs/promises'
import { v4 as uuid } from 'uuid'
import Docker from 'lib/docker'
import { JobManager } from 'lib/jobManager'
import { LANG_PATH } from 'config'
import Stream from './stream'
import logger from './logger'

// Prepares a new directory for user code
// Returns a unique ID for this new directory
export async function prepare(code: string, language: string) {
  const decodedCode = Buffer.from(code, 'base64').toString('utf-8')
  const id = uuid()
  const rpath = path.join(LANG_PATH, language, id)
  await fs.mkdir(rpath, { recursive: true })

  switch (language) {
    case 'python': {
      await fs.writeFile(path.join(rpath, 'main.py'), decodedCode, 'utf-8')
      break
    }
    case 'javascript': {
      await fs.writeFile(path.join(rpath, 'index.js'), decodedCode, 'utf-8')
      break
    }
    case 'go': {
      await fs.writeFile(path.join(rpath, 'main.go'), decodedCode, 'utf-8')
      await fs.copyFile(
        path.join(LANG_PATH, language, 'go.mod'),
        path.join(rpath, 'go.mod')
      )
      break
    }
    case 'rust': {
      await fs.mkdir(path.join(rpath, 'src'))
      await fs.copyFile(
        path.join(LANG_PATH, language, 'Cargo.toml'),
        path.join(rpath, 'Cargo.toml')
      )
      await fs.writeFile(
        path.join(rpath, 'src', 'main.rs'),
        decodedCode,
        'utf-8'
      )
      break
    }
    case 'cpp': {
      await fs.writeFile(path.join(rpath, 'main.cpp'), decodedCode, 'utf-8')
      break
    }
  }

  return id
}

export async function run(id: string, language: string, context: any) {
  if (!context.jobs) {
    throw new Error('JobManager not initialized')
  }

  const rpath = path.join(LANG_PATH, language, id)
  let hasCompilationError = false

  const sourceFiles = {
    python: ['Dockerfile', 'main.py'],
    javascript: ['Dockerfile', 'index.js'],
    rust: ['Dockerfile', 'src/main.rs', 'Cargo.toml'],
    go: ['Dockerfile', 'main.go', 'go.mod'],
    cpp: ['Dockerfile', 'main.cpp'],
  }

  // A method to send messages to the frontend via the websocket
  const send = async (payload: any): Promise<void> => {
    context.socket.send(
      JSON.stringify({ ...payload, payload: payload.payload })
    )
    return Promise.resolve()
  }

  // stream to use when running the container
  const runStream = new Stream(send, language, (r) => r, 'output')

  // stream to use when building the image
  const buildStream = new Stream(
    send,
    language,
    (r) => {
      const { stream } = JSON.parse(r)

      if (!stream || stream.trim() === '') {
        return null
      }

      const val = stream.trim()

      switch (language) {
        case 'rust': {
          const regex = /error(.*?):/gim
          if (regex.test(val)) {
            hasCompilationError = true

            val.split('\n').forEach((l) =>
              runStream.send({
                type: 'error',
                payload: { type: 'LanguageError', message: l },
              })
            )

            return null
          }
          break
        }
        case 'go': {
          const regex = /error(.*?):/gim
          if (regex.test(val)) {
            hasCompilationError = true
            runStream.send({
              type: 'error',
              payload: { type: 'LanguageError', message: val },
            })
            return null
          }
          break
        }
        case 'cpp': {
          const regex = /error(.*?):/gim
          if (regex.test(val)) {
            hasCompilationError = true
            runStream.send({
              type: 'error',
              payload: { type: 'LanguageError', message: val },
            })
            console.log(val)
            return null
          }
          break
        }
      }

      return `[docker] ${val}`
    },
    'debug'
  )

  try {
    // Tell the front end the container is running
    send({
      type: 'status',
      payload: 'running',
      channel: 'build',
    })
    const success = await Docker.runContainer(id, send, runStream, {
      socketId: context.socketId,
      jobs: context.jobs,
    })
    await sleep(1000)

    if (!success) {
      send({
        type: 'error',
        payload: {
          type: 'TimeoutError',
          message: `RuntimeError: Script took to long to complete.`,
        },
      })
    }

    send({
      type: 'end',
      payload: success,
      channel: 'runtime',
    })
  } catch (ex) {
    logger.error('Container execution failed:', ex)
    await context.jobs.cleanup(context.socketId)

    send({
      type: 'output',
      payload: `[system] Error running container: ${ex.message}`,
      channel: 'runtime',
    })

    send({
      type: 'end',
      payload: ex.message,
      channel: 'runtime',
    })

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

function sleep(delay = 1000): Promise<void> {
  return new Promise((resolve) => {
    let timeout = setTimeout(() => {
      resolve()
      clearTimeout(timeout)
    }, delay)
  })
}
