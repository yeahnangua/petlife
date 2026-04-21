import { Router } from 'express'
import { adminAuth } from '../middleware/adminAuth.js'
import {
  createCategory,
  deleteCategory,
  listAdminCategories,
  updateCategory
} from '../controllers/adminCategoryController.js'
import {
  createProduct,
  deleteProduct,
  listAdminProducts,
  updateProduct
} from '../controllers/adminProductController.js'
import {
  createService,
  deleteService,
  listAdminServices,
  updateService
} from '../controllers/adminServiceController.js'
import {
  createStore,
  deleteStore,
  listAdminStores,
  updateStore
} from '../controllers/adminStoreController.js'
import {
  createTimeSlot,
  deleteTimeSlot,
  listAdminTimeSlots,
  updateTimeSlot
} from '../controllers/adminTimeSlotController.js'
import { uploadImageFile } from '../controllers/adminUploadController.js'
import { uploadImage } from '../middleware/uploadImage.js'

export function createAdminRouter() {
  const router = Router()

  router.use(adminAuth)
  router.post('/uploads/images', uploadImage, uploadImageFile)

  router.get('/categories', listAdminCategories)
  router.post('/categories', createCategory)
  router.put('/categories/:id', updateCategory)
  router.delete('/categories/:id', deleteCategory)

  router.get('/products', listAdminProducts)
  router.post('/products', createProduct)
  router.put('/products/:id', updateProduct)
  router.delete('/products/:id', deleteProduct)

  router.get('/services', listAdminServices)
  router.post('/services', createService)
  router.put('/services/:id', updateService)
  router.delete('/services/:id', deleteService)

  router.get('/stores', listAdminStores)
  router.post('/stores', createStore)
  router.put('/stores/:id', updateStore)
  router.delete('/stores/:id', deleteStore)

  router.get('/time-slots', listAdminTimeSlots)
  router.post('/time-slots', createTimeSlot)
  router.put('/time-slots/:id', updateTimeSlot)
  router.delete('/time-slots/:id', deleteTimeSlot)

  return router
}
