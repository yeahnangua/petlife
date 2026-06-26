import { success } from '../utils/apiResponse.js'
import { getUserCoupons } from '../services/couponService.js'

export function listUserCouponsController(req, res, next) {
  try {
    res.json(success({ list: getUserCoupons(req.app.locals.db, req.user.id, req.query) }))
  } catch (error) {
    next(error)
  }
}
