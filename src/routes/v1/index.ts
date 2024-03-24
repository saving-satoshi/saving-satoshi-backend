import { Router } from 'express'

import auth from './auth'
import status from './status'
import data from './data'
import features from './features'

const router = Router()

router.use('/status', status)
router.use('/auth', auth)
router.use('/data', data)
router.use('/features', features)

export default router
