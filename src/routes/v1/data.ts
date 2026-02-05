import { Router } from 'express'
import { prismaClient } from 'lib/prisma'
import { authenticated } from 'middleware'
import { RequestWithToken } from 'types/index'

const router = Router()

router.get('/:lesson_id', authenticated, async (req: RequestWithToken, res) => {
  try {
    const lessonId = req.params.lesson_id
    const accountId = req.account.id

    const entry = await prismaClient.accounts_data.findFirst({
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
  } finally {
    // await prismaClient.$disconnect()
  }
})

router.put('/', authenticated, async (req: RequestWithToken, res) => {
  try {
    const accountId = req.account.id
    const lessonId: string = req.body.lesson_id
    const data = req.body.data

    const exists = await prismaClient.accounts_data.count({
      where: { account: accountId, lesson_id: lessonId },
    })

    if (!exists) {
      const result = await prismaClient.accounts_data.create({
        data: { account: accountId, lesson_id: lessonId, data: data },
      })

      return res.status(200).json(result)
    }

    const result = await prismaClient.accounts_data.update({
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
  } finally {
    // await prismaClient.$disconnect()
  }
})

export default router
