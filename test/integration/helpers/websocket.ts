import WebSocket from 'ws'
import { Server } from 'http'
import { AddressInfo } from 'net'

export interface WSMessage {
  type: string
  payload: any
  channel?: string
}

export class TestWebSocket {
  private ws: WebSocket
  private messages: WSMessage[] = []
  private messagePromises: Array<{
    resolve: (msg: WSMessage) => void
    reject: (err: Error) => void
  }> = []

  constructor(ws: WebSocket) {
    this.ws = ws
    this.ws.on('message', (data) => {
      const msg = JSON.parse(data.toString()) as WSMessage

      // If there's a waiting promise, resolve it directly without storing
      if (this.messagePromises.length > 0) {
        const { resolve } = this.messagePromises.shift()!
        resolve(msg)
      } else {
        // Otherwise, store the message for later retrieval
        this.messages.push(msg)
      }
    })
  }

  static async connect(server: Server): Promise<TestWebSocket> {
    const address = server.address() as AddressInfo
    const url = `ws://localhost:${address.port}`

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url)
      ws.on('open', () => resolve(new TestWebSocket(ws)))
      ws.on('error', reject)
    })
  }

  send(action: string, payload: any): void {
    this.ws.send(JSON.stringify({ action, payload }))
  }

  sendRaw(data: string): void {
    this.ws.send(data)
  }

  async waitForMessage(timeout = 5000): Promise<WSMessage> {
    // Check if we already have a message
    if (this.messages.length > 0) {
      return this.messages.shift()!
    }

    // Wait for next message
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Timeout waiting for WebSocket message'))
      }, timeout)

      this.messagePromises.push({
        resolve: (msg) => {
          clearTimeout(timer)
          resolve(msg)
        },
        reject,
      })
    })
  }

  async waitForType(type: string, timeout = 5000): Promise<WSMessage> {
    const start = Date.now()
    while (Date.now() - start < timeout) {
      const msg = await this.waitForMessage(timeout - (Date.now() - start))
      if (msg.type === type) {
        return msg
      }
    }
    throw new Error(`Timeout waiting for message type: ${type}`)
  }

  async collectUntilEnd(timeout = 30000): Promise<WSMessage[]> {
    const collected: WSMessage[] = []
    const start = Date.now()

    while (Date.now() - start < timeout) {
      try {
        const msg = await this.waitForMessage(timeout - (Date.now() - start))
        collected.push(msg)
        if (msg.type === 'end') {
          break
        }
      } catch (e) {
        // Timeout reached
        break
      }
    }
    return collected
  }

  close(): void {
    this.ws.close()
  }

  get allMessages(): WSMessage[] {
    return [...this.messages]
  }

  get isOpen(): boolean {
    return this.ws.readyState === WebSocket.OPEN
  }
}
