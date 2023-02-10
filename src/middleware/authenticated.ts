import { verify } from '../lib/token'
import { ACCESS_TOKEN_COOKIE_NAME } from '../lib/cookie'
import { Account, RequestWithToken } from '../types'

export default async function authenticated(req: RequestWithToken, res, next) {
  try {
    req.token = req.cookies[ACCESS_TOKEN_COOKIE_NAME]

    if (!req.token) {
      throw new Error('Authorization token is missing.')
    }

    const account = (await verify(req.token)) as Account

    req.account = {
      id: account.id,
      code: account.code,
      avatar: account.avatar,
    }

    next()
  } catch (ex) {
    return res.status(403).json({ errors: [{ message: 'Forbidden.' }] })
  }
}
