import { Router } from 'express'
import Joi from 'joi'

import { authenticated } from 'middleware'
import { RequestWithToken } from 'types'
import { formatValidationErrors } from 'lib/utils'
import { Account } from 'models'

const router = Router()

const schema = Joi.object({
  accountId: Joi.number().required(),
})

router.get('/:accountId', authenticated, async (req: RequestWithToken, res) => {
  const { error } = schema.validate(req.params, { abortEarly: false })

  if (error) {
    return res.status(400).json({
      errors: formatValidationErrors(error),
    })
  }

  try {
    const { accountId } = req.params

    if (!(await Account.exists('id', accountId))) {
      throw new Error('Account not found.')
    }

    const account = await Account.find({ id: accountId })

    delete account.private_key

    res.status(200).json(account)
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
