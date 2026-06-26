import { randomUUID } from 'node:crypto'
import { AppError } from '../utils/appError.js'
import { requireString } from '../utils/validators.js'
import { findAddressById } from '../repositories/addressRepository.js'
import { deleteCartItemsByIds } from '../repositories/cartRepository.js'
import {
  createOrder,
  createOrderItem,
  findOrderById,
  listOrderItemsByOrderId,
  listOrdersByUserId,
  updateOrderStatus
} from '../repositories/orderRepository.js'
import { findAnyProductById, updateProductInventory } from '../repositories/productRepository.js'
import { getCart } from './cartService.js'
import { PRODUCT_ORDER_SHIPPING_FEE, getRedeemableCoupon, markCouponUsed } from './couponService.js'

const ORDER_STATUS_LABELS = {
  pendingShipment: '待发货',
  completed: '已完成',
  cancelled: '已取消'
}

function now() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

function formatOrderNumber(date = new Date()) {
  const parts = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
    String(date.getSeconds()).padStart(2, '0')
  ]

  return `PO${parts.join('')}${randomUUID().slice(0, 4).toUpperCase()}`
}

function getStatusLabel(status) {
  return ORDER_STATUS_LABELS[status] ?? status
}

function getUnitPrice(product) {
  return product.member_price ?? product.price
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
    status: row.status,
    status_label: row.status_label,
    total_amount: row.total_amount,
    subtotal_amount: row.subtotal_amount,
    shipping_fee: row.shipping_fee,
    discount_amount: row.discount_amount,
    payable_amount: row.payable_amount,
    coupon_id: row.coupon_id,
    coupon_name_snapshot: row.coupon_name_snapshot,
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

function getSelectedCartItems(db, userId) {
  return getCart(db, userId).list.filter((item) => item.isValid && item.selected)
}

function loadOwnedOrder(db, userId, orderId) {
  const order = findOrderById(db, userId, orderId)
  if (!order) {
    throw new AppError(404, 40400, 'order not found')
  }

  return order
}

function getAddressSnapshot(db, userId, addressId) {
  const address = findAddressById(db, userId, addressId)
  if (!address) {
    throw new AppError(404, 40400, 'address not found')
  }

  return address
}

function buildOrderItems(db, cartItems) {
  const reservedQuantityByProductId = new Map()

  return cartItems.map((item, index) => {
    const product = findAnyProductById(db, item.productId)
    if (!product || product.status !== 'active') {
      throw new AppError(409, 40900, 'product is unavailable')
    }

    const reservedQuantity = (reservedQuantityByProductId.get(product.id) ?? 0) + item.quantity
    reservedQuantityByProductId.set(product.id, reservedQuantity)

    if (product.stock_status === 'soldOut' || product.stock < reservedQuantity) {
      throw new AppError(409, 40900, 'product stock is insufficient')
    }

    const unitPrice = getUnitPrice(product)

    return {
      cartItemId: item.id,
      product,
      orderItem: {
        id: `oi_${String(index + 1).padStart(2, '0')}_${randomUUID().slice(0, 6)}`,
        product_id: product.id,
        product_title_snapshot: product.title,
        product_cover_snapshot: product.cover_url,
        spec_label_snapshot: item.specLabel,
        unit_price_snapshot: unitPrice,
        quantity: item.quantity,
        line_total: unitPrice * item.quantity
      }
    }
  })
}

function updateInventory(db, product, delta, timestamp) {
  const nextStock = product.stock + delta

  updateProductInventory(db, {
    id: product.id,
    stock: nextStock,
    stock_status: nextStock > 0 ? 'inStock' : 'soldOut',
    updated_at: timestamp
  })
}

export function createUserOrder(db, userId, payload) {
  const addressId = requireString(payload.address_id, 'address_id')
  const remark = payload.remark == null ? '' : String(payload.remark).trim()
  const address = getAddressSnapshot(db, userId, addressId)
  const selectedCartItems = getSelectedCartItems(db, userId)

  if (selectedCartItems.length === 0) {
    throw new AppError(409, 40900, 'no selected valid cart items')
  }

  const transaction = db.transaction(() => {
    const timestamp = now()
    const pendingOrderItems = buildOrderItems(db, selectedCartItems)
    const subtotalAmount = pendingOrderItems.reduce((sum, item) => sum + item.orderItem.line_total, 0)
    const coupon = getRedeemableCoupon(db, userId, payload.coupon_id, subtotalAmount)
    const discountAmount = coupon ? Math.min(coupon.discount_amount, subtotalAmount) : 0
    const productPayableAmount = Math.max(subtotalAmount - discountAmount, 0)
    const shippingFee = subtotalAmount > 0 ? PRODUCT_ORDER_SHIPPING_FEE : 0
    const order = {
      id: `order_${randomUUID().slice(0, 8)}`,
      order_no: formatOrderNumber(),
      user_id: userId,
      status: 'pendingShipment',
      status_label: getStatusLabel('pendingShipment'),
      total_amount: productPayableAmount,
      subtotal_amount: subtotalAmount,
      shipping_fee: shippingFee,
      discount_amount: discountAmount,
      payable_amount: productPayableAmount + shippingFee,
      coupon_id: coupon?.id ?? '',
      coupon_name_snapshot: coupon?.name ?? '',
      remark,
      receiver_name_snapshot: address.receiver_name,
      receiver_phone_snapshot: address.receiver_phone,
      receiver_region_snapshot: address.region,
      receiver_address_snapshot: address.detail_address,
      created_at: timestamp,
      updated_at: timestamp
    }

    createOrder(db, order)
    if (coupon) {
      markCouponUsed(db, coupon.id, order.id, timestamp)
    }

    for (const item of pendingOrderItems) {
      createOrderItem(db, {
        ...item.orderItem,
        order_id: order.id
      })
      updateInventory(db, item.product, -item.orderItem.quantity, timestamp)
    }

    deleteCartItemsByIds(
      db,
      userId,
      pendingOrderItems.map((item) => item.cartItemId)
    )

    return order.id
  })

  return getUserOrderDetail(db, userId, transaction())
}

export function getUserOrders(db, userId) {
  return listOrdersByUserId(db, userId).map((row) => mapOrder(db, row))
}

export function getUserOrderDetail(db, userId, orderId) {
  return mapOrder(db, loadOwnedOrder(db, userId, orderId))
}

export function cancelUserOrder(db, userId, orderId) {
  const currentOrder = loadOwnedOrder(db, userId, orderId)

  if (currentOrder.status !== 'pendingShipment') {
    throw new AppError(409, 40900, 'order cannot be cancelled')
  }

  const transaction = db.transaction(() => {
    const timestamp = now()
    const items = listOrderItemsByOrderId(db, orderId)

    updateOrderStatus(db, {
      id: orderId,
      user_id: userId,
      status: 'cancelled',
      status_label: getStatusLabel('cancelled'),
      updated_at: timestamp
    })

    for (const item of items) {
      const product = findAnyProductById(db, item.product_id)
      if (!product) {
        continue
      }

      updateInventory(db, product, item.quantity, timestamp)
    }
  })

  transaction()

  return getUserOrderDetail(db, userId, orderId)
}
