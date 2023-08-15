import { Router } from 'express'
import { Data } from 'models'
import { authenticated } from 'middleware'
import { RequestWithToken } from 'types/index'

const router = Router()

router.put('/', authenticated, async (req: RequestWithToken, res) => {
  try {
    if (await Data.exists('account', req.account.id) && await Data.exists('lesson_id', req.body.lesson_id)) {
      const progress = await Data.update(
        { lesson_id: req.body.lesson_id, data: req.body.data },
        { account: req.account.id }
      )

      res.status(200).json(progress)
    } else {
      const progress = await Data.create(
        { account: req.account.id, lesson_id: req.body.lesson_id, data: req.body.data },
        { uniqueOn: 'account' }
      )

      res.status(200).json(progress)
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

