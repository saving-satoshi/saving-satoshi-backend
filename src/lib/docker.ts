import path from 'path'
import Docker from 'dockerode'

export const docker = new Docker()

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
          reject(err)
        }
        console.log('buildImage1')
        stream.pipe(logStream)
        docker.modem.followProgress(stream, (err, res) => {
          if (err) {
            reject(err)
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

// New cleanup function
function cleanupContainerAndImage(container, imageId, send) {
 container.inspect((err, data) => {
    if (err) {
      console.error(`Failed to inspect container: ${err}`)
    } else {
      const containerState = data.State.Status

      if (containerState === 'running') {
        container.kill((err) => {
          if (err) {
            console.error(`Failed to kill container: ${err}`)
          } else {
            send({
              type: 'debug',
              payload: `[system] Container ${sanitizeContainerId(container.id)} killed.`,
              channel: 'runtime',
            })
          }

          removeContainerAndImage(container, imageId, send)
        })
      } else {
        removeContainerAndImage(container, imageId, send)
      }
    }
 })
}

function removeContainerAndImage(container, imageId, send) {
 container.remove((err) => {
    if (err) {
      console.error(`Failed to remove container: ${err}`)
    } else {
      send({
        type: 'debug',
        payload: `[system] Container ${sanitizeContainerId(container.id)} removed.`,
        channel: 'runtime',
      })

      docker.getImage(imageId).remove((err) => {
        if (err) {
          console.error(`Failed to remove image: ${err}`)
        } else {
          send({
            type: 'debug',
            payload: `[system] Image ${imageId} removed.`,
            channel: 'runtime',
          })
        }
      })
    }
 })
}

function runContainer(id, send, writeStream, context): Promise<boolean> {
 return new Promise(async (resolve, reject) => {
    send({
      type: 'debug',
      payload: '[system] Creating container...',
      channel: 'runtime',
    })

    docker.createContainer({ Image: id, name: id, Tty: true },
      (err, container) => {
        if (err) {
          return reject(err)
        }

        console.log('container', container)

        let isRunning = false

        const containerId = sanitizeContainerId(container.id)

        const job = context.jobs[context.socketId]
        job.container = container
        job.onKill = () => {
          isRunning = false
          cleanupContainerAndImage(container, id, send)
          writeStream.end()
          resolve(true)
        }

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
                cleanupContainerAndImage(container, id, send)
              }, 1000)
            }

            setTimeout(() => {
              if (isRunning) {
                cleanupContainerAndImage(container, id, send)
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

              // Call the cleanup function when the container stops
              container.wait((err) => {
                if (err) {
                 console.error(`Failed to wait for container to stop: ${err}`)
                } else {
                 cleanupContainerAndImage(container, id, send)
                }
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
