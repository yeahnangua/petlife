import { randomUUID } from 'node:crypto'
import { AppError } from '../utils/appError.js'
import { requireEnum, requireString } from '../utils/validators.js'
import { findUserById } from '../repositories/userRepository.js'
import {
  countAvailableUserCoupons,
  createCouponCampaign,
  createUserCoupon,
  findCouponCampaignById,
  findIssuedCouponById,
  findUserCouponById,
  incrementCampaignIssuedCount,
  listCouponCampaigns,
  listIssuedCoupons,
  listUserCoupons,
  updateCouponCampaign,
  updateUserCouponStatus
} from '../repositories/couponRepository.js'

export const PRODUCT_ORDER_SHIPPING_FEE = 12
const COUPON_TARGET_TYPES = ['product', 'service', 'universal']

function now() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

function parseAmount(value, fieldName) {
  const amount = Number(value)
  if (!Number.isInteger(amount) || amount < 0) {
    throw new AppError(400, 40000, `${fieldName} must be a non-negative integer`)
  }
  return amount
}

function normalizeDateTime(value, fieldName) {
  const text = requireString(value, fieldName)
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(text)) {
    throw new AppError(400, 40000, `${fieldName} must use YYYY-MM-DD HH:mm:ss`)
  }
  return text
}

function normalizeCouponTarget(value = 'product') {
  return requireEnum(value || 'product', COUPON_TARGET_TYPES, 'target_type')
}

function normalizeQueryTarget(value) {
  if (!value) {
    return ''
  }

  return requireEnum(value, ['product', 'service'], 'target')
}

function mapCoupon(row, subtotal = 0, timestamp = now(), targetType = '') {
  const availableState = getAvailability(row, subtotal, timestamp, targetType)

  return {
    id: row.id,
    campaign_id: row.campaign_id,
    user_id: row.user_id,
    name: row.name,
    description: row.description,
    discount_amount: row.discount_amount,
    min_order_amount: row.min_order_amount,
    target_type: row.target_type || 'product',
    status: row.status,
    campaign_status: row.campaign_status,
    valid_from: row.valid_from,
    valid_to: row.valid_to,
    issued_at: row.issued_at,
    used_at: row.used_at,
    used_order_id: row.used_order_id,
    available: availableState.available,
    unavailable_reason: availableState.reason
  }
}

function mapCampaign(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    discount_amount: row.discount_amount,
    min_order_amount: row.min_order_amount,
    target_type: row.target_type || 'product',
    total_limit: row.total_limit,
    issued_count: row.issued_count,
    status: row.status,
    valid_from: row.valid_from,
    valid_to: row.valid_to,
    created_at: row.created_at,
    updated_at: row.updated_at
  }
}

function mapIssuedCoupon(row) {
  return {
    id: row.id,
    campaign_id: row.campaign_id,
    user_id: row.user_id,
    name: row.name,
    description: row.description,
    discount_amount: row.discount_amount,
    min_order_amount: row.min_order_amount,
    target_type: row.target_type || 'product',
    status: row.status,
    campaign_status: row.campaign_status,
    valid_from: row.valid_from,
    valid_to: row.valid_to,
    issued_at: row.issued_at,
    used_at: row.used_at,
    used_order_id: row.used_order_id
  }
}

function getAvailability(row, subtotal = 0, timestamp = now(), targetType = '') {
  if (row.status !== 'available') {
    return { available: false, reason: 'coupon is unavailable' }
  }

  if (row.campaign_status !== 'active') {
    return { available: false, reason: 'campaign is disabled' }
  }

  if (row.valid_from > timestamp || row.valid_to < timestamp) {
    return { available: false, reason: 'coupon is expired' }
  }

  if (targetType && !['universal', targetType].includes(row.target_type || 'product')) {
    return { available: false, reason: 'coupon target is not supported' }
  }

  if (Number(subtotal || 0) < row.min_order_amount) {
    return { available: false, reason: 'coupon threshold is not met' }
  }

  return { available: true, reason: '' }
}

export function getUserCoupons(db, userId, query = {}) {
  const subtotal = Number(query.subtotal || 0)
  const targetType = normalizeQueryTarget(query.target || query.target_type || '')
  const timestamp = now()
  return listUserCoupons(db, userId)
    .filter((row) => !targetType || ['universal', targetType].includes(row.target_type || 'product'))
    .map((row) => mapCoupon(row, subtotal, timestamp, targetType))
}

export function getAvailableCouponCount(db, userId) {
  return countAvailableUserCoupons(db, userId, now())
}

