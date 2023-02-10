import { Router } from 'express'
import { Account } from '../../../models'
import { formatValidationErrors } from '../../../utils'

const router = Router()

router.post('/', async (req, res) => {
  const { error } = Account.validate(req.body, {
    abortEarly: false,
  })

  if (error) {
    return res.status(400).json({
      errors: formatValidationErrors(error),
    })
  }

  try {
    if (await Account.exists(req.body.code)) {
      throw new Error('Account already exists.')
    }

    const account = await Account.create(req.body)

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
