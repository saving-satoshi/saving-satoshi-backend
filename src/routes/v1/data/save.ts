import { Router } from 'express'
import { Data } from 'models'
import { authenticated } from 'middleware'
import { RequestWithToken } from 'types'

const router = Router()

router.put('/', authenticated, async (req: RequestWithToken, res) => {
  try {
    const { lesson_id, value } = req.body;

    const existingData = await Data.find(lesson_id);

    if (existingData) {
      await Data.update(lesson_id, value);
    } else {
      await Data.create({ lesson_id, value },{ uniqueOn: 'lesson_id' });
    }

    res.status(201).json({
      message: 'Data saved/updated successfully'
    });
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

