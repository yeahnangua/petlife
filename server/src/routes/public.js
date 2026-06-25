import { Router } from 'express'
import { createAiConsult } from '../controllers/aiConsultController.js'
import {
  getProduct,
  getService,
  listCategories,
  listProducts,
  listServices,
  listStoreSlots,
  listStores
} from '../controllers/publicController.js'

export function createPublicRouter() {
  const router = Router()

  router.get('/categories', listCategories)
  router.get('/products', listProducts)
  router.get('/products/:id', getProduct)
  router.get('/services', listServices)
  router.get('/services/:id', getService)
  router.get('/stores', listStores)
  router.get('/stores/:id/slots', listStoreSlots)
  router.post('/ai-consult', createAiConsult)

  return router
}
