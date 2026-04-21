import { AppError } from '../utils/appError.js'
import { requireEnum } from '../utils/validators.js'
import {
  findBookingByIdForAdmin,
  listBookings,
  updateBookingStatus
} from '../repositories/bookingRepository.js'
import {
  findOrderByIdForAdmin,
  listOrderItemsByOrderId,
  listOrders,
  updateOrderStatus
} from '../repositories/orderRepository.js'
import { findAnyProductById, updateProductInventory } from '../repositories/productRepository.js'

const ORDER_STATUS_LABELS = {
  pendingShipment: '待发货',
  completed: '已完成',
  cancelled: '已取消'
}

const BOOKING_STATUS_LABELS = {
  pendingService: '待服务',
  completed: '已完成',
  cancelled: '已取消'
}

function now() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

function mapOrderItem(row) {
  return {
    id: row.id,
    product_id: row.product_id,
    product_title_snapshot: row.product_title_snapshot,
    product_cover_snapshot: row.product_cover_snapshot,
    spec_label_snapshot: row.spec_label_snapshot,
    unit_price_snapshot: row.unit_price_snapshot,
    quantity: row.quantity,
    line_total: row.line_total
  }
}

function mapOrder(db, row) {
  const items = listOrderItemsByOrderId(db, row.id).map(mapOrderItem)

  return {
    id: row.id,
    order_no: row.order_no,
    user_id: row.user_id,
    status: row.status,
    status_label: row.status_label,
    total_amount: row.total_amount,
    remark: row.remark,
    receiver_name_snapshot: row.receiver_name_snapshot,
    receiver_phone_snapshot: row.receiver_phone_snapshot,
    receiver_region_snapshot: row.receiver_region_snapshot,
    receiver_address_snapshot: row.receiver_address_snapshot,
    created_at: row.created_at,
    updated_at: row.updated_at,
    item_count: items.reduce((sum, item) => sum + item.quantity, 0),
    items
  }
}

function mapBooking(row) {
  return {
    id: row.id,
    booking_no: row.booking_no,
    user_id: row.user_id,
    pet_id: row.pet_id,
    pet_name_snapshot: row.pet_name_snapshot,
    pet_type_snapshot: row.pet_type_snapshot,
    service_id: row.service_id,
    service_title_snapshot: row.service_title_snapshot,
    service_cover_snapshot: row.service_cover_snapshot,
    service_price_snapshot: row.service_price_snapshot,
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

function loadOrder(db, orderId) {
  const order = findOrderByIdForAdmin(db, orderId)
  if (!order) {
    throw new AppError(404, 40400, 'order not found')
  }

  return order
}

function loadBooking(db, bookingId) {
  const booking = findBookingByIdForAdmin(db, bookingId)
  if (!booking) {
    throw new AppError(404, 40400, 'booking not found')
  }

  return booking
}

function restoreOrderInventory(db, orderId, timestamp) {
  const items = listOrderItemsByOrderId(db, orderId)

  for (const item of items) {
    const product = findAnyProductById(db, item.product_id)
    if (!product) {
      continue
    }

    const nextStock = product.stock + item.quantity
    updateProductInventory(db, {
      id: product.id,
      stock: nextStock,
      stock_status: nextStock > 0 ? 'inStock' : 'soldOut',
      updated_at: timestamp
    })
  }
}

export function getAdminOrders(db, query = {}) {
  const status = query.status?.trim()
  return listOrders(db, { status }).map((row) => mapOrder(db, row))
}

export function getAdminOrderDetail(db, orderId) {
  return mapOrder(db, loadOrder(db, orderId))
}

export function updateAdminOrderStatus(db, orderId, payload) {
  const targetStatus = requireEnum(payload.status, ['completed', 'cancelled'], 'status')
  const currentOrder = loadOrder(db, orderId)

  if (currentOrder.status === targetStatus) {
    return mapOrder(db, currentOrder)
  }

  if (currentOrder.status !== 'pendingShipment') {
    throw new AppError(409, 40900, 'order status cannot be changed')
  }

  const transaction = db.transaction(() => {
    const timestamp = now()

    if (targetStatus === 'cancelled') {
      restoreOrderInventory(db, orderId, timestamp)
    }

    updateOrderStatus(db, {
      id: orderId,
      user_id: currentOrder.user_id,
      status: targetStatus,
      status_label: ORDER_STATUS_LABELS[targetStatus],
      updated_at: timestamp
    })
  })

  transaction()

  return getAdminOrderDetail(db, orderId)
}

export function getAdminBookings(db, query = {}) {
  const status = query.status?.trim()
  return listBookings(db, { status }).map(mapBooking)
}

export function getAdminBookingDetail(db, bookingId) {
  return mapBooking(loadBooking(db, bookingId))
}

export function updateAdminBookingStatus(db, bookingId, payload) {
  const targetStatus = requireEnum(payload.status, ['completed', 'cancelled'], 'status')
  const currentBooking = loadBooking(db, bookingId)

  if (currentBooking.status === targetStatus) {
    return mapBooking(currentBooking)
  }

  if (currentBooking.status !== 'pendingService') {
    throw new AppError(409, 40900, 'booking status cannot be changed')
  }

  updateBookingStatus(db, {
    id: bookingId,
    user_id: currentBooking.user_id,
    status: targetStatus,
    status_label: BOOKING_STATUS_LABELS[targetStatus],
    updated_at: now()
  })

  return getAdminBookingDetail(db, bookingId)
}
