import jwt from 'jsonwebtoken'

export function generate(payload) {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, process.env.SECRET, (err, token) => {
      if (err) {
        return reject(err)
      }

      resolve(token)
    })
  })
}

export function verify(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.SECRET, (err, payload) => {
      if (err) {
        return reject(err)
      }
      resolve(payload)
    })
  })
}
