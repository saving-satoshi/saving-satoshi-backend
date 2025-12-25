import Joi from 'joi'
import { Router } from 'express'
import { prismaClient } from 'lib/prisma'
import { formatValidationErrors } from 'lib/utils'
import { generate } from 'lib/token'
import { authenticated } from 'middleware'
import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_COOKIE_SETTINGS,
} from 'lib/cookie'
import { RequestWithToken } from 'types/index'
import logger from 'lib/logger'

const router = Router()

const schema = Joi.object({
  private_key: Joi.string().min(64).max(64).required(),
})

router.post('/register', async (req, res) => {
  try {
    // Validate the request body here if needed
    const privateKey = req.body.private_key

    // Check if an account with the given private_key already exists
    const existingAccount = await prismaClient.accounts.findFirst({
      where: { private_key: privateKey },
    })

    if (existingAccount) {
      throw new Error('Account already exists.')
    }

    // Create a new account
    const newAccount = await prismaClient.accounts.create({
      data: req.body,
    })

    // Create a progress record for the new account
    await prismaClient.accounts_progress
      .create({
        data: {
          accounts: { connect: { id: newAccount.id } },
          progress: 'CH1INT1',
        },
      })
      .then((progress) => {
        logger.info(JSON.stringify(progress))
      })
    res.status(200).json({ id: newAccount.id })
  } catch (err) {
    res.status(500).json({
      errors: [
        {
          message: err.message,
        },
      ],
    })
  } finally {
    // await prisma.$disconnect() // Disconnect from the database
  }
})

router.post('/login', async (req, res) => {
  try {
    // Validate the request body
    const { error } = schema.validate(req.body, { abortEarly: false })

    if (error) {
      return res.status(400).json({
        errors: formatValidationErrors(error),
      })
    }

    // Check if an account with the given private_key exists
    const account = await prismaClient.accounts.findFirst({
      where: { private_key: req.body.private_key },
    })

    if (!account) {
      throw new Error('Invalid credentials.')
    }

    const token = await generate(account)

    res
      .cookie(ACCESS_TOKEN_COOKIE_NAME, token, ACCESS_TOKEN_COOKIE_SETTINGS)
      .status(200)
      .json({
        id: account.id,
        token: token,
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
    // await prisma.$disconnect() // Disconnect from the database
  }
})

router.post('/logout', authenticated, async (req: RequestWithToken, res) => {
  if (!req.account) {
    return res.status(403).json({ errors: [{ message: 'Forbidden.' }] })
  }

  res
    .clearCookie(ACCESS_TOKEN_COOKIE_NAME, ACCESS_TOKEN_COOKIE_SETTINGS)
    .status(200)
    .json({})
})

router.get('/session', authenticated, async (req: RequestWithToken, res) => {
  if (!req.account) {
    return res.status(403).json({ errors: [{ message: 'Forbidden.' }] })
  }

  res.status(200).json(req.account)
})

export default router
