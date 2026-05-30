require('dotenv').config()
import 'module-alias/register'
import logger from 'lib/logger'
import { createApp } from 'lib/app'
import { prismaClient } from 'lib/prisma'
import { createServer, shutdownServer } from 'lib/server'

const port = process.env.PORT

// Shutdown timeout in milliseconds (30 seconds to allow WebSocket connections to complete)
const SHUTDOWN_TIMEOUT = 30000

async function run() {
  const app = createApp()
  logger.info(`App initialized in ${app.get('env')} mode`)

  const instance = createServer(app, { logger })

  instance.server.listen(port, () => {
    logger.info(`Listening on http://localhost:${port}`)
  })

  // Track if shutdown is in progress to prevent multiple shutdown attempts
  let isShuttingDown = false

  // Graceful shutdown handler with timeout
  async function shutdown(signal: string) {
    if (isShuttingDown) {
      logger.warn(`${signal} received during shutdown, ignoring...`)
      return
    }
    isShuttingDown = true

    logger.info(`${signal} received, shutting down gracefully...`)

    // Set a hard timeout to force exit if graceful shutdown takes too long
    const shutdownTimeout = setTimeout(() => {
      logger.error('Shutdown timeout reached, forcing exit')
      process.exit(1)
    }, SHUTDOWN_TIMEOUT)

    try {
      // Stop accepting new connections and close existing ones gracefully
      await shutdownServer(instance, logger)
      logger.info('Server shutdown complete')

      // Disconnect from database
      await prismaClient.$disconnect()
      logger.info('Database disconnected')

      clearTimeout(shutdownTimeout)
      process.exit(0)
    } catch (error) {
      logger.error(`Error during shutdown: ${formatError(error)}`)
      clearTimeout(shutdownTimeout)
      process.exit(1)
    }
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
