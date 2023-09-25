import Joi from 'joi'
import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { formatValidationErrors } from 'lib/utils'

const router = Router()
const prisma = new PrismaClient()

const schema = Joi.object({
  feature_name: Joi.string().required(),
  feature_value: Joi.any().required(),
})

router.put('/', async (req, res) => {
  try {
    const { error } = schema.validate(req.body, { abortEarly: false })

    if (error) {
      return res.status(400).json({
        errors: formatValidationErrors(error),
      })
    }

    const featureName = req.body.feature_name
    const data = req.body

    // Use Prisma to check if the feature with the given name already exists
    const existingFeature = await prisma.features.findFirst({
      where: { feature_name: featureName },
    })

    if (existingFeature) {
      const result = await prisma.features.update({
        where: {
          feature_name: featureName,
        },
        data: data,
      })
      return res.status(200).json(result)
    }

    // Create the feature using Prisma
    const result = await prisma.features.create({
      data: data,
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
  } finally {
    await prisma.$disconnect()
  }
})

router.get('/', async (req, res) => {
  try {
    // Use Prisma to fetch all features
    const features = await prisma.features.findMany()

    res.status(200).json(features)
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
