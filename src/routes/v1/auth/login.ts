import Joi from 'joi'
import { Router } from 'express'
import { formatValidationErrors } from 'lib/utils'
import { Account } from 'models'
import { generate } from 'lib/token'
import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_COOKIE_OPTIONS,
} from 'lib/cookie'

const router = Router()

const schema = Joi.object({
  private_key: Joi.string().min(64).max(64).required(),
})

router.post('/', async (req, res) => {
  const { error } = schema.validate(req.body, { abortEarly: false })

  if (error) {
    return res.status(400).json({
      errors: formatValidationErrors(error),
    })
  }

  try {
    if (!(await Account.exists('private_key', req.body.private_key))) {
      throw new Error('Invalid credentials.')
    }

    const account = await Account.find({ private_key: req.body.private_key })
    const token = await generate(account)

    const expires = new Date()
    expires.setDate(expires.getDate() + 1)

    res
      .cookie(ACCESS_TOKEN_COOKIE_NAME, token, {
        ...ACCESS_TOKEN_COOKIE_OPTIONS,
        expires,
      })
      .status(200)
      .json({})
  } catch (err) {
    res.status(500).json({
      errors: [
        {
          message: err.message,
        },
      ],
    })
  }
})

export default router
