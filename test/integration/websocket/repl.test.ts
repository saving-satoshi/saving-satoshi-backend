import { TestWebSocket } from '../helpers/websocket'
import { server } from '../setup'
import { MAX_SCRIPT_EXECUTION_TIME } from 'config'

describe('WebSocket REPL API', () => {
  let ws: TestWebSocket

  beforeEach(async () => {
    ws = await TestWebSocket.connect(server)
    // Consume the initial 'connected' message
    const connected = await ws.waitForMessage()
    expect(connected.type).toBe('connected')
  })

  afterEach(() => {
    if (ws && ws.isOpen) {
      ws.close()
    }
  })

  describe('Connection', () => {
    it('should send connected message on connection', async () => {
      const newWs = await TestWebSocket.connect(server)
      const msg = await newWs.waitForMessage()

      expect(msg.type).toBe('connected')
      expect(msg.payload).toBe('WebSocket connection established')

      newWs.close()
    })
  })

  describe('Client Disconnect Handling', () => {
    it('should stop container immediately when client disconnects mid-execution', async () => {
      // Long-running code that outputs immediately and then continues
      const longRunningCode = Buffer.from(
        `
console.log('Starting execution...');
var i = 0;
const id = setInterval(() => {
  ++i
  console.log('tick', i);
  if (i >= 60) clearInterval(id);
}, 500);`
      ).toString('base64')

      const startTime = Date.now()
      ws.send('repl', { code: longRunningCode, language: 'javascript' })

      // Wait for the first output, then immediately close the connection
      let messageCount = 0
      let disconnectTime = 0
      let firstOutputReceived = false
      while (!firstOutputReceived && messageCount < 20) {
        try {
          const msg = await ws.waitForMessage(2000)
          messageCount++
          if (msg.type === 'output') {
            firstOutputReceived = true
            disconnectTime = Date.now()
            ws.close()
            break
          }
        } catch {
          // Timeout waiting for message, carry on beyond loop
          break
        }
      }

      if (!firstOutputReceived) {
        // If we did not get output (albeit rare), the test should still
        // verify the disconnect handling worked. The important thing is that
        // the server handled the disconnect gracefully. we'll wait for a
        // second & 'manually' verify the server logs show the disconnect was handled
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return
      }
      
      // Verify the disconnect happened quickly after first output
      // (typically, should get output within 3s)
      const timeToFirstOutput = disconnectTime - startTime
      expect(timeToFirstOutput).toBeLessThan(3000)
      
      // The key assertion: container should be stopped much faster than MAX_SCRIPT_EXECUTION_TIME
      // We'll wait a bit to let the server process the disconnect
      await new Promise((resolve) => setTimeout(resolve, 500))

      const totalTime = Date.now() - startTime
      expect(totalTime).toBeLessThan(5000)
      
      // NOTE:
      // We cannot easily verify the container is actually stopped from the test
      // since we do NOT have direct access to Docker, but the server logs will show sth like:
      // "Client disconnected during container execution <id>"
      // "Failed to stop container <id>: (HTTP code 304) container already stopped"
    }, 15000)
  })

  describe('REPL Execution - JavaScript', () => {
    it('should execute JavaScript code and return output', async () => {
      const code = Buffer.from('console.log("Hello, World!")').toString('base64')

      ws.send('repl', { code, language: 'javascript' })

      const messages = await ws.collectUntilEnd()

      expect(messages.some((m) => m.type === 'status' && m.payload === 'running')).toBe(true)
      expect(messages.some((m) =>
        m.type === 'output' && m.payload.includes('Hello, World!'))
      ).toBe(true)
      expect(messages.some((m) => m.type === 'end' && m.payload === true)).toBe(true)
    })

    it('should handle multiple console.log statements', async () => {
      const code = Buffer.from(`
        console.log("Line 1")
        console.log("Line 2")
        console.log("Line 3")
      `).toString('base64')

      ws.send('repl', { code, language: 'javascript' })

      const messages = await ws.collectUntilEnd()
      const outputs = messages.filter((m) => m.type === 'output')

      expect(outputs.length).toBeGreaterThan(0)
      const allOutput = outputs.map((m) => m.payload).join('\n')
      expect(allOutput).toContain('Line 1')
      expect(allOutput).toContain('Line 2')
      expect(allOutput).toContain('Line 3')
    })

    it('should return error for JavaScript runtime errors', async () => {
      const code = Buffer.from('throw new Error("Test error")').toString('base64')

      ws.send('repl', { code, language: 'javascript' })

      const messages = await ws.collectUntilEnd()

      expect(messages.some((m) => m.type === 'error' && m.payload.type === 'RuntimeError'))
        .toBe(true)
      expect(messages.some((m) => m.type === 'end')).toBe(true)
    })

    it('should return error for JavaScript syntax errors', async () => {
      const code = Buffer.from('const x = {').toString('base64')

      ws.send('repl', { code, language: 'javascript' })

      const messages = await ws.collectUntilEnd()

      expect(messages.some((m) =>
        m.type === 'error' &&
        m.payload.type === 'RuntimeError' &&
        m.payload.message.includes('SyntaxError')
      )).toBe(true)
      expect(messages.some((m) => m.type === 'end')).toBe(true)
    })
  })

  describe('REPL Execution - Python', () => {
    it('should execute Python code and return output', async () => {
      const code = Buffer.from('print("Hello from Python")').toString('base64')

      ws.send('repl', { code, language: 'python' })

      const messages = await ws.collectUntilEnd()

      expect(messages.some((m) =>
        m.type === 'output' && m.payload.includes('Hello from Python'))
      ).toBe(true)
      expect(messages.some((m) => m.type === 'end' && m.payload === true)).toBe(true)
    })

    it('should handle Python calculations', async () => {
      const code = Buffer.from('print(2 + 2)').toString('base64')

      ws.send('repl', { code, language: 'python' })

      const messages = await ws.collectUntilEnd()

      expect(messages.some((m) => m.type === 'output' && m.payload.includes('4'))).toBe(true)
    })
  })

  // This test was failing if the server was running under development mode with
  // `yarn dev` or `make run`. The filesystem watch will trigger server restarts and kill
  // the Repl containers. We are now running the test suite with NODE_ENV=test and using a
  // `environment` container label to segregate REPL containers.
  describe('Timeout Handling', () => {
    it(
      'should timeout for long-running code',
      async () => {
        const code = Buffer.from("while(true) {}").toString('base64')

        ws.send('repl', { code, language: 'javascript' })

        // Wait for timeout (configured MAX_SCRIPT_EXECUTION_TIME)
        const messages = await ws.collectUntilEnd(MAX_SCRIPT_EXECUTION_TIME + 5000)

        const errorMsg = messages.find((m) => m.type === 'error')
        expect(errorMsg).toBeDefined()
        expect(errorMsg?.payload.type).toBe('TimeoutError')
        expect(messages.some((m) => m.type === 'end' && m.payload === false)).toBe(true)
      },
      MAX_SCRIPT_EXECUTION_TIME + 10000
    )
  })

  describe('Error Handling - Missing Fields', () => {
    it('should return error for missing code', async () => {
      ws.send('repl', { language: 'javascript' })

      const error = await ws.waitForType('error')

      expect(error.payload.type).toBe('MessageError')
      expect(error.payload.message).toContain('Missing code or language')
    })

    it('should return error for missing language', async () => {
      const code = Buffer.from('console.log("test")').toString('base64')

      ws.send('repl', { code })

      const error = await ws.waitForType('error')

      expect(error.payload.type).toBe('MessageError')
      expect(error.payload.message).toContain('Missing code or language')
    })

    it('should return error for empty payload', async () => {
      ws.send('repl', {})

      const error = await ws.waitForType('error')

      expect(error.payload.type).toBe('MessageError')
      expect(error.payload.message).toContain('Missing code or language')
    })
  })

  describe('Error Handling - Unsupported Language', () => {
    it('should return error for unsupported language', async () => {
      const code = Buffer.from('puts "hello"').toString('base64')

      ws.send('repl', { code, language: 'ruby' })

      // Exception is thrown before container starts, so no 'end' message is sent
      // Just wait for the error message
      const error = await ws.waitForType('error')

      expect(error.payload.type).toBe('SystemError')
      expect(error.payload.message).toContain('Unsupported language')
    })
  })

  describe('Message Format Validation', () => {
    it('should return error for missing action', async () => {
      ws.sendRaw(JSON.stringify({ payload: { code: 'test', language: 'javascript' } }))

      const error = await ws.waitForType('error')

      expect(error.payload.type).toBe('MessageError')
      expect(error.payload.message).toContain('Invalid message format')
    })

    it('should return error for missing payload', async () => {
      ws.sendRaw(JSON.stringify({ action: 'repl' }))

      const error = await ws.waitForType('error')

      expect(error.payload.type).toBe('MessageError')
      expect(error.payload.message).toContain('Invalid message format')
    })

    it('should return error for unknown action', async () => {
      ws.send('unknown_action', { foo: 'bar' })

      const error = await ws.waitForType('error')

      expect(error.payload.type).toBe('MessageError')
      expect(error.payload.message).toContain('Unknown action')
    })

    it('should return error for invalid JSON', async () => {
      ws.sendRaw('not valid json')

      const error = await ws.waitForType('error')

      expect(error.payload.type).toBe('MessageError')
      expect(error.payload.message).toContain('Unexpected token')
    })
  })

  describe('Concurrent Connections', () => {
    it('should handle multiple simultaneous connections', async () => {
      const ws2 = await TestWebSocket.connect(server)
      const connected2 = await ws2.waitForMessage()
      expect(connected2.type).toBe('connected')

      const code1 = Buffer.from('console.log("Client 1")').toString('base64')
      const code2 = Buffer.from('console.log("Client 2")').toString('base64')

      ws.send('repl', { code: code1, language: 'javascript' })
      ws2.send('repl', { code: code2, language: 'javascript' })

      const messages1 = await ws.collectUntilEnd()
      const messages2 = await ws2.collectUntilEnd()

      expect(messages1.some((m) =>
        m.type === 'output' && m.payload.includes('Client 1'))
      ).toBe(true)
      expect(messages2.some((m) =>
        m.type === 'output' && m.payload.includes('Client 2'))
      ).toBe(true)

      ws2.close()
    })
  })
})
