import path from 'path'
import Docker from 'dockerode'

const docker = new Docker()

const MAX_SCRIPT_EXECUTION_TIME =
  Number(process.env.MAX_SCRIPT_EXECUTION_TIME) || 10000

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

function runContainer(id, send, writeStream): Promise<boolean> {
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

        send({
          type: 'debug',
          payload: `[system] Container ${container.id} created.`,
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
              payload: `[system] Starting container ${container.id}...`,
              channel: 'runtime',
            })

            let isRunning = false

            // Listen for kill signal
            writeStream.onKill = () => {
              isRunning = false
              resolve(true)

              container.remove(() => {
                send({
                  type: 'debug',
                  payload: `[system] Container ${container.id} removed.`,
                  channel: 'runtime',
                })
              })
            }

            // Start the container
            container.start((err) => {
              if (err) {
                return reject(err)
              }

              isRunning = true

              send({
                type: 'debug',
                payload: `[system] Container ${container.id} started.`,
                channel: 'runtime',
              })

              setTimeout(() => {
                if (isRunning) {
                  send({
                    type: 'error',
                    payload: `RuntimeError: Script took to long to complete.`,
                  })

                  resolve(false)

                  container.kill(() => {
                    send({
                      type: 'debug',
                      payload: `[system] Container ${container.id} killed.`,
                      channel: 'runtime',
                    })

                    container.remove(() => {
                      send({
                        type: 'debug',
                        payload: `[system] Container ${container.id} removed.`,
                        channel: 'runtime',
                      })
                    })
                  })
                }
              }, MAX_SCRIPT_EXECUTION_TIME)
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
