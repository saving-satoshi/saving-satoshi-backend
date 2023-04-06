import { Router } from 'express'

import set from './set'
import get from './get'

const router = Router()

router.use('/', set)
router.use('/', get)

export default router
