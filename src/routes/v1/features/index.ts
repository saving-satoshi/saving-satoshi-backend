import { Router } from 'express'
import { Feature } from 'models'
import { formatValidationErrors } from 'lib/utils'

const router = Router()

router.post('/', async (req, res) => {
  const { error } = Feature.schema.validate(req.body, { abortEarly: false })
  if (error) {
    return res.status(400).json({
      errors: formatValidationErrors(error),
    })
  }
  try {
    if (await Feature.exists('feature_name', req.body.feature_name)) {
      throw new Error('Feature flag already exists.')
    }
    const feature = await Feature.create(req.body, {
      uniqueOn: 'feature_name',
    })
    res.status(200).json(feature)
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

router.get('/', async (req, res) => {
  const features = await Feature.all()
  res.status(200).json(features)
})

export default router