export function getRedeemableCoupon(db, userId, couponId, subtotal, targetType = 'product') {
  if (!couponId) {
    return null
  }
  const normalizedTargetType = normalizeQueryTarget(targetType)

  const coupon = findUserCouponById(db, userId, couponId)
  if (!coupon) {
    throw new AppError(409, 40910, 'coupon is unavailable')
  }

  const availability = getAvailability(coupon, subtotal, now(), normalizedTargetType)
  if (!availability.available) {
    throw new AppError(
      409,
      availability.reason === 'coupon threshold is not met' ? 40911 : 40910,
      availability.reason
    )
  }

  return coupon
}

export function markCouponUsed(db, couponId, orderId, timestamp) {
  const coupon = findIssuedCouponById(db, couponId)
  if (!coupon) {
    throw new AppError(409, 40910, 'coupon is unavailable')
  }

  updateUserCouponStatus(db, {
    id: couponId,
    status: 'used',
    used_at: timestamp,
    used_order_id: orderId,
    updated_at: timestamp
  })
}

export function getAdminCouponCampaigns(db) {
  return listCouponCampaigns(db).map(mapCampaign)
}

export function createAdminCouponCampaign(db, payload) {
  const timestamp = now()
  const campaign = {
    id: `coupon_${randomUUID().slice(0, 10)}`,
    name: requireString(payload.name, 'name'),
    description: requireString(payload.description, 'description'),
    discount_amount: parseAmount(payload.discount_amount, 'discount_amount'),
    min_order_amount: parseAmount(payload.min_order_amount, 'min_order_amount'),
    total_limit: parseAmount(payload.total_limit ?? 0, 'total_limit'),
    target_type: normalizeCouponTarget(payload.target_type),
    issued_count: 0,
    status: 'active',
    valid_from: normalizeDateTime(payload.valid_from, 'valid_from'),
    valid_to: normalizeDateTime(payload.valid_to, 'valid_to'),
    created_at: timestamp,
    updated_at: timestamp
  }

  createCouponCampaign(db, campaign)
  return mapCampaign(findCouponCampaignById(db, campaign.id))
}

export function updateAdminCouponCampaign(db, campaignId, payload) {
  const current = findCouponCampaignById(db, campaignId)
  if (!current) {
    throw new AppError(404, 40400, 'coupon campaign not found')
  }

  const campaign = {
    id: campaignId,
    name: requireString(payload.name, 'name'),
    description: requireString(payload.description, 'description'),
    discount_amount: parseAmount(payload.discount_amount, 'discount_amount'),
    min_order_amount: parseAmount(payload.min_order_amount, 'min_order_amount'),
    total_limit: parseAmount(payload.total_limit ?? 0, 'total_limit'),
    target_type: normalizeCouponTarget(payload.target_type ?? current.target_type ?? 'product'),
    status: requireEnum(payload.status, ['active', 'disabled'], 'status'),
    valid_from: normalizeDateTime(payload.valid_from, 'valid_from'),
    valid_to: normalizeDateTime(payload.valid_to, 'valid_to'),
    updated_at: now()
  }

  updateCouponCampaign(db, campaign)
  return mapCampaign(findCouponCampaignById(db, campaignId))
}

export function issueCouponToUser(db, campaignId, payload) {
  const campaign = findCouponCampaignById(db, campaignId)
  if (!campaign || campaign.status !== 'active') {
    throw new AppError(409, 40912, 'coupon campaign is unavailable')
  }

  if (campaign.total_limit > 0 && campaign.issued_count >= campaign.total_limit) {
    throw new AppError(409, 40912, 'coupon campaign quota is exhausted')
  }

  const userId = requireString(payload.user_id, 'user_id')
  if (!findUserById(db, userId)) {
    throw new AppError(404, 40400, 'user not found')
  }

  const timestamp = now()
  const coupon = {
    id: `uc_${randomUUID().slice(0, 10)}`,
    campaign_id: campaignId,
    user_id: userId,
    status: 'available',
    issued_at: timestamp,
    used_at: '',
    used_order_id: '',
    created_at: timestamp,
    updated_at: timestamp
  }

  const transaction = db.transaction(() => {
    createUserCoupon(db, coupon)
    incrementCampaignIssuedCount(db, campaignId, timestamp)
  })

  transaction()

  return mapIssuedCoupon(findIssuedCouponById(db, coupon.id))
}

export function getAdminIssuedCoupons(db, query = {}) {
  return listIssuedCoupons(db, { user_id: query.user_id?.trim() }).map(mapIssuedCoupon)
}

export function updateIssuedCoupon(db, couponId, payload) {
  const current = findIssuedCouponById(db, couponId)
  if (!current) {
    throw new AppError(404, 40400, 'coupon not found')
  }

  const status = requireEnum(payload.status, ['available', 'disabled'], 'status')
  updateUserCouponStatus(db, {
    id: couponId,
    status,
    used_at: '',
    used_order_id: '',
    updated_at: now()
  })

  return mapIssuedCoupon(findIssuedCouponById(db, couponId))
}
