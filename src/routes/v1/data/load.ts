import { Router } from 'express'
import { Data } from 'models'
import { authenticated } from 'middleware'
import { RequestWithToken } from 'types'

const router = Router()

router.get('/:lesson_id', authenticated, async (req: RequestWithToken, res) => {
  try {
      const entry = await Data.find(req.params.lesson_id)

      res.status(200).json({
        lesson_id: entry.lesson_id,
        value: entry.value
      })
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

