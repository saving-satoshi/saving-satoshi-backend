require('dotenv').config()
import 'module-alias/register'
import logger from 'lib/logger'
import { createApp } from 'lib/app'
import { disconnectFromDb } from 'lib/prisma'
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
    await disconnectFromDb()
    process.exit(0)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('uncaughtException', (error) =>
    shutdown('uncaughtException', error)
  )
  process.on('unhandledRejection', (reason) =>
    shutdown('unhandledRejection', reason)
  )
}

run()
