import { Writable } from 'stream'

class Stream extends Writable {
  send: any
  language: string
  transformer: any
  channel: string
  onKill: () => void

  constructor(send: any, language: string, transformer: any, channel: string) {
    super()
    this.send = send
    this.language = language
    this.transformer = transformer
    this.channel = channel
  }

  _write(chunk, encoding, callback) {
    const lines = chunk.toString().trim().split('\n')
    switch (this.language) {
      case 'python': {
        if (
          chunk.toString().indexOf('Error:') !== -1 ||
          chunk.toString().indexOf('Traceback') !== -1
        ) {
          this.send({ type: 'error', payload: chunk.toString() })
          return
        }
        break
      }
      case 'javascript': {
        if (chunk.toString().indexOf('Error:') !== -1) {
          this.send({ type: 'error', payload: chunk.toString() })
          return
        }
        break
      }
    }

    if (chunk.toString().indexOf('KILL') !== -1) {
      return this.onKill()
    }

    lines.forEach((line) => {
      line = this.transformer(line)
      if (line) {
        this.send({
          type: this.channel,
          payload: line,
        })
      }
    })

    callback()
  }
}

export default Stream
