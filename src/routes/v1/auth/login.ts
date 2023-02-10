import Joi from 'joi'
import { Router } from 'express'
import { formatValidationErrors } from '../../../utils'
import { Account } from '../../../models'
import { generate } from '../../../token'

const router = Router()

const schema = Joi.object({
  code: Joi.string().min(64).max(64).required(),
})

router.post('/', async (req, res) => {
  const { error } = schema.validate(req.body, { abortEarly: false })

  if (error) {
    return res.status(400).json({
      errors: formatValidationErrors(error),
    })
  }

  try {
    if (!(await Account.exists(req.body.code))) {
      throw new Error('Invalid credentials.')
    }

    const account = await Account.find(req.body.code)
    const token = await generate(account)

    res
      .cookie('saving-satoshi-token', token, {
        maxAge: 1000 * 60 * 60,
        httpOnly: true,
      })
      .status(200)
      .json(account)
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
