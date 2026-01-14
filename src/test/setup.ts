import { PrismaClient } from '@prisma/client'
import express from 'express'
import * as http from 'http'
import * as WebSocket from 'ws'
import routes from 'routes/v1'
import cors from 'middleware/cors'
import * as repl from 'lib/repl'

export const prisma = new PrismaClient()

export function createTestApp() {
  const app = express()
  app.use(express.json())
  app.use(cors)
  app.use('/api/v1', routes)
  return app
}

function getSocketId(socket: any) {
  return `${socket.remoteAddress}:${socket.remotePort}`
}

export function createTestServerWithWebSocket() {
  const app = createTestApp()
  const server = http.createServer(app)
  const wss = new WebSocket.Server({ server })

  wss.on('connection', (ws: WebSocket.WebSocket, request: http.IncomingMessage) => {
    const socketId = getSocketId(request.socket)

    ws.send(
      JSON.stringify({
        type: 'connected',
        payload: 'WebSocket connection established',
      })
    )

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
              await repl.run(payload.code, payload.language, {
                socket: ws,
                socketId,
              })
            } catch (ex: any) {
              ws.send(
                JSON.stringify({
                  type: 'error',
                  payload: {
                    type: 'SystemError',
                    message: ex.message || 'Failed to execute code',
                  },
                })
              )
            }
            break
          }
          default:
            throw new Error(`Unknown action: ${action}`)
        }
      } catch (error: any) {
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
  })

  return { app, server, wss }
}

export let server: http.Server
export let testApp: express.Application
export let wss: WebSocket.Server

beforeAll(async () => {
  const result = createTestServerWithWebSocket()
  testApp = result.app
  server = result.server
  wss = result.wss

  await new Promise<void>((resolve) => {
    server.listen(0, resolve)
  })

  await prisma.$connect()
})

afterEach(async () => {
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `

  for (const { tablename } of tables) {
    if (tablename !== '_prisma_migrations') {
      await prisma.$executeRawUnsafe(
        `TRUNCATE TABLE "public"."${tablename}" CASCADE;`
      )
    }
  }
})

afterAll(async () => {
  // Close all WebSocket connections
  wss.clients.forEach((client) => {
    client.close()
  })
  wss.close()

  await new Promise<void>((resolve, reject) => {
    server.close((err) => {
      if (err) reject(err)
      else resolve()
    })
  })

  await prisma.$disconnect()
})
