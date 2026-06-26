import { Router } from 'express'
import { adminAuth } from '../middleware/adminAuth.js'
import {
  getAdminBooking,
  listAdminBookings,
  updateAdminBooking
} from '../controllers/adminBookingController.js'
import {
  createCategory,
  deleteCategory,
  listAdminCategories,
  updateCategory
} from '../controllers/adminCategoryController.js'
import {
  createCouponCampaign,
  issueCoupon,
  listCouponCampaigns,
  listIssuedCoupons,
  updateCouponCampaign,
  updateUserCoupon
} from '../controllers/adminCouponController.js'
import {
  getAdminOrder,
  listAdminOrders,
  updateAdminOrder
} from '../controllers/adminOrderController.js'
import {
  createProduct,
  createProductAiDraft,
  deleteProduct,
  listAdminProducts,
  updateProduct
} from '../controllers/adminProductController.js'
import {
  createService,
  createServiceAiDraft,
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
import { uploadImageFile, uploadImageFromUrl } from '../controllers/adminUploadController.js'
import { uploadImage } from '../middleware/uploadImage.js'

export function createAdminRouter() {
  const router = Router()

  router.use(adminAuth)
  router.post('/uploads/images', uploadImage, uploadImageFile)
  router.post('/uploads/images/from-url', uploadImageFromUrl)

  router.get('/categories', listAdminCategories)
  router.post('/categories', createCategory)
  router.put('/categories/:id', updateCategory)
  router.delete('/categories/:id', deleteCategory)

  router.get('/products', listAdminProducts)
  router.post('/products/ai-draft', createProductAiDraft)
  router.post('/products', createProduct)
  router.put('/products/:id', updateProduct)
  router.delete('/products/:id', deleteProduct)

  router.get('/services', listAdminServices)
  router.post('/services/ai-draft', createServiceAiDraft)
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

  router.get('/coupon-campaigns', listCouponCampaigns)
  router.post('/coupon-campaigns', createCouponCampaign)
  router.put('/coupon-campaigns/:id', updateCouponCampaign)
  router.post('/coupon-campaigns/:id/issue', issueCoupon)
  router.get('/user-coupons', listIssuedCoupons)
  router.put('/user-coupons/:id', updateUserCoupon)

  router.get('/orders', listAdminOrders)
  router.get('/orders/:id', getAdminOrder)
  router.post('/orders/:id/status', updateAdminOrder)

  router.get('/bookings', listAdminBookings)
  router.get('/bookings/:id', getAdminBooking)
  router.post('/bookings/:id/status', updateAdminBooking)

  return router
}
