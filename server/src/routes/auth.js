import { Router } from 'express'
import { getSession, logout, wechatLogin } from '../controllers/authController.js'

export function createAuthRouter() {
  const router = Router()

  router.post('/wechat-login', wechatLogin)
  router.get('/session', getSession)
  router.post('/logout', logout)

  return router
}
