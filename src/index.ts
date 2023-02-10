require('dotenv').config()

import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'

import { v1 } from './routes'

const port = process.env.PORT || 3001

async function run() {
  const app = express()

  app.use(bodyParser.json())
  app.use(cookieParser())

  app.use('/v1', v1)

  app.listen(port || 3001, () => {
    console.log(`listening on http://localhost:${port}`)
  })
}

run()
