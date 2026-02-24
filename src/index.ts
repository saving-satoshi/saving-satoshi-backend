require('dotenv').config()
import 'module-alias/register'
import logger from 'lib/logger'
import cron from 'node-cron'

import { v1 } from './routes'

import { JobManager } from './lib/jobManager'
import { killContainers } from 'lib/docker'
import { CONTAINERS_SCHEDULE } from 'config'
import { registerShutdownHooks, registerFatalExitHandlers } from 'lib/utils'
import { createApp } from 'lib/app'
import { createServer, shutdownServer, ServerInstance } from 'lib/server'

const port = process.env.PORT

async function run() {
  const app = createApp()
  logger.info(`App initialized in ${app.get('env')} mode`)

  const instance = createServer(app, { logger })

  instance.server.listen(port, () => {
    logger.info(`Listening on http://localhost:${port}`)
  })

  app.use(bodyParser.json())
  app.use(cookieParser())

  app.disable('etag')
  app.disable('x-powered-by')
  app.use((_req, res, next) => {
    // browsers should not cache api responses due to how dynamic the data is
    res.setHeader('Cache-Control', 'no-store')
    next()
  })

  app.use('/v1', v1)

  server.listen(port, () => {
    logger.info(`listening on http://localhost:${port}`)
  })

  // cleanup handling
  registerShutdownHooks(server)
  registerFatalExitHandlers()
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
