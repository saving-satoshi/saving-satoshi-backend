import { Router } from 'express'
import { prismaClient } from 'lib/prisma'
import { authenticated } from 'middleware'
import { RequestWithToken } from 'types'

const router = Router()

router.get('/', authenticated, async (req: RequestWithToken, res) => {
  try {
    // Use Prisma to check if a Progress entry exists for the authenticated account
    const progressEntry = await prismaClient.accounts_progress.findFirst({
      where: { account: req.account.id },
    })

    if (!progressEntry) {
      return res.status(404).json({
        errors: [
          {
            message: 'Progress not found for account',
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
    // await prisma.$disconnect()
  }
})

router.put('/', authenticated, async (req: RequestWithToken, res) => {
  try {
    if (!req.body.progress_state) {
      return res.status(400).json({
        errors: [
          {
            message: 'progress_state is required in request body',
          },
        ],
      })
    }

    const progressState = req.body.progress_state

    if (!progressState.currentLesson) {
      return res.status(400).json({
        errors: [
          {
            message: 'currentLesson is required in progress_state',
          },
        ],
      })
    }

    const currentLesson = progressState.currentLesson

    // Check if progress exists for the authenticated account
    const existingProgress = await prismaClient.accounts_progress.findFirst({
      where: { account: req.account.id },
    })
    if (existingProgress) {
      const updatedProgress = await prismaClient.accounts_progress.update({
        where: { id: existingProgress.id },
        data: {
          progress: currentLesson,
          progress_state: progressState,
        },
      })
      return res.status(200).json(updatedProgress)
    } else {
      // Create a new progress record

      const newProgress = await prismaClient.accounts_progress.create({
        data: {
          account: req.account.id,
          progress: currentLesson,
          progress_state: progressState,
        },
      })
      return res.status(200).json(newProgress)
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
    // await prisma.$disconnect()
  }
})

export default router
