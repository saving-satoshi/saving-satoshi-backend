require('dotenv').config()
import 'module-alias/register'

import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'

import { v1 } from './routes'

const port = process.env.PORT

async function run() {
  const app = express()

  app.use(bodyParser.json())
  app.use(cookieParser())

  app.use('/v1', v1)

  app.get('*', (req, res) => res.sendStatus(200))

  app.listen(port, () => {
    console.log(`listening on http://localhost:${port}`)
  })
}

run()
