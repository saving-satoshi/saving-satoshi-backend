import { Writable } from 'stream'
import { Response } from 'express'
import Convert from 'ansi-to-html'

const convert = new Convert()

class Stream extends Writable {
  res: Response
  language: string
  transformer: (input: string) => string
  channel: string

  constructor(res, language, transformer, channel) {
    super()
    this.res = res
    this.language = language
    this.transformer = transformer
    this.channel = channel
  }

  _write(chunk, encoding, callback) {
    const lines = chunk.toString().trim().split('\n')

    switch (this.language) {
      case 'python': {
        if (chunk.toString().indexOf('Traceback') !== -1) {
          lines.forEach((line) => {
            this.send({ type: 'error', payload: line })
          })
          return
        }
        break
      }
      case 'javascript': {
        if (chunk.toString().indexOf('Error:') !== -1) {
          lines.forEach((line) => {
            this.send({ type: 'error', payload: line })
          })
          return
        }
        break
      }
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

  send(payload) {
    const buffer = JSON.stringify({
      ...payload,
      payload: convert.toHtml(payload.payload),
    })
    this.res.write(`data: ${buffer}\n\n`)
  }
}

export default Stream
