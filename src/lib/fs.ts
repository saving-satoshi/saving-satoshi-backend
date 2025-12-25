import fs from 'fs/promises'
import logger from './logger'

export function exists(p) {
  return new Promise(async (resolve) => {
    try {
      await fs.access(p)
      resolve(true)
    } catch (ex) {
      logger.error('Error while checking for file existence:', ex)
      resolve(false)
    }
  })
}
