import { success } from '../utils/apiResponse.js'
import {
  getAdminBookingDetail,
  getAdminBookings,
  updateAdminBookingStatus
} from '../services/adminOperationsService.js'

export function listAdminBookings(req, res, next) {
  try {
    const list = getAdminBookings(req.app.locals.db, req.query)
    res.json(success({ list }))
  } catch (error) {
    next(error)
  }
}

export function getAdminBooking(req, res, next) {
  try {
    const booking = getAdminBookingDetail(req.app.locals.db, req.params.id)
    res.json(success({ booking }))
  } catch (error) {
    next(error)
  }
}

export function updateAdminBooking(req, res, next) {
  try {
    const booking = updateAdminBookingStatus(req.app.locals.db, req.params.id, req.body)
    res.json(success({ booking }))
  } catch (error) {
    next(error)
  }
}
