import { randomUUID } from 'node:crypto'
import { AppError } from '../utils/appError.js'
import { requireDateString, requireString } from '../utils/validators.js'
import {
  createBooking,
  findBookingById,
  listBookingsByUserId,
  listSlotUsageByStoreAndDate,
  updateBookingStatus
} from '../repositories/bookingRepository.js'
import { findPetById } from '../repositories/petRepository.js'
import { findActiveServiceById } from '../repositories/serviceRepository.js'
import { findActiveStoreById } from '../repositories/storeRepository.js'
import { findEnabledTimeSlotById } from '../repositories/timeSlotRepository.js'
import { getRedeemableCoupon, markCouponUsed } from './couponService.js'

const BOOKING_STATUS_LABELS = {
  pendingService: '待服务',
  completed: '已完成',
  cancelled: '已取消'
}

function now() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

function formatBookingNumber(date = new Date()) {
  const parts = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
    String(date.getSeconds()).padStart(2, '0')
  ]

  return `BK${parts.join('')}${randomUUID().slice(0, 4).toUpperCase()}`
}

function getStatusLabel(status) {
  return BOOKING_STATUS_LABELS[status] ?? status
}

function getServicePrice(service) {
  return service.member_price ?? service.price
}

function mapBooking(row) {
  return {
    id: row.id,
    booking_no: row.booking_no,
    pet_id: row.pet_id,
    pet_name_snapshot: row.pet_name_snapshot,
    pet_type_snapshot: row.pet_type_snapshot,
    service_id: row.service_id,
    service_title_snapshot: row.service_title_snapshot,
    service_cover_snapshot: row.service_cover_snapshot,
    service_price_snapshot: row.service_price_snapshot,
    subtotal_amount: row.subtotal_amount ?? row.service_price_snapshot,
    discount_amount: row.discount_amount ?? 0,
    payable_amount: row.payable_amount ?? row.service_price_snapshot,
    coupon_id: row.coupon_id || '',
    coupon_name_snapshot: row.coupon_name_snapshot || '',
    store_id: row.store_id,
    store_name_snapshot: row.store_name_snapshot,
    time_slot_id: row.time_slot_id,
    time_slot_label_snapshot: row.time_slot_label_snapshot,
    booking_date: row.booking_date,
    scheduled_at: `${row.booking_date} ${row.time_slot_label_snapshot}`,
    status: row.status,
    status_label: row.status_label,
    contact_phone: row.contact_phone,
    note: row.note,
    created_at: row.created_at,
    updated_at: row.updated_at
  }
}

function loadOwnedBooking(db, userId, bookingId) {
  const booking = findBookingById(db, userId, bookingId)
  if (!booking) {
    throw new AppError(404, 40400, 'booking not found')
  }

  return booking
}

function validateBookingPayload(db, userId, payload) {
  const petId = requireString(payload.pet_id, 'pet_id')
  const serviceId = requireString(payload.service_id, 'service_id')
  const storeId = requireString(payload.store_id, 'store_id')
  const timeSlotId = requireString(payload.time_slot_id, 'time_slot_id')
  const bookingDate = requireDateString(payload.booking_date, 'booking_date')
  const contactPhone = requireString(payload.contact_phone, 'contact_phone')
  const note = payload.note == null ? '' : String(payload.note).trim()

  const pet = findPetById(db, userId, petId)
  if (!pet) {
    throw new AppError(404, 40400, 'pet not found')
  }

  const service = findActiveServiceById(db, serviceId)
  if (!service) {
    throw new AppError(404, 40400, 'service not found')
  }

  if (service.pet_type !== 'all' && service.pet_type !== pet.type) {
    throw new AppError(409, 40900, 'service is not available for pet type')
  }

  const store = findActiveStoreById(db, storeId)
  if (!store) {
    throw new AppError(404, 40400, 'store not found')
  }

  const timeSlot = findEnabledTimeSlotById(db, timeSlotId)
  if (!timeSlot) {
    throw new AppError(404, 40400, 'time slot not found')
  }

  return {
    pet,
    service,
    store,
    timeSlot,
    bookingDate,
    contactPhone,
    note
  }
}

function ensureSlotCapacity(db, storeId, bookingDate, timeSlot) {
  const usageBySlotId = new Map(
    listSlotUsageByStoreAndDate(db, storeId, bookingDate).map((row) => [row.time_slot_id, row.used])
  )

  const used = usageBySlotId.get(timeSlot.id) ?? 0
  if (used >= timeSlot.capacity) {
    throw new AppError(409, 40900, 'time slot is full')
  }
}

export function createUserBooking(db, userId, payload) {
  const validated = validateBookingPayload(db, userId, payload)

  const transaction = db.transaction(() => {
    ensureSlotCapacity(db, validated.store.id, validated.bookingDate, validated.timeSlot)

    const timestamp = now()
    const subtotalAmount = getServicePrice(validated.service)
    const coupon = getRedeemableCoupon(db, userId, payload.coupon_id, subtotalAmount, 'service')
    const discountAmount = coupon ? Math.min(coupon.discount_amount, subtotalAmount) : 0
    const record = {
      id: `booking_${randomUUID().slice(0, 8)}`,
      booking_no: formatBookingNumber(),
      user_id: userId,
      pet_id: validated.pet.id,
      pet_name_snapshot: validated.pet.name,
      pet_type_snapshot: validated.pet.type,
      service_id: validated.service.id,
      service_title_snapshot: validated.service.title,
      service_cover_snapshot: validated.service.cover_url,
      service_price_snapshot: subtotalAmount,
      subtotal_amount: subtotalAmount,
      discount_amount: discountAmount,
      payable_amount: Math.max(subtotalAmount - discountAmount, 0),
      coupon_id: coupon?.id ?? '',
      coupon_name_snapshot: coupon?.name ?? '',
      store_id: validated.store.id,
      store_name_snapshot: validated.store.name,
      time_slot_id: validated.timeSlot.id,
      time_slot_label_snapshot: validated.timeSlot.label,
      booking_date: validated.bookingDate,
      status: 'pendingService',
      status_label: getStatusLabel('pendingService'),
      contact_phone: validated.contactPhone,
      note: validated.note,
      created_at: timestamp,
      updated_at: timestamp
    }

    createBooking(db, record)
    if (coupon) {
      markCouponUsed(db, coupon.id, record.id, timestamp)
    }
    return record
  })

  return mapBooking(transaction())
}

export function getUserBookings(db, userId) {
  return listBookingsByUserId(db, userId).map(mapBooking)
}

export function getUserBookingDetail(db, userId, bookingId) {
  return mapBooking(loadOwnedBooking(db, userId, bookingId))
}

export function cancelUserBooking(db, userId, bookingId) {
  const currentBooking = loadOwnedBooking(db, userId, bookingId)

  if (currentBooking.status !== 'pendingService') {
    throw new AppError(409, 40900, 'booking cannot be cancelled')
  }

  updateBookingStatus(db, {
    id: bookingId,
    user_id: userId,
    status: 'cancelled',
    status_label: getStatusLabel('cancelled'),
    updated_at: now()
  })

  return getUserBookingDetail(db, userId, bookingId)
}
