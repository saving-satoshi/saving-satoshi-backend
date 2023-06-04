import path from 'path'
import fs from 'fs/promises'
import { v4 as uuid } from 'uuid'
import Docker from 'lib/docker'

import { LANG_PATH } from 'config'
import Stream from './stream'

export async function prepare(code: string, language: string) {
  const id = uuid()
  const rpath = path.join(LANG_PATH, language, id)
  await fs.mkdir(rpath)
  await fs.cp(
    path.join(LANG_PATH, language, 'Dockerfile'),
    path.join(rpath, 'Dockerfile')
  )

  switch (language) {
    case 'python': {
      await fs.writeFile(path.join(rpath, 'main.py'), code, 'utf-8')
      break
    }
    case 'javascript': {
      await fs.writeFile(path.join(rpath, 'index.js'), code, 'utf-8')
      await fs.copyFile(
        path.join(LANG_PATH, language, 'package.json'),
        path.join(rpath, 'package.json')
      )
      break
    }
    case 'go': {
      await fs.writeFile(path.join(rpath, 'main.go'), code, 'utf-8')
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
      await fs.writeFile(path.join(rpath, 'src', 'main.rs'), code, 'utf-8')
      break
    }
    case 'cpp': {
      await fs.writeFile(path.join(rpath, 'main.cpp'), code, 'utf-8')
      break
    }
  }

  return id
}

export async function run(id: string, language: string, ws: any) {
  const rpath = path.join(LANG_PATH, language, id)

  let hasCompilationError = false

  const sourceFiles = {
    python: ['Dockerfile', 'main.py'],
    javascript: ['Dockerfile', 'index.js', 'package.json'],
    rust: ['Dockerfile', 'src/main.rs', 'Cargo.toml'],
    go: ['Dockerfile', 'main.go', 'go.mod'],
    cpp: ['Dockerfile', 'main.cpp'],
  }

  const send = (payload) => {
    ws.send(JSON.stringify({ ...payload, payload: payload.payload }))
  }

  const runStream = new Stream(send, language, (r) => r, 'output')
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

            val
              .split('\n')
              .forEach((l) => runStream.send({ type: 'error', payload: l }))

            return null
          }
          break
        }
        case 'go': {
          const regex = /error(.*?):/gim
          if (regex.test(val)) {
            hasCompilationError = true
            runStream.send({ type: 'error', payload: val })
            return null
          }
          break
        }
        case 'cpp': {
          const regex = /error(.*?):/gim
          if (regex.test(val)) {
            hasCompilationError = true
            runStream.send({ type: 'error', payload: val })
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
    send({
      type: 'debug',
      payload: '[system] Building image...',
      channel: 'build',
    })
    await Docker.buildImage(rpath, id, buildStream, sourceFiles[language])
  } catch (ex) {
    console.log(ex)
    send({
      type: 'debug',
      payload: `[system] Error building image: ${ex.message}`,
      channel: 'build',
    })
  }

  if (hasCompilationError) {
    send({
      type: 'debug',
      payload: `[system] Error building image.`,
      channel: 'build',
    })
    await fs.rm(rpath, { recursive: true })
    return
  }

  send({
    type: 'debug',
    payload: '[system] Image built.',
    channel: 'build',
  })

  send({
    type: 'debug',
    payload: '[system] Running container...',
    channel: 'runtime',
  })

  try {
    const [data, container] = await Docker.runContainer(id, runStream)
  } catch (ex) {
    console.log(ex)
    send({
      type: 'output',
      payload: `[system] Error running container: ${ex.message}`,
      channel: 'runtime',
    })
  }

  send({
    type: 'debug',
    payload: '[system] Cleaning up...',
    channel: 'runtime',
  })

  await fs.rm(rpath, { recursive: true })
}