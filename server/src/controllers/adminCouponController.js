import { success } from '../utils/apiResponse.js'
import {
  createAdminCouponCampaign,
  getAdminCouponCampaigns,
  getAdminIssuedCoupons,
  issueCouponToUser,
  updateAdminCouponCampaign,
  updateIssuedCoupon
} from '../services/couponService.js'

export function listCouponCampaigns(req, res, next) {
  try {
    res.json(success({ list: getAdminCouponCampaigns(req.app.locals.db) }))
  } catch (error) {
    next(error)
  }
}

export function createCouponCampaign(req, res, next) {
  try {
    res.status(201).json(success({ item: createAdminCouponCampaign(req.app.locals.db, req.body) }))
  } catch (error) {
    next(error)
  }
}

export function updateCouponCampaign(req, res, next) {
  try {
    res.json(success({ item: updateAdminCouponCampaign(req.app.locals.db, req.params.id, req.body) }))
  } catch (error) {
    next(error)
  }
}

export function issueCoupon(req, res, next) {
  try {
    res.status(201).json(success({ item: issueCouponToUser(req.app.locals.db, req.params.id, req.body) }))
  } catch (error) {
    next(error)
  }
}

export function listIssuedCoupons(req, res, next) {
  try {
    res.json(success({ list: getAdminIssuedCoupons(req.app.locals.db, req.query) }))
  } catch (error) {
    next(error)
  }
}

export function updateUserCoupon(req, res, next) {
  try {
    res.json(success({ item: updateIssuedCoupon(req.app.locals.db, req.params.id, req.body) }))
  } catch (error) {
    next(error)
  }
}
