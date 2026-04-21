import { Router } from 'express'
import { attachDemoUser } from '../middleware/attachDemoUser.js'
import { createAddress, deleteAddress, listUserAddresses, updateAddress } from '../controllers/userAddressController.js'
import {
  clearInvalidCartItems,
  createCartItem,
  getUserCart,
  removeCartItem,
  updateCartItem
} from '../controllers/userCartController.js'
import { createPet, deletePet, listUserPets, updatePet } from '../controllers/userPetController.js'
import { getUserProfile } from '../controllers/userProfileController.js'

export function createUserRouter() {
  const router = Router()

  router.use(attachDemoUser)
  router.get('/profile', getUserProfile)
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

  return router
}
