import { Writable } from 'stream'
import _ from 'lodash'

class Stream extends Writable {
  send: any
  sendLinesThrottled: any
  language: string
  transformer: any
  channel: string
  onKill: () => void

  constructor(send: any, language: string, transformer: any, channel: string) {
    super()
    this.send = send
    this.sendLinesThrottled = _.throttle(this.sendLines, 100)
    this.language = language
    this.transformer = transformer
    this.channel = channel
  }

  sendLines(lines) {
    lines.forEach((line) => {
      line = this.transformer(line)
      if (line) {
        line = line.replace(/\r$/, '')
        this.send({
          type: this.channel,
          payload: line,
        })
      }
    })
  }

  getError(chunk) {
    let result = undefined

    switch (this.language) {
      case 'python': {
        if (
          chunk.toString().indexOf('Error:') !== -1 ||
          chunk.toString().indexOf('Traceback') !== -1
        ) {
          result = chunk.toString()
        }
        break
      }
      case 'javascript': {
        if (chunk.toString().indexOf('Error:') !== -1) {
          result = chunk.toString()
        }
        break
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
      this.sendLinesThrottled(lines.filter((line) => line !== 'KILL'))

      return this.onKill()
    }

    const error = this.getError(chunk)
    if (error) {
      return this.send({
        type: 'error',
        payload: { type: 'RuntimeError', message: error },
      })
    }

    const lines = chunk.toString().trim().split('\n')
    this.sendLinesThrottled(lines)

    callback()
  }
}

export default Stream
