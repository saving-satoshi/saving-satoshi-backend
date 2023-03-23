import { Router } from 'express'
import { Account } from 'models'
import { formatValidationErrors } from 'lib/utils'

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
    if (await Account.exists('private_key', req.body.private_key)) {
      throw new Error('Account already exists.')
    }

    const account = await Account.create(req.body, { uniqueOn: 'private_key' })

    res.status(200).json({ id: account.id })
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
