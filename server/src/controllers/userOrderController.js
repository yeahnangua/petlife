import { success } from '../utils/apiResponse.js'
import { cancelUserOrder, createUserOrder, getUserOrderDetail, getUserOrders } from '../services/orderService.js'

export function createOrder(req, res, next) {
  try {
    const order = createUserOrder(req.app.locals.db, req.user.id, req.body)
    res.status(201).json(success({ order }))
  } catch (error) {
    next(error)
  }
}

export function listUserOrders(req, res, next) {
  try {
    const list = getUserOrders(req.app.locals.db, req.user.id)
    res.json(success({ list }))
  } catch (error) {
    next(error)
  }
}

export function getUserOrder(req, res, next) {
  try {
    const order = getUserOrderDetail(req.app.locals.db, req.user.id, req.params.id)
    res.json(success({ order }))
  } catch (error) {
    next(error)
  }
}

export function cancelOrder(req, res, next) {
  try {
    const order = cancelUserOrder(req.app.locals.db, req.user.id, req.params.id)
    res.json(success({ order }))
  } catch (error) {
    next(error)
  }
}
