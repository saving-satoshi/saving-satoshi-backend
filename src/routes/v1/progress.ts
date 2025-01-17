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
      return res.status(404).json({
        errors: [
          {
            message: "Progress not found for account",
          },
        ],
      })
    } else {
      res.status(200).json({
        account: progressEntry.account,
        progress: progressEntry.progress,
        progress_state: progressEntry.progress_state,
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
        data: { 
          progress: req.body.progress,
          progress_state: req.body.progress_state,
        },
      })

      res.status(200).json(updatedProgress)
    } else {
      // Create a new progress record
      const newProgress = await prisma.accounts_progress.create({
        data: {
          account: req.account.id,
          progress: req.body.progress,
          progress_state: req.body.progress_state,
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
