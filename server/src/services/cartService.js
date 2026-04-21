import { randomUUID } from 'node:crypto'
import { AppError } from '../utils/appError.js'
import { requireString } from '../utils/validators.js'
import {
  createCartItem,
  deleteCartItem,
  deleteCartItemsByIds,
  findCartItemById,
  findCartItemByProductAndSpec,
  listCartItemsByUserId,
  updateCartItem
} from '../repositories/cartRepository.js'
import { findAnyProductById } from '../repositories/productRepository.js'

function now() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

function parseQuantity(value, fieldName = 'quantity') {
  const quantity = Number.parseInt(value, 10)
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new AppError(400, 40000, `${fieldName} must be a positive integer`)
  }

  return quantity
}

function toBoolean(value) {
  return value === true || value === 1 || value === '1'
}

function mapProduct(row) {
  if (!row) {
    return null
  }

  return {
    id: row.id,
    category_id: row.category_id,
    category_slug: row.category_slug,
    title: row.title,
    subtitle: row.subtitle,
    pet_type: row.pet_type,
    price: row.price,
    member_price: row.member_price,
    original_price: row.original_price,
    stock: row.stock,
    stock_status: row.stock_status,
    badge: row.badge || null,
    cover_url: row.cover_url,
    status: row.status
  }
}

function getValidity(product) {
  if (!product || product.status !== 'active') {
    return { isValid: false, invalidReason: '商品已下架' }
  }

  if (product.stock_status === 'soldOut' || product.stock <= 0) {
    return { isValid: false, invalidReason: '商品已售罄' }
  }

  return { isValid: true, invalidReason: '' }
}

function hydrateCartItem(db, row) {
  const product = findAnyProductById(db, row.product_id)
  const validity = getValidity(product)

  return {
    id: row.id,
    productId: row.product_id,
    specKey: row.spec_key,
    specLabel: row.spec_label,
    quantity: row.quantity,
    selected: Boolean(row.selected),
    isValid: validity.isValid,
    invalidReason: validity.invalidReason,
    product: mapProduct(product)
  }
}

function summarizeCart(list) {
  const validSelectedItems = list.filter((item) => item.isValid && item.selected)

  return {
    selectedCount: validSelectedItems.reduce((sum, item) => sum + item.quantity, 0),
    invalidCount: list.filter((item) => !item.isValid).length,
    totalAmount: validSelectedItems.reduce((sum, item) => {
      const unitPrice = item.product?.member_price ?? item.product?.price ?? 0
      return sum + item.quantity * unitPrice
    }, 0)
  }
}

function ensureAddableProduct(product) {
  if (!product || product.status !== 'active') {
    throw new AppError(404, 40400, 'product not found')
  }

  if (product.stock_status === 'soldOut' || product.stock <= 0) {
    throw new AppError(409, 40900, 'product is sold out')
  }
}

export function getCart(db, userId) {
  const list = listCartItemsByUserId(db, userId).map((row) => hydrateCartItem(db, row))

  return {
    list,
    summary: summarizeCart(list)
  }
}

export function addCartItemForUser(db, userId, payload) {
  const productId = requireString(payload.product_id, 'product_id')
  const specKey = requireString(payload.spec_key, 'spec_key')
  const specLabel = requireString(payload.spec_label, 'spec_label')
  const quantity = parseQuantity(payload.quantity)
  const product = findAnyProductById(db, productId)

  ensureAddableProduct(product)

  const transaction = db.transaction(() => {
    const existingItem = findCartItemByProductAndSpec(db, userId, productId, specKey)
    const timestamp = now()

    if (existingItem) {
      updateCartItem(db, {
        id: existingItem.id,
        user_id: userId,
        quantity: existingItem.quantity + quantity,
        selected: 1,
        updated_at: timestamp
      })

      return findCartItemById(db, userId, existingItem.id)
    }

    const record = {
      id: `ci_${randomUUID().slice(0, 8)}`,
      user_id: userId,
      product_id: productId,
      spec_key: specKey,
      spec_label: specLabel,
      quantity,
      selected: 1,
      created_at: timestamp,
      updated_at: timestamp
    }

    createCartItem(db, record)
    return record
  })

  return hydrateCartItem(db, transaction())
}

export function updateCartItemForUser(db, userId, itemId, payload) {
  const currentItem = findCartItemById(db, userId, itemId)
  if (!currentItem) {
    throw new AppError(404, 40400, 'cart item not found')
  }

  const quantity =
    payload.quantity == null ? currentItem.quantity : parseQuantity(payload.quantity)
  const selected = payload.selected == null ? Boolean(currentItem.selected) : toBoolean(payload.selected)

  updateCartItem(db, {
    id: itemId,
    user_id: userId,
    quantity,
    selected: selected ? 1 : 0,
    updated_at: now()
  })

  return hydrateCartItem(db, findCartItemById(db, userId, itemId))
}

export function deleteCartItemForUser(db, userId, itemId) {
  const currentItem = findCartItemById(db, userId, itemId)
  if (!currentItem) {
    throw new AppError(404, 40400, 'cart item not found')
  }

  deleteCartItem(db, userId, itemId)
  return { id: itemId }
}

export function clearInvalidCartItemsForUser(db, userId) {
  const cart = getCart(db, userId)
  const invalidItemIds = cart.list.filter((item) => !item.isValid).map((item) => item.id)

  deleteCartItemsByIds(db, userId, invalidItemIds)

  return {
    removedCount: invalidItemIds.length
  }
}
