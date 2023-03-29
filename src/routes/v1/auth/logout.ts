import { Router } from 'express'
import { authenticated } from 'middleware'
import { RequestWithToken } from 'types'

const router = Router()

router.post('/', authenticated, async (req: RequestWithToken, res) => {
  if (!req.account) {
    return res.status(403).json({ errors: [{ message: 'Forbidden.' }] })
  }

  res.status(200).json({})
})

export default router
