require('dotenv').config()
import 'module-alias/register'
import logger from 'lib/logger'
import { createApp } from 'lib/app'
import { prismaClient } from 'lib/prisma'
import { createServer, shutdownServer } from 'lib/server'

const port = process.env.PORT

async function run() {
  const app = createApp()
  logger.info(`App initialized in ${app.get('env')} mode`)

  const instance = createServer(app, { logger })

  instance.server.listen(port, () => {
    logger.info(`Listening on http://localhost:${port}`)
  })

  // Graceful shutdown handler
  async function shutdown(signal: string) {
    logger.info(`${signal} received, shutting down gracefully...`)
    await shutdownServer(instance, logger)
    await prismaClient.$disconnect()
    process.exit(0)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('uncaughtException', (error) => {
    process.stderr.write(`Uncaught Exception: ${formatError(error)}\n`)
    process.exit(1)
  })
  process.on('unhandledRejection', (reason) => {
    process.stderr.write(`Unhandled Rejection at: ${formatError(reason)}\n`)
    process.exit(1)
  })
}
function formatError(error: unknown): string {
  if (error instanceof Error) return error.stack ?? error.message
  try {
    return JSON.stringify(error, null, 2)
  } catch {
    return String(error)
  }
}

run()
