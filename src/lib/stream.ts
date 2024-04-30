import { Writable } from 'stream'
import _ from 'lodash'

class Stream extends Writable {
  send: any
  language: string
  transformer: any
  channel: string
  errorBuffer: any[]
  hasError: boolean
  onKill: () => void

  constructor(send: any, language: string, transformer: any, channel: string) {
    super()
    this.send = send
    this.sendLines = this.sendLines
    this.language = language
    this.transformer = transformer
    this.channel = channel
    this.errorBuffer = []
    this.hasError = false
  }

  sendLines(lines) {
    const joinedLines = lines.map(this.transformer).filter(Boolean).join('');
    if (joinedLines) {
      this.send({
        type: this.channel,
        payload: joinedLines,
      })
    }
  }

  getError(chunk) {
    let result = undefined

    if (this.hasError) {
      result = chunk.toString()
    } else {
      switch (this.language) {
        case 'python': {
          if (
            chunk.toString().indexOf('Error') !== -1 ||
            chunk.toString().indexOf('Traceback') !== -1
          ) {
            result = chunk.toString()
          }
          break
        }
        case 'javascript': {
          if (
            chunk.toString().indexOf('Error') !== -1 ||
            chunk.toString().indexOf('node:internal') !== -1
          ) {
            result = chunk.toString()
          }
          break
        }
      }
    }

    if (result) {
      result = result
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l !== 'KILL')
        .join('\n')
    }

    return result
  }

  _write(chunk, encoding, callback) {
    if (chunk.toString().indexOf('KILL') !== -1) {
      const error = this.getError(chunk)
      if (error) {
        this.send({
          type: 'error',
          payload: { type: 'RuntimeError', message: error },
        })
        return this.onKill()
      }

      const lines = chunk.toString().trim().split('\n')
      this.sendLines(lines.filter((line) => line !== 'KILL'))

      return this.onKill()
    }

    const error = this.getError(chunk)
    if (error || this.hasError) {
      this.hasError = true
      this.errorBuffer.push(error)
      return callback()
    }

    const lines = chunk.toString().trim().split('\n')
    this.sendLines(lines)
    callback()
  }

  _final(callback) {
    if (this.errorBuffer.length > 0) {
      this.send({
        type: 'error',
        payload: { type: 'RuntimeError', message: this.errorBuffer.join('') },
      })
      return callback()
    }
    callback()
  }
}

export default Stream
