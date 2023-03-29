import Joi from 'joi'
import { Router } from 'express'
import { formatValidationErrors } from 'lib/utils'
import { Account } from 'models'
import { generate } from 'lib/token'

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

    res.status(200).json({
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
  }
})

export default router
