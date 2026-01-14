import * as WebSocket from 'ws'
import * as repl from './repl'

export interface Logger {
  info: (message: string, ...args: any[]) => void
  error: (message: string, ...args: any[]) => void
}

export interface WebSocketContext {
  socket: WebSocket.WebSocket
  socketId: string
}

/**
 * Creates a WebSocket message handler for the REPL service.
 * This shared handler is used by both production and test servers to ensure
 * consistent behavior.
 */
export function createMessageHandler(logger?: Logger) {
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
 * Sends the initial connection message to a WebSocket client.
 */
export function sendConnectedMessage(ws: WebSocket.WebSocket) {
  ws.send(
    JSON.stringify({
      type: 'connected',
      payload: 'WebSocket connection established',
    })
  )
}
