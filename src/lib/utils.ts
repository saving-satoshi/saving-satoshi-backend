import * as http from 'http'
import Joi from 'joi'
import { disconnectFromDb } from './prisma'
import logger from './logger'

export function formatValidationErrors(error: Joi.ValidationError) {
  return error.details.map((d) => {
    return {
      key: d.path,
      message: d.message,
    }
  })
}

export function registerShutdownHooks(server: http.Server) {
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  // ===
  function shutdown(signal: string) {
    logger.info(`Shutting down server on ${signal}.`)
    server.close(async () => {
      await disconnectFromDb()
      process.exit(0)
    })
  }
}

export function registerFatalExitHandlers() {
  process.on('uncaughtException', async (error) => {
    logger.error('Uncaught exception:', error)
    await disconnectFromDb()
    process.exit(1)
  })

  process.on('unhandledRejection', async (error) => {
    logger.error('Unhandled rejection:', error)
    await disconnectFromDb()
    process.exit(1)
  })
}
