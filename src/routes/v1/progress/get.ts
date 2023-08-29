import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticated } from 'middleware';
import { RequestWithToken } from 'types';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authenticated, async (req: RequestWithToken, res) => {
  try {
    // Use Prisma to check if a Progress entry exists for the authenticated account
    const progressEntry = await prisma.accounts_progress.findFirst({
      where: { account: req.account.id }
    });

    if (!progressEntry) {
      // If no entry exists, create a new one
      const newProgressEntry = await prisma.accounts_progress.create({
        data: {
          account: req.account.id,
          progress: 'CH1INT1',
        },
      });

      return res.status(200).json({
        account: newProgressEntry.account,
        progress: newProgressEntry.progress,
      });
    } else {
      res.status(200).json({
        account: progressEntry.account,
        progress: progressEntry.progress,
      });
    }
  } catch (err) {
    res.status(500).json({
      errors: [
        {
          message: err.message,
        },
      ],
    });
  } finally {
    await prisma.$disconnect(); // Disconnect from the database
  }
});

export default router;

