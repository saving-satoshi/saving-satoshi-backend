import path from 'path'
import Docker from 'dockerode'
import type { Container } from 'dockerode'
import logger from './logger'
import { JobManager } from './jobManager'
import { BASE_IMAGE_NAMES, CONTAINERS_SCHEDULE, CONTAINERS_TO_KEEP_ON,
  CONTAINER_WORKING_DIRECTORY } from 'config'

export const docker = new Docker()

interface DockerStream {
  pipe: (destination: any) => void
  unpipe: (destination: any) => void
}

const MAX_SCRIPT_EXECUTION_TIME =
  Number(process.env.MAX_SCRIPT_EXECUTION_TIME) || 15000

interface Context {
  jobs: JobManager
  socketId: string
  volume?: string 
   cmd?: string[]   
  memory?: number
  cpuShares?: number
  timeout?: number
}

interface SendMessage {
  type: string
  payload: string
  channel?: string
}

// Convert to async/await
async function buildImage(
  p: string,
  id: string,
  logStream: any,
  files: string[]
) {
  try {
    logger.info(`Building image with ID: ${id}`)
    return new Promise((resolve, reject) => {
      docker.buildImage(
        {
          context: path.join(p),
          src: files,
        },
        {
          t: `${id}:latest`, // Add explicit latest tag
          nocache: true, // Disable caching to ensure fresh builds
        },
        (err, stream) => {
          if (err) {
            logger.error(`Failed to build image: ${err.message}`)
            return reject(err)
          }
          stream.pipe(logStream)
          docker.modem.followProgress(stream, (err, res) => {
            if (err) {
              logger.error(`Failed to follow build progress: ${err.message}`)
              return reject(err)
            }
            logger.info(`Successfully built image: ${id}`)
            resolve(res)
          })
        }
      )
    })
  } catch (error) {
    logger.error(`Build image failed: ${error.message}`)
    throw error
  }
}

export async function killContainers() {
  const allContainers = await docker.listContainers()
  let containersKilled = 0
  for (let container of allContainers) {
    if (container.Status) {
      const stringTime = parseInt(container.Status.split(' ')[1])
      const minutes = container.Status.split(' ')[2]
      if (minutes === 'minutes' && stringTime >= CONTAINERS_SCHEDULE) {
        const isSafeContainer = CONTAINERS_TO_KEEP_ON.includes(
          container.Names[0]
        )
        // So our database migration doesn't get killed
        if (!isSafeContainer) {
          await docker.getContainer(container.Id).kill()
          await docker.getContainer(container.Id).remove()
          containersKilled++
        }
      }
    }
  }
  if (containersKilled) {
    logger.info(`${containersKilled} containers were killed`)
  }
}

function sanitizeContainerId(id: string): string {
  return id.slice(0, 8)
}

async function cleanupContainer(
  container: Container,
  imageId: string,
  send: (message: SendMessage) => Promise<void>
) {
  try {
    logger.debug(
      `Starting cleanup for container ${container.id} and image ${imageId}`
    )

    // Kill container if running
    try {
      const data = await container.inspect()
      if (data.State.Status === 'running') {
        await container.kill()
        logger.info(`Killed container ${sanitizeContainerId(container.id)}`)
        await send({
          type: 'debug',
          payload: `[system] Container ${sanitizeContainerId(
            container.id
          )} killed.`,
          channel: 'runtime',
        })
      }
    } catch (err) {
      logger.error(`Failed to kill container: ${err.message}`)
    }

    // Remove container
    try {
      await container.remove({ force: true })
      logger.info(`Removed container ${sanitizeContainerId(container.id)}`)
      await send({
        type: 'debug',
        payload: `[system] Container ${sanitizeContainerId(
          container.id
        )} removed.`,
        channel: 'runtime',
      })
    } catch (err) {
      logger.error(`Failed to remove container: ${err.message}`)
    }

  } catch (err) {
    logger.error(`Failed in cleanup process: ${err.message}`)
  }
}

async function runContainer(
  id: string,
  imageName: string,    // name of the image to base container off of
  userCodePath: string, // location of the user code
  send: (message: SendMessage) => Promise<void>,
  writeStream: any,
  context: Context
): Promise<boolean> {
  let container: Container | null = null
  let isCleanedUp = false
  let timeoutId: NodeJS.Timeout

  try {
    if (!context.jobs.has(context.socketId)) {
      context.jobs.create(context.socketId, id)
    }

    await send({
      type: 'debug',
      payload: '[system] Creating container...',
      channel: 'runtime',
    })

    // Verify image exists
    try {
      await docker.getImage(imageName).inspect()
    } catch (err) {
      throw new Error(`Image ${imageName} not found`)
    }

    container = await new Promise<Container>((resolve, reject) => {
      docker.createContainer(
        {
          Image: imageName,
          name: id,
          Tty: true,
          AttachStdout: true,
          AttachStderr: true,
          HostConfig: {
            Binds: [`${userCodePath}:${CONTAINER_WORKING_DIRECTORY}`],
            AutoRemove: false,
          },
        },
        (err, container) => {
          if (err) reject(err)
          else resolve(container)
        }
      )
    })

    const cleanup = async (): Promise<void> => {
      if (!isCleanedUp && container) {
        isCleanedUp = true
        context.jobs.setRunning(context.socketId, false)

        try {
          writeStream.end()
          await cleanupContainer(container, id, send)
        } catch (error) {
          logger.error('Cleanup failed:', error)
        } finally {
          context.jobs.remove(context.socketId)
        }
      }
    }

    // Set container and cleanup in job manager
    context.jobs.set(context.socketId, {
      container,
      onKill: cleanup,
      id,
    })

    const stream = await new Promise<DockerStream>((resolve, reject) => {
      container.attach(
        { stream: true, stdout: true, stderr: true },
        (err, stream) => {
          if (err) reject(err)
          else resolve(stream)
        }
      )
    })

    stream.pipe(writeStream)

    writeStream.onKill = async () => {
      if (!isCleanedUp) {
        stream.unpipe(writeStream)
        await cleanup()
      }
    }

    // Set running state in the job manager before starting container
    context.jobs.setRunning(context.socketId, true)

    timeoutId = setTimeout(async () => {
      if (context.jobs.isRunning(context.socketId) && !isCleanedUp) {
        logger.warn(
          `Container execution timed out after ${MAX_SCRIPT_EXECUTION_TIME}ms`
        )
        stream.unpipe(writeStream)
        await cleanup()
      }
    }, MAX_SCRIPT_EXECUTION_TIME)

    try {
      await new Promise<void>((resolve, reject) => {
        container!.start((err) => {
          if (err) {
            logger.error('Error while starting container')
            clearTimeout(timeoutId)
            reject(err)
          } else {
            resolve()
          }
        })
      })

      // Wait for the user code to finish executing
      await new Promise<void>((resolve, reject) => {
        container!.wait(async (err) => {
          clearTimeout(timeoutId)

          if (err) {
            logger.error(`Failed to wait for container to stop: ${err}`)
            reject(err)
          }

          if (!isCleanedUp) {
            stream.unpipe(writeStream)
            await cleanup()
          }
          resolve()
        })
      })

      return true
    } finally {
      clearTimeout(timeoutId)
      context.jobs.setRunning(context.socketId, false)
    }
  } catch (error) {
    logger.error('Container execution failed:', error)
    if (container && !isCleanedUp) {
      await cleanupContainer(container, id, send)
    }
    context.jobs.remove(context.socketId)
    throw error
  }
}

export default {
  buildImage,
  runContainer,
}
