import { Router } from 'express'

import save from './save'
import load from './load'

const router = Router()

router.use('/save', save)
router.use('/load', load)

export default router

