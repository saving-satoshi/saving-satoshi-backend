import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import { formatValidationErrors } from 'lib/utils'


const router = Router();
const prisma = new PrismaClient();


const schema = Joi.object({
  feature_name: Joi.string().required(),
});

router.post('/', async (req, res) => {
  try {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      return res.status(400).json({
        errors: formatValidationErrors(error),
      });
    }

    // Use Prisma to check if the feature with the given name already exists
    const existingFeature = await prisma.features.findFirst({
      where: { feature_name: req.body.feature_name },
    });

    if (existingFeature) {
      throw new Error('Feature flag already exists.');
    }

    // Create the feature using Prisma
    const feature = await prisma.features.create({
      data: req.body,
    });

    res.status(200).json(feature);
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

router.get('/', async (req, res) => {
  try {
    // Use Prisma to fetch all features
    const features = await prisma.features.findMany();

    res.status(200).json(features);
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

