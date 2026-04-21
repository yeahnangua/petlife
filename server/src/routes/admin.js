import { Router } from 'express'
import { adminAuth } from '../middleware/adminAuth.js'
import { success } from '../utils/apiResponse.js'

export function createAdminRouter() {
  const router = Router()

  router.use(adminAuth)
  router.get('/categories', (_req, res) => {
    res.json(success({ items: [] }))
  })

  return router
}
