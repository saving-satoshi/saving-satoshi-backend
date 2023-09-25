import { Router } from 'express'
import { authenticated } from 'middleware'
import { RequestWithToken } from 'types/index'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

router.get('/:lesson_id', authenticated, async (req: RequestWithToken, res) => {
  try {
    const lessonId = req.params.lesson_id
    const accountId = req.account.id

    const entry = await prisma.accounts_data.findFirst({
      where: { lesson_id: lessonId, account: accountId },
    })

    res.status(200).json({
      lesson_id: entry.lesson_id,
      data: entry.data,
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

router.put('/', authenticated, async (req: RequestWithToken, res) => {
  try {
    const accountId = req.account.id
    const lessonId: string = req.body.lesson_id
    const data = req.body.data

    const exists = await prisma.accounts_data.count({
      where: { account: accountId, lesson_id: lessonId },
    })

    if (!exists) {
      return res.status(400).json({
        errors: [{ message: 'Data does not exist, please use create.' }],
      })
    }

    const result = await prisma.accounts_data.update({
      where: {
        account_lesson_id: { account: accountId, lesson_id: lessonId },
      },
      data: { data: data },
    })

    return res.status(200).json(result)
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

router.post('/', authenticated, async (req: RequestWithToken, res) => {
  try {
    const accountId = req.account.id
    const lessonId: string = req.body.lesson_id
    const data = req.body.data

    const exists = await prisma.accounts_data.count({
      where: { account: accountId, lesson_id: lessonId },
    })

    if (exists) {
      return res.status(400).json({
        errors: [{ message: 'Data already exists, please use update.' }],
      })
    }

    const result = await prisma.accounts_data.create({
      data: { account: accountId, lesson_id: lessonId, data: data },
    })
    res.status(200).json(result)
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
