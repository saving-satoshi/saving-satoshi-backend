import { PrismaClient } from '@prisma/client'
import express from 'express'
import * as http from 'http'
import * as WebSocket from 'ws'
import routes from 'routes/v1'
import cors from 'middleware/cors'
import { createMessageHandler, sendConnectedMessage } from 'lib/websocket'

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

  const handleMessage = createMessageHandler()

  wss.on('connection', (ws: WebSocket.WebSocket, request: http.IncomingMessage) => {
    const socketId = getSocketId(request.socket)

    sendConnectedMessage(ws)

    ws.on('message', async (message: string) => {
      await handleMessage(ws, socketId, message)
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
