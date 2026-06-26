import { Router } from 'express'
import { requireUserAuth } from '../middleware/requireUserAuth.js'
import { uploadImage } from '../middleware/uploadImage.js'
import { createAddress, deleteAddress, listUserAddresses, updateAddress } from '../controllers/userAddressController.js'
import {
  cancelBooking,
  createBooking,
  getUserBooking,
  listUserBookings
} from '../controllers/userBookingController.js'
import {
  clearInvalidCartItems,
  createCartItem,
  getUserCart,
  removeCartItem,
  updateCartItem
} from '../controllers/userCartController.js'
import {
  cancelOrder,
  createOrder,
  getUserOrder,
  listUserOrders
} from '../controllers/userOrderController.js'
import { createPet, deletePet, listUserPets, updatePet } from '../controllers/userPetController.js'
import { getUserProfile, updateUserProfile } from '../controllers/userProfileController.js'
import { uploadUserImageFile } from '../controllers/userUploadController.js'

export function createUserRouter() {
  const router = Router()

  router.use(requireUserAuth)
  router.post('/uploads/images', uploadImage, uploadUserImageFile)
  router.get('/profile', getUserProfile)
  router.put('/profile', updateUserProfile)
  router.get('/addresses', listUserAddresses)
  router.post('/addresses', createAddress)
  router.put('/addresses/:id', updateAddress)
  router.delete('/addresses/:id', deleteAddress)
  router.get('/pets', listUserPets)
  router.post('/pets', createPet)
  router.put('/pets/:id', updatePet)
  router.delete('/pets/:id', deletePet)
  router.get('/cart', getUserCart)
  router.post('/cart/items', createCartItem)
  router.put('/cart/items/:id', updateCartItem)
  router.delete('/cart/items/:id', removeCartItem)
  router.delete('/cart/invalid-items', clearInvalidCartItems)
  router.post('/orders', createOrder)
  router.get('/orders', listUserOrders)
  router.get('/orders/:id', getUserOrder)
  router.post('/orders/:id/cancel', cancelOrder)
  router.post('/bookings', createBooking)
  router.get('/bookings', listUserBookings)
  router.get('/bookings/:id', getUserBooking)
  router.post('/bookings/:id/cancel', cancelBooking)

  return router
}
