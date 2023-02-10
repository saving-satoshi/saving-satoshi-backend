import { Router } from 'express'
import authenticated from '../../../middleware/authenticated'
import { RequestWithToken } from '../../../types'

const router = Router()

router.get('/', authenticated, async (req: RequestWithToken, res) => {
  if (!req.account) {
    return res.status(403).json({ errors: [{ message: 'Forbidden.' }] })
  }

  res
    .clearCookie('saving-satoshi-token', {
      maxAge: 1000 * 60 * 60,
      httpOnly: true,
    })
    .status(200)
    .json({})
})

export default router
