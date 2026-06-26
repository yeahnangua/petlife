import express, { Router } from 'express'
import {
  handleWechatEventCallback,
  verifyWechatEventCallback
} from '../controllers/wechatEventController.js'

export function createWechatRouter() {
  const router = Router()

  router.get('/events', verifyWechatEventCallback)
  router.post(
    '/events',
    express.text({ type: ['text/xml', 'application/xml', '*/xml'] }),
    handleWechatEventCallback
  )

  return router
}
