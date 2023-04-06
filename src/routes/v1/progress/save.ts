import { Router } from 'express'
import { Progress } from 'models'
import { authenticated } from 'middleware'
import { RequestWithToken } from 'types'

const router = Router()

router.put('/', authenticated, async (req: RequestWithToken, res) => {
  try {
    if (await Progress.exists('account', req.account.id)) {
      const progress = await Progress.update(
        { progress: req.body.progress },
        { account: req.account.id }
      )

      res.status(200).json(progress)
    } else {
      const progress = await Progress.create(
        { account: req.account.id, progress: req.body.progress },
        { uniqueOn: 'account' }
      )

      res.status(200).json(progress)
    }
  } catch (ex) {
    console.log(ex)
  }
})

export default router
