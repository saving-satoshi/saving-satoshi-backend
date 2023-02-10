import { Router } from 'express'

import account from './account'
import login from './login'
import register from './register'
import logout from './logout'

const router = Router()

router.use('/account', account)
router.use('/login', login)
router.use('/register', register)
router.use('/logout', logout)

export default router
