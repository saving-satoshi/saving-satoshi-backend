import { Router } from 'express'
import { Progress } from 'models'
import { authenticated } from 'middleware'
import { RequestWithToken } from 'types'

const router = Router()

router.get('/', authenticated, async (req: RequestWithToken, res) => {
  try {
    if (!(await Progress.exists('account', req.account.id))) {
      throw new Error('Progress not found.')
    }

    const progress = await Progress.find({ account: req.account.id })

    res.status(200).json(progress)
  } catch (err) {
    res.status(500).json({
      errors: [
        {
          message: err.message,
        },
      ],
    })
  }
})

export default router
