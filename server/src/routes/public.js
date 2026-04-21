import { Router } from 'express'
import { success } from '../utils/apiResponse.js'

export function createPublicRouter() {
  const router = Router()

  router.get('/categories', (_req, res) => {
    res.json(success({ items: [] }))
  })

  return router
}
