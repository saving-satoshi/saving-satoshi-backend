import Joi from 'joi'
import { Router } from 'express'
import { prismaClient } from 'lib/prisma'
import { authenticated } from 'middleware'
import { formatValidationErrors } from 'lib/utils'

const router = Router()

const schema = Joi.object({
  accountId: Joi.number().required(),
})

router.get('/:accountId', authenticated, async (req, res) => {
  try {
    const { error } = schema.validate(req.params, { abortEarly: false })

    if (error) {
      return res.status(400).json({
        errors: formatValidationErrors(error),
      })
    }

    const { accountId } = req.params

    // Use Prisma to fetch the account by ID
    const account = await prismaClient.accounts.findUnique({
      where: { id: parseInt(accountId) },
    })

    if (!account) {
      throw new Error('Account not found.')
    }

    // Remove sensitive data before sending the response
    const { private_key, ...accountData } = account

    res.status(200).json(accountData)
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
