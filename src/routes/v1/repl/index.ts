import { Router } from 'express'

import prepare from './prepare'
import run from './run'

const router = Router()

router.use('/prepare', prepare)
router.use('/run', run)

export default router
