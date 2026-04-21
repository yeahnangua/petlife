import { success } from '../utils/apiResponse.js'
import {
  cancelUserBooking,
  createUserBooking,
  getUserBookingDetail,
  getUserBookings
} from '../services/bookingService.js'

export function createBooking(req, res, next) {
  try {
    const booking = createUserBooking(req.app.locals.db, req.user.id, req.body)
    res.status(201).json(success({ booking }))
  } catch (error) {
    next(error)
  }
}

export function listUserBookings(req, res, next) {
  try {
    const list = getUserBookings(req.app.locals.db, req.user.id)
    res.json(success({ list }))
  } catch (error) {
    next(error)
  }
}

export function getUserBooking(req, res, next) {
  try {
    const booking = getUserBookingDetail(req.app.locals.db, req.user.id, req.params.id)
    res.json(success({ booking }))
  } catch (error) {
    next(error)
  }
}

export function cancelBooking(req, res, next) {
  try {
    const booking = cancelUserBooking(req.app.locals.db, req.user.id, req.params.id)
    res.json(success({ booking }))
  } catch (error) {
    next(error)
  }
}
