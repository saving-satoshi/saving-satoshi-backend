import path from 'path'
import Docker from 'dockerode'

const docker = new Docker()

const MAX_SCRIPT_EXECUTION_TIME =
  Number(process.env.MAX_SCRIPT_EXECUTION_TIME) || 15000

function buildImage(p, id, logStream, files) {
  return new Promise((resolve, reject) => {
    docker.buildImage(
      {
        context: path.join(p),
        src: files,
      },
      { t: id },
      (err, stream) => {
        if (err) {
          return reject(err)
        }

        stream.pipe(logStream)
        docker.modem.followProgress(stream, (err, res) => {
          if (err) {
            return reject(err)
          }
          resolve(res)
        })
      }
    )
  })
}

function sanitizeContainerId(id) {
  return id.slice(0, 8)
}

function runContainer(id, send, writeStream, context): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    send({
      type: 'debug',
      payload: '[system] Creating container...',
      channel: 'runtime',
    })

    docker.createContainer(
      { Image: id, name: id, Tty: true },
      (err, container) => {
        if (err) {
          return reject(err)
        }

        let isRunning = false

        const job = context.jobs[context.socketId]
        job.container = container
        job.onKill = () => {
          isRunning = false

          container.kill(() => {
            container.remove(() => {
              writeStream.end()
              resolve(true)
            })
          })
        }

        const containerId = sanitizeContainerId(container.id)

        send({
          type: 'debug',
          payload: `[system] Container ${containerId} created.`,
          channel: 'runtime',
        })

        send({
          type: 'debug',
          payload: `[system] Attaching WebSocket...`,
          channel: 'runtime',
        })

        container.attach(
          { stream: true, stdout: true, stderr: true },
          (err, stream) => {
            if (err) {
              return reject(err)
            }

            send({
              type: 'debug',
              payload: `[system] WebSocket attached.`,
              channel: 'runtime',
            })

            // Pipe container stdout to client.
            stream.pipe(writeStream)

            send({
              type: 'debug',
              payload: `[system] Starting container ${containerId}...`,
              channel: 'runtime',
            })

            // Listen for kill signal
            writeStream.onKill = () => {
              setTimeout(() => {
                isRunning = false
                stream.unpipe(writeStream)
                writeStream.end()

                container.remove(() => {
                  send({
                    type: 'debug',
                    payload: `[system] Container ${containerId} removed.`,
                    channel: 'runtime',
                  })

                  resolve(true)
                })
              }, 1000)
            }

            setTimeout(() => {
              if (isRunning) {
                container.kill(() => {
                  send({
                    type: 'debug',
                    payload: `[system] Container ${containerId} killed.`,
                    channel: 'runtime',
                  })

                  container.remove(() => {
                    send({
                      type: 'debug',
                      payload: `[system] Container ${containerId} removed.`,
                      channel: 'runtime',
                    })

                    stream.unpipe(writeStream)
                    writeStream.end()
                    resolve(false)
                  })
                })
              }
            }, MAX_SCRIPT_EXECUTION_TIME)

            // Start the container
            container.start((err) => {
              if (err) {
                return reject(err)
              }

              isRunning = true

              send({
                type: 'debug',
                payload: `[system] Container ${containerId} started.`,
                channel: 'runtime',
              })
            })
          }
        )
      }
    )
  })
}

export default {
  buildImage,
  runContainer,
}
