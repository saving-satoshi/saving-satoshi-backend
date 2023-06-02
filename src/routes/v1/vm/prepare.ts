import path from 'path'
import fs from 'fs/promises'
import { Router } from 'express'
import { v4 as uuid } from 'uuid'

import { LANG_PATH, SUPPORTED_LANGUAGES } from 'config'

const router = Router()

router.post('/', async (req, res) => {
  const { language, code } = req.body

  if (!code || !language || SUPPORTED_LANGUAGES.indexOf(language) === -1) {
    return res.status(400).json({ error: 'Bad request' })
  }

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

  res.status(200).json({ id })
})

export default router
