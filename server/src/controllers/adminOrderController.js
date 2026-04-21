import { success } from '../utils/apiResponse.js'
import {
  getAdminOrderDetail,
  getAdminOrders,
  updateAdminOrderStatus
} from '../services/adminOperationsService.js'

export function listAdminOrders(req, res, next) {
  try {
    const list = getAdminOrders(req.app.locals.db, req.query)
    res.json(success({ list }))
  } catch (error) {
    next(error)
  }
}

export function getAdminOrder(req, res, next) {
  try {
    const order = getAdminOrderDetail(req.app.locals.db, req.params.id)
    res.json(success({ order }))
  } catch (error) {
    next(error)
  }
}

export function updateAdminOrder(req, res, next) {
  try {
    const order = updateAdminOrderStatus(req.app.locals.db, req.params.id, req.body)
    res.json(success({ order }))
  } catch (error) {
    next(error)
  }
}
