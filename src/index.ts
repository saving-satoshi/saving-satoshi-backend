require('dotenv').config()
import 'module-alias/register'
import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import * as http from 'http'
import * as WebSocket from 'ws'
import * as repl from 'lib/repl'
import logger from 'lib/logger'

import { v1 } from './routes'

import { JobManager } from './lib/jobManager'

const jobManager = new JobManager()

const port = process.env.PORT

const JOBS = {}
const WHITELIST = process.env.WHITELIST.split(',').map((a) => a.trim())

function isAllowedOrigin(origin: string): boolean {
  const allowedOrigins = [
    'https://savingsatoshi.com',
    'https://dev.savingsatoshi.com',
    'https://vercel.com',
    ...WHITELIST,
  ]
  return allowedOrigins.includes(origin) || origin.endsWith('vercel.app')
}

function getSocketId(socket) {
  return `${socket.remoteAddress}:${socket.remotePort}`
}

async function run() {
  const app = express()
  const server = http.createServer(app)
  const wss = new WebSocket.Server({ server })

  // WebSocket connection handler
  wss.on(
    'connection',
    (ws: WebSocket.WebSocket, request: http.IncomingMessage) => {
      const socketId = getSocketId(request.socket)
      const jobManager = new JobManager()

      logger.info(`New WebSocket connection: ${socketId}`)

      // Send initial connection success message
      ws.send(
        JSON.stringify({
          type: 'connected',
          payload: 'WebSocket connection established',
        })
      )

      ws.on('close', async () => {
        logger.info(`Connection closed: ${socketId}`)
        if (jobManager.has(socketId)) {
          await jobManager.cleanup(socketId)
        }
      })

      ws.on('message', async (message: string) => {
        try {
          const data = JSON.parse(message.toString())
          const { action, payload } = data

          if (!action || !payload) {
            throw new Error('Invalid message format')
          }

          switch (action) {
            case 'repl': {
              if (!payload.code || !payload.language) {
                throw new Error('Missing code or language')
              }

              try {
                const id = await repl.prepare(payload.code, payload.language)
                jobManager.create(socketId, id)
                await repl.run(id, payload.language, {
                  socket: ws,
                  jobs: jobManager,
                  socketId,
                })
              } catch (ex) {
                logger.error('REPL execution failed:', ex)
                ws.send(
                  JSON.stringify({
                    type: 'error',
                    payload: {
                      type: 'SystemError',
                      message: 'Failed to execute code',
                    },
                  })
                )
              }
              break
            }
            default:
              throw new Error(`Unknown action: ${action}`)
          }
        } catch (error) {
          logger.error('WebSocket message error:', error)
          ws.send(
            JSON.stringify({
              type: 'error',
              payload: {
                type: 'MessageError',
                message: error.message,
              },
            })
          )
        }
      })
    }
  )

  app.use((req, res, next) => {
    const origin = req.headers.origin

    if (process.env.ENV === 'development' || !origin) {
      res.setHeader('Access-Control-Allow-Origin', '*')
    } else if (isAllowedOrigin(origin)) {
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
