import { Router } from 'express'
import {
  finishWechatOAuth,
  getSession,
  logout,
  startWechatOAuth,
  wechatLogin
} from '../controllers/authController.js'

export function createAuthRouter() {
  const router = Router()

  router.post('/wechat-login', wechatLogin)
  router.get('/wechat-oauth/start', startWechatOAuth)
  router.get('/wechat-oauth/callback', finishWechatOAuth)
  router.get('/session', getSession)
  router.post('/logout', logout)

  return router
}
