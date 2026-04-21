import { Router } from 'express'
import { attachDemoUser } from '../middleware/attachDemoUser.js'

export function createUserRouter() {
  const router = Router()

  router.use(attachDemoUser)

  return router
}
