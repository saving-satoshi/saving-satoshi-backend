import * as http from 'http'
import * as WebSocket from 'ws'
import express from 'express'
import * as repl from './repl'

export interface Logger {
  info: (message: string, ...args: any[]) => void
  error: (message: string, ...args: any[]) => void
}

export interface ServerOptions {
  logger?: Logger
}

export interface ServerInstance {
  server: http.Server
  wss: WebSocket.Server
}

/**
 * Extracts a unique socket ID from the request socket.
 */
function getSocketId(socket: any): string {
  return `${socket.remoteAddress}:${socket.remotePort}`
}

/**
 * Creates a WebSocket message handler for the REPL service.
 */
function createMessageHandler(logger?: Logger) {
  return async (ws: WebSocket.WebSocket, socketId: string, message: string) => {
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
            logger?.error('REPL execution failed:', ex)
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
      logger?.error('WebSocket message error:', error)
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
  }
}

/**
 * Creates an HTTP server with WebSocket support from an Express application.
 * This factory is used by both production and test servers to ensure consistency.
 */
export function createServer(app: express.Application, options: ServerOptions = {}): ServerInstance {
  const { logger } = options

  const server = http.createServer(app)
  const wss = new WebSocket.Server({ server })

  const handleMessage = createMessageHandler(logger)

  wss.on('connection', (ws: WebSocket.WebSocket, request: http.IncomingMessage) => {
    const socketId = getSocketId(request.socket)

    logger?.info(`New WebSocket connection: ${socketId}`)
    ws.send(JSON.stringify({ type: 'connected', payload: 'WebSocket connection established' }))

    ws.on('close', () => {
      logger?.info(`Connection closed: ${socketId}`)
    })

    ws.on('message', async (message: string) => {
      await handleMessage(ws, socketId, message)
    })
  })

  return { server, wss }
}

/**
 * Gracefully shuts down the server, closing all connections and stopping containers.
 */
export async function shutdownServer(instance: ServerInstance, logger?: Logger): Promise<void> {
  const { server, wss } = instance

  // Close all WebSocket connections
  wss.clients.forEach((client) => {
    client.close()
  })
  wss.close()

  // Close HTTP server
  await new Promise<void>((resolve, reject) => {
    server.close((err) => {
      if (err) reject(err)
      else resolve()
    })
  })

  // Shutdown REPL containers
  await repl.shutdown()

  logger?.info('Server shutdown complete')
}
