import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import { formatValidationErrors } from 'lib/utils';

const router = Router();
const prisma = new PrismaClient();

const schema = Joi.object({
  private_key: Joi.string().min(64).max(64).required(),
});

router.post('/', async (req, res) => {
  try {
    // Validate the request body
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      return res.status(400).json({
        errors: formatValidationErrors(error),
      });
    }

    // Check if an account with the given private_key exists
    const account = await prisma.accounts.findFirst({
      where: { private_key: req.body.private_key },
    });

    if (!account) {
      throw new Error('Invalid credentials.');
    }

    res.status(200).json({
      id: account.id,
    });
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

