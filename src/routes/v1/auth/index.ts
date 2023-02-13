import { Router } from 'express'

import session from './session'
import login from './login'
import register from './register'
import logout from './logout'

const router = Router()

router.use('/session', session)
router.use('/login', login)
router.use('/register', register)
router.use('/logout', logout)

export default router
