import { Router } from 'express'

import accounts from './accounts'
import auth from './auth'
import status from './status'
import progress from './progress'
import features from './features'

const router = Router()

router.use('/status', status)
router.use('/accounts', accounts)
router.use('/auth', auth)
router.use('/progress', progress)
router.use('/features', features)

export default router
