require('dotenv').config()
import 'module-alias/register'

import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'

import { api } from './routes'

const port = process.env.PORT

async function run() {
  const app = express()

  app.use(bodyParser.json())
  app.use(cookieParser())

  app.use('/api', api)

  app.listen(port, () => {
    console.log(`listening on http://localhost:${port}`)
  })
}

run()
