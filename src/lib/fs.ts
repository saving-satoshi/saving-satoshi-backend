import fs from 'fs/promises'

export function exists(p) {
  return new Promise(async (resolve) => {
    try {
      await fs.access(p)
      resolve(true)
    } catch (ex) {
      console.log(ex)
      resolve(false)
    }
  })
}
