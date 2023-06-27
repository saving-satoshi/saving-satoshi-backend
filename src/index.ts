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

const JOBS = {}

function getSocketId(socket) {
  return `${socket.remoteAddress}:${socket.remotePort}`
}

async function run() {
  const app = express()
  const server = http.createServer(app)
  const wss = new WebSocket.Server({ server })

  wss.on('connection', (ws: WebSocket, request: any) => {
    const socketId = getSocketId(request.socket)

    ws.on('close', () => {
      const job = JOBS[socketId]
      job.onKill()
      delete JOBS[socketId]
    })

    ws.on('message', async (message: string) => {
      const { action, payload } = JSON.parse(message)
      switch (action) {
        case 'repl': {
          try {
            const id = await repl.prepare(payload.code, payload.language)
            JOBS[socketId] = { id, container: undefined, onKill: () => {} }
            await repl.run(id, payload.language, {
              socket: ws,
              jobs: JOBS,
              socketId,
            })
          } catch (ex) {
            console.log(ex)
          }
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
