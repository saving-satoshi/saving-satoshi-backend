import path from 'path'
import Docker from 'dockerode'

const docker = new Docker()

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

function runContainer(id, writeStream): Promise<[any, any]> {
  return new Promise(async (resolve, reject) => {
    docker.run(
      id,
      [],
      writeStream,
      {
        name: id,
        HostConfig: { AutoRemove: true },
      },
      {},
      (err, data, container) => {
        if (err) {
          return reject(err)
        }
        resolve([data, container])
      }
    )
  })
}

export default {
  buildImage,
  runContainer,
}
