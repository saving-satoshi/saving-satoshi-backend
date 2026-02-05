import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import cors from 'middleware/cors'
import { v1 } from '../routes'

/**
 * Creates and configures the Express application with all middleware and routes.
 * This factory is used by both production and test servers to ensure consistency.
 */
export function createApp(): express.Application {
  const app = express()

  app.use(cors)
  app.use(bodyParser.json())
  app.use(cookieParser())
  app.use('/v1', v1)

  return app
}
