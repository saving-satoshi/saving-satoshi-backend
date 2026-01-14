require('dotenv').config()
import 'module-alias/register'
import logger from 'lib/logger'
import { createApp } from 'lib/app'
import { createServer, shutdownServer, ServerInstance } from 'lib/server'

const port = process.env.PORT

async function run() {
  const app = createApp()
  const instance = createServer(app, { logger })

  instance.server.listen(port, () => {
    console.log(`listening on http://localhost:${port}`)
  })

  // Graceful shutdown handler
  async function shutdown(signal: string) {
    logger.info(`${signal} received, shutting down gracefully...`)
    await shutdownServer(instance, logger)
    process.exit(0)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

run()
