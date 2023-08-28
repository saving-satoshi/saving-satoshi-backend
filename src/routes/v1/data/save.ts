import { Router } from 'express'
import { Data } from 'models'
import { authenticated } from 'middleware'
import { RequestWithToken } from 'types/index'

const router = Router()

router.put('/', authenticated, async (req: RequestWithToken, res) => {
  try {
    if (await Data.exists('account_id', req.account.id) && await Data.exists('lesson_id', req.body.lesson_id)) {
      const data = await Data.update(
        { lesson_id: req.body.lesson_id, data: req.body.data },
        { account_id: req.account.id }
      )

      res.status(200).json(data)
    } else {
      const data = await Data.create(
        { account_id: req.account.id, lesson_id: req.body.lesson_id, data: req.body.data},
        { uniqueOn: 'account_id' }
      )

      res.status(200).json(data)
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

