import { PrismaClient } from '@prisma/client'
import * as http from 'http'
import * as WebSocket from 'ws'
import { createApp } from 'lib/app'
import { createServer, shutdownServer, ServerInstance } from 'lib/server'

export const prisma = new PrismaClient()

export let server: http.Server
export let wss: WebSocket.Server
export let testApp: ReturnType<typeof createApp>

let serverInstance: ServerInstance

beforeAll(async () => {
  testApp = createApp()
  serverInstance = createServer(testApp)
  server = serverInstance.server
  wss = serverInstance.wss

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
  await shutdownServer(serverInstance)
  await prisma.$disconnect()
})
