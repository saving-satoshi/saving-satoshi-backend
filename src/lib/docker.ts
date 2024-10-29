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
async function cleanupContainerAndImage(container, imageId, send) {
  try {
    const data = await container.inspect()

    if (data.State.Status === 'running') {
      try {
        await container.kill()
        send({
          type: 'debug',
          payload: `[system] Container ${sanitizeContainerId(
            container.id
          )} killed.`,
          channel: 'runtime',
        })
      } catch (err) {
        console.error(`Failed to kill container: ${err}`)
      }
    }

    await removeContainer(container, send)
    await removeImageIfNoContainers(imageId, send)
  } catch (err) {
    console.error(`Failed to inspect container: ${err}`)
    await removeContainer(container, send)
    await removeImageIfNoContainers(imageId, send)
  }
}

async function removeImageIfNoContainers(imageId, send) {
  try {
    // List all containers using this image
    const containers = await docker.listContainers({
      all: true,
      filters: {
        ancestor: [imageId],
      },
    })

    // Only remove the image if no containers are using it
    if (containers.length === 0) {
      await docker.getImage(imageId).remove({ force: true })
      send({
        type: 'debug',
        payload: `[system] Image ${imageId} removed.`,
        channel: 'runtime',
      })
    } else {
      console.log(
        `Image ${imageId} still has ${containers.length} containers, skipping removal`
      )
    }
  } catch (err) {
    console.error(`Failed to remove image: ${err}`)
  }
}

async function removeContainer(container, send) {
  try {
    await container.remove()
    send({
      type: 'debug',
      payload: `[system] Container ${sanitizeContainerId(
        container.id
      )} removed.`,
      channel: 'runtime',
    })
  } catch (err) {
    console.error(`Failed to remove container: ${err}`)
  }
}

function runContainer(id, send, writeStream, context): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    let isCleanedUp = false

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
        const containerId = sanitizeContainerId(container.id)

        // Promise-based cleanup function
        const cleanup = async () => {
          if (!isCleanedUp) {
            isCleanedUp = true
            isRunning = false

            try {
              writeStream.end()
              await cleanupContainerAndImage(container, id, send)
              resolve(true)
            } catch (error) {
              console.error('Cleanup failed:', error)
              reject(error)
            }
          }
        }

        const job = context.jobs[context.socketId]
        job.container = container
        job.onKill = cleanup

        container.attach(
          { stream: true, stdout: true, stderr: true },
          (err, stream) => {
            if (err) {
              return reject(err)
            }

            stream.pipe(writeStream)

            // Listen for kill signal
            writeStream.onKill = async () => {
              if (!isCleanedUp) {
                stream.unpipe(writeStream)
                await cleanup()
              }
            }

            // Set timeout for max execution time
            const timeoutId = setTimeout(async () => {
              if (isRunning && !isCleanedUp) {
                stream.unpipe(writeStream)
                await cleanup()
              }
            }, MAX_SCRIPT_EXECUTION_TIME)

            // Start the container
            container.start((err) => {
              if (err) {
                clearTimeout(timeoutId)
                return reject(err)
              }

              isRunning = true

              // Wait for container to stop
              container.wait(async (err, result) => {
                clearTimeout(timeoutId)

                if (err) {
                  console.error(`Failed to wait for container to stop: ${err}`)
                }

                if (!isCleanedUp) {
                  stream.unpipe(writeStream)
                  await cleanup()
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
