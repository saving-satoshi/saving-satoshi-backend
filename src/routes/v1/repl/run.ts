import path from 'path'
import fs from 'fs/promises'
import { exists } from 'lib/fs'
import Stream from 'lib/stream'
import { Router } from 'express'
import Docker from 'lib/docker'
import { LANG_PATH } from 'config'

const router = Router()

router.get('/:language/:id', async (req, res) => {
  const { language, id } = req.params

  if (!language || !id) {
    return res.status(400).json({ error: 'Bad request' })
  }

  const rpath = path.join(LANG_PATH, language, id)
  const taskExists = await exists(rpath)
  if (!taskExists) {
    return res.status(400).json({ error: 'Invalid ID' })
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
  })

  let hasCompilationError = false

  const runStream = new Stream(res, language, (r) => r, 'output')
  const buildStream = new Stream(
    res,
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

  const sourceFiles = {
    python: ['Dockerfile', 'main.py'],
    javascript: ['Dockerfile', 'index.js', 'package.json'],
    rust: ['Dockerfile', 'src/main.rs', 'Cargo.toml'],
    go: ['Dockerfile', 'main.go', 'go.mod'],
    cpp: ['Dockerfile', 'main.cpp'],
  }

  try {
    buildStream.send({ type: 'debug', payload: '[system] Building image...' })
    await Docker.buildImage(rpath, id, buildStream, sourceFiles[language])
  } catch (ex) {
    console.log(ex)
    buildStream.send({
      type: 'debug',
      payload: `[system] Error building image: ${ex.message}`,
    })
  }

  if (hasCompilationError) {
    buildStream.send({
      type: 'debug',
      payload: `[system] Error building image.`,
    })
    buildStream.end()
    runStream.end()
    res.status(400).end()
    await fs.rm(rpath, { recursive: true })
    return
  }

  buildStream.send({ type: 'debug', payload: '[system] Image built.' })

  runStream.send({
    type: 'debug',
    payload: '[system] Running container...',
  })

  try {
    const [data, container] = await Docker.runContainer(id, runStream)
  } catch (ex) {
    console.log(ex)
    runStream.send({
      type: 'output',
      payload: `[system] Error running container: ${ex.message}`,
    })
  }

  runStream.send({ type: 'debug', payload: '[system] Cleaning up...' })

  await fs.rm(rpath, { recursive: true })

  buildStream.end()
  runStream.end()
  res.status(200).end()
})

export default router
