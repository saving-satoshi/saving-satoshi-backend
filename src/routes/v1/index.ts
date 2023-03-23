import { Router } from 'express'

import accounts from './accounts'
import auth from './auth'
import status from './status'

const router = Router()

router.use('/status', status)
router.use('/accounts', accounts)
router.use('/auth', auth)

export default router
