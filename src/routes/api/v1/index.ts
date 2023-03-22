import { Router } from 'express'

import accounts from './accounts'
import auth from './auth'

const router = Router()

router.use('/accounts', accounts)
router.use('/auth', auth)

export default router
