require('dotenv').config()
import 'module-alias/register'

import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import * as http from 'http'
import * as WebSocket from 'ws'
import * as repl from 'lib/repl'

import { v1 } from './routes'

const port = process.env.PORT

const JOBS = {}
const WHITELIST = process.env.WHITELIST.split(',').map((a) => a.trim())

const ALLOWED_ORIGINS = [
  'https://savingsatoshi.com',
  'https://dev.savingsatoshi.com',
  'https://vercel.com',
  ...WHITELIST,
]

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

  app.use((req, res, next) => {
    const origin = req.headers.origin

    if (process.env.ENV === 'development') {
      res.setHeader('Access-Control-Allow-Origin', '*')
    } else if (ALLOWED_ORIGINS.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin)
    }

    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    )

    next()
  })

  app.use(bodyParser.json())
  app.use(cookieParser())

  app.use('/v1', v1)

  server.listen(port, () => {
    console.log(`listening on http://localhost:${port}`)
  })
}

run()
