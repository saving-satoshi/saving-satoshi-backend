import { verify } from 'lib/token'
import { Account, RequestWithToken } from 'types'

export default async function authenticated(req: RequestWithToken, res, next) {
  try {
    const authorizationHeader = req.headers.authorization
    if (!authorizationHeader) {
      throw new Error('Authorization header is missing.')
    }

    const authorizationData = authorizationHeader.split(' ')
    if (authorizationData.length <= 1) {
      throw new Error('Authorization header is malformed.')
    }

    const token = authorizationData[1]
    if (!token) {
      throw new Error('Authorization token is missing.')
    }

    const account = (await verify(token)) as Account

    req.account = {
      id: account.id,
      avatar: account.avatar,
    }

    next()
  } catch (ex) {
    return res
      .status(403)
      .json({ errors: [{ message: ex.message || 'Forbidden.' }] })
  }
}
