import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  try {
    // Validate the request body here if needed

    // Check if an account with the given private_key already exists
    const existingAccount = await prisma.accounts.findFirst({
      where: { private_key: req.body.private_key },
    });

    if (existingAccount) {
      throw new Error('Account already exists.');
    }

    // Create a new account
    const newAccount = await prisma.accounts.create({
      data: req.body,
    });

    // Create a progress record for the new account
    const newProgress = await prisma.accounts_progress.create({
      data: {
        accounts: { connect: { id: newAccount.id } },
        progress: 'CH1INT1',
      },
    });

    res.status(200).json({ id: newAccount.id });
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
