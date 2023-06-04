require('dotenv').config()
import 'module-alias/register'

import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import { cors } from 'middleware'
import * as http from 'http'
import * as WebSocket from 'ws'

import * as repl from 'lib/repl'

import { v1 } from './routes'

const port = process.env.PORT

async function run() {
  const app = express()
  const server = http.createServer(app)
  const wss = new WebSocket.Server({ server })

  wss.on('connection', (ws: WebSocket) => {
    ws.on('message', async (message: string) => {
      const { action, payload } = JSON.parse(message)
      switch (action) {
        case 'repl': {
          const id = await repl.prepare(payload.code, payload.language)
          await repl.run(id, payload.language, ws)
          break
        }
      }
    })
  })

  app.use(cors)
  app.use(bodyParser.json())
  app.use(cookieParser())

  app.use('/v1', v1)

  server.listen(port, () => {
    console.log(`listening on http://localhost:${port}`)
  })
}

run()
