import { success } from '../utils/apiResponse.js'
import {
  addCartItemForUser,
  clearInvalidCartItemsForUser,
  deleteCartItemForUser,
  getCart,
  updateCartItemForUser
} from '../services/cartService.js'

export function getUserCart(req, res, next) {
  try {
    const data = getCart(req.app.locals.db, req.user.id)
    res.json(success(data))
  } catch (error) {
    next(error)
  }
}

export function createCartItem(req, res, next) {
  try {
    const item = addCartItemForUser(req.app.locals.db, req.user.id, req.body)
    res.json(success({ item }))
  } catch (error) {
    next(error)
  }
}

export function updateCartItem(req, res, next) {
  try {
    const item = updateCartItemForUser(req.app.locals.db, req.user.id, req.params.id, req.body)
    res.json(success({ item }))
  } catch (error) {
    next(error)
  }
}

export function removeCartItem(req, res, next) {
  try {
    const item = deleteCartItemForUser(req.app.locals.db, req.user.id, req.params.id)
    res.json(success({ item }))
  } catch (error) {
    next(error)
  }
}

export function clearInvalidCartItems(req, res, next) {
  try {
    const data = clearInvalidCartItemsForUser(req.app.locals.db, req.user.id)
    res.json(success(data))
  } catch (error) {
    next(error)
  }
}
