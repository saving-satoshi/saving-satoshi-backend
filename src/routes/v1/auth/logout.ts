import { Router } from 'express'
import { authenticated } from 'middleware'
import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_COOKIE_SETTINGS,
} from 'lib/cookie'
import { RequestWithToken } from 'types'

const router = Router()

router.post('/', authenticated, async (req: RequestWithToken, res) => {
  if (!req.account) {
    return res.status(403).json({ errors: [{ message: 'Forbidden.' }] })
  }

  res
    .clearCookie(ACCESS_TOKEN_COOKIE_NAME, ACCESS_TOKEN_COOKIE_SETTINGS)
    .status(200)
    .json({})
})

export default router
