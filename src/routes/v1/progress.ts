import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticated } from 'middleware'
import { RequestWithToken } from 'types'

const router = Router()
const prisma = new PrismaClient()

router.get('/', authenticated, async (req: RequestWithToken, res) => {
  try {
    // Use Prisma to check if a Progress entry exists for the authenticated account
    const progressEntry = await prisma.accounts_progress.findFirst({
      where: { account: req.account.id },
    })

    if (!progressEntry) {
      // If no entry exists, create a new one
      const newProgressEntry = await prisma.accounts_progress.create({
        data: {
          account: req.account.id,
          progress: 'CH1INT1',
          progress_list: ['CH1INT1'],
        },
      })

      return res.status(200).json({
        account: newProgressEntry.account,
        progress: newProgressEntry.progress,
        progressList: newProgressEntry.progress_list,
      })
    } else {
      res.status(200).json({
        account: progressEntry.account,
        progress: progressEntry.progress,
        progressList: progressEntry.progress_list,
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
  } finally {
    await prisma.$disconnect()
  }
})

router.put('/', authenticated, async (req: RequestWithToken, res) => {
  try {
    // Check if progress exists for the authenticated account
    const existingProgress = await prisma.accounts_progress.findFirst({
      where: { account: req.account.id },
    })

    if (existingProgress) {
      // Update the existing progress
      const updatedProgress = await prisma.accounts_progress.update({
        where: { id: existingProgress.id },
        data: { progress: req.body.progress, progress_list: req.body.progressList },
      })

      res.status(200).json(updatedProgress)
    } else {
      // Create a new progress record
      const newProgress = await prisma.accounts_progress.create({
        data: {
          account: req.account.id,
          progress: req.body.progress,
          progress_list: req.body.progressList,
        },
      })

      res.status(200).json(newProgress)
    }
  } catch (err) {
    res.status(500).json({
      errors: [
        {
          message: err.message,
        },
      ],
    })
  } finally {
    await prisma.$disconnect()
  }
})

export default router
