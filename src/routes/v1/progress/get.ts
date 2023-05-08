import { Router } from 'express'
import { Progress } from 'models'
import { authenticated } from 'middleware'
import { RequestWithToken } from 'types'

const router = Router()

router.get('/', authenticated, async (req: RequestWithToken, res) => {
  try {
    if (!(await Progress.exists('account', req.account.id))) {
      const entry = await Progress.create(
        { account: req.account.id, progress: 'CH1INT1' },
        { uniqueOn: 'account' }
      )

      return res.status(200).json({
        account: entry.account,
        progress: entry.progress
      })
    } else {
      const entry = await Progress.find({ account: req.account.id })

      res.status(200).json({
        account: entry.account,
        progress: entry.progress
      })
    }
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
