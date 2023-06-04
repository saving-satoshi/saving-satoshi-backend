import { Router } from 'express'

import accounts from './accounts'
import auth from './auth'
import status from './status'
import progress from './progress'

const router = Router()

router.use('/status', status)
router.use('/accounts', accounts)
router.use('/auth', auth)
router.use('/progress', progress)

export default router
