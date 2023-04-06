import { Router } from 'express'

import save from './save'
import get from './get'

const router = Router()

router.use('/save', save)
router.use('/', get)

export default router
