import { randomUUID } from 'node:crypto'
import { AppError } from '../utils/appError.js'
import {
  createCategory,
  deleteCategory,
  findCategoryById,
  listCategories,
  updateCategory
} from '../repositories/categoryRepository.js'
import {
  countBookingsByServiceId,
  countBookingsByStoreId,
  countBookingsByTimeSlotId
} from '../repositories/bookingRepository.js'
import { countOrderItemsByProductId } from '../repositories/orderRepository.js'
import {
  countActiveProductsByCategoryId,
  countProductsByCategoryId,
  createProduct,
  deleteProduct,
  findAnyProductById,
  listAllProducts,
  listProductImages,
  replaceProductImages,
  updateProduct,
  updateProductStatus
} from '../repositories/productRepository.js'
import {
  createService,
  deleteService,
  findServiceById,
  listAllServices,
  listServiceImages,
  replaceServiceImages,
  updateService,
  updateServiceStatus
} from '../repositories/serviceRepository.js'
import {
  createStore,
  deleteStore,
  findStoreById,
  listStores,
  updateStore,
  updateStoreStatus
} from '../repositories/storeRepository.js'
import {
  createTimeSlot,
  deleteTimeSlot,
  findTimeSlotById,
  listTimeSlots,
  updateTimeSlot,
  updateTimeSlotEnabled
} from '../repositories/timeSlotRepository.js'
import { requireEnum, requireString, requireStringArray } from '../utils/validators.js'

function now() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

function toBoolean(value) {
  return value === true || value === 1 || value === '1'
}

function requireInteger(value, fieldName, { min = 0 } = {}) {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isInteger(parsed) || parsed < min) {
    throw new AppError(400, 40000, `${fieldName} must be an integer >= ${min}`)
  }

  return parsed
}

function requireTime(value, fieldName) {
  const time = requireString(value, fieldName)
  if (!/^\d{2}:\d{2}$/.test(time)) {
    throw new AppError(400, 40000, `${fieldName} must use HH:MM`)
  }

  return time
}

function requireObjectArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw new AppError(400, 40000, `${fieldName} must be an array`)
  }

  return value
}

function requireSpecArray(value, fieldName) {
  return requireObjectArray(value, fieldName).map((item) => {
    if (typeof item !== 'object' || item == null) {
      throw new AppError(400, 40000, `${fieldName} must contain objects`)
    }

    return {
      group: requireString(item.group, `${fieldName}.group`),
      options: requireStringArray(item.options, `${fieldName}.options`)
    }
  })
}

function parseJsonArray(value) {
  if (!value) {
    return []
  }

  return JSON.parse(value)
}

function mapCategory(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    pet_type: row.pet_type,
    sort_order: row.sort_order,
    cover_url: row.cover_url,
    is_enabled: Boolean(row.is_enabled),
    created_at: row.created_at,
    updated_at: row.updated_at
  }
}

function mapProduct(db, row) {
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
    badge: row.badge || '',
    tags: parseJsonArray(row.tags_json),
    specs: parseJsonArray(row.specs_json),
    summary: parseJsonArray(row.summary_json),
    suitable_text: row.suitable_text,
    cover_url: row.cover_url,
    status: row.status,
    rating: row.rating,
    review_count: row.review_count,
    sold_count: row.sold_count,
    image_urls: listProductImages(db, row.id).map((image) => image.image_url),
    created_at: row.created_at,
    updated_at: row.updated_at
  }
}

function mapService(db, row) {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    pet_type: row.pet_type,
    price: row.price,
    member_price: row.member_price,
    original_price: row.original_price,
    duration_minutes: row.duration_minutes,
    badge: row.badge || '',
    highlights: parseJsonArray(row.highlights_json),
    summary: parseJsonArray(row.summary_json),
    notice: parseJsonArray(row.notice_json),
    cover_url: row.cover_url,
    status: row.status,
    rating: row.rating,
    review_count: row.review_count,
    image_urls: listServiceImages(db, row.id).map((image) => image.image_url),
    created_at: row.created_at,
    updated_at: row.updated_at
  }
}

function mapStore(row) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    address: row.address,
    business_hours: row.business_hours,
    cover_url: row.cover_url,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at
  }
}

function mapTimeSlot(row) {
  return {
    id: row.id,
    label: row.label,
    start_time: row.start_time,
    end_time: row.end_time,
    capacity: row.capacity,
    sort_order: row.sort_order,
    is_enabled: Boolean(row.is_enabled),
    created_at: row.created_at,
    updated_at: row.updated_at
  }
}

function validateCategoryPayload(payload) {
  return {
    name: requireString(payload.name, 'name'),
    slug: requireString(payload.slug, 'slug'),
    pet_type: requireEnum(payload.pet_type, ['cat', 'dog', 'all'], 'pet_type'),
    sort_order: requireInteger(payload.sort_order, 'sort_order', { min: 0 }),
    cover_url: requireString(payload.cover_url, 'cover_url'),
    is_enabled: toBoolean(payload.is_enabled)
  }
}

function validateProductPayload(payload) {
  return {
    category_id: requireString(payload.category_id, 'category_id'),
    title: requireString(payload.title, 'title'),
    subtitle: requireString(payload.subtitle, 'subtitle'),
    pet_type: requireEnum(payload.pet_type, ['cat', 'dog', 'all'], 'pet_type'),
    price: requireInteger(payload.price, 'price', { min: 0 }),
    member_price: requireInteger(payload.member_price, 'member_price', { min: 0 }),
    original_price: requireInteger(payload.original_price, 'original_price', { min: 0 }),
    stock: requireInteger(payload.stock, 'stock', { min: 0 }),
    stock_status: requireEnum(payload.stock_status, ['inStock', 'soldOut'], 'stock_status'),
    badge: typeof payload.badge === 'string' ? payload.badge.trim() : '',
    tags: requireStringArray(payload.tags ?? [], 'tags'),
    specs: requireSpecArray(payload.specs ?? [], 'specs'),
    summary: requireStringArray(payload.summary ?? [], 'summary'),
    suitable_text: requireString(payload.suitable_text, 'suitable_text'),
    cover_url: requireString(payload.cover_url, 'cover_url'),
    status: requireEnum(payload.status, ['active', 'inactive'], 'status'),
    image_urls: requireStringArray(payload.image_urls ?? [], 'image_urls')
  }
}

function validateServicePayload(payload) {
  return {
    title: requireString(payload.title, 'title'),
    subtitle: requireString(payload.subtitle, 'subtitle'),
    pet_type: requireEnum(payload.pet_type, ['cat', 'dog', 'all'], 'pet_type'),
    price: requireInteger(payload.price, 'price', { min: 0 }),
    member_price: requireInteger(payload.member_price, 'member_price', { min: 0 }),
    original_price: requireInteger(payload.original_price, 'original_price', { min: 0 }),
    duration_minutes: requireInteger(payload.duration_minutes, 'duration_minutes', { min: 1 }),
    badge: typeof payload.badge === 'string' ? payload.badge.trim() : '',
    highlights: requireStringArray(payload.highlights ?? [], 'highlights'),
    summary: requireStringArray(payload.summary ?? [], 'summary'),
    notice: requireStringArray(payload.notice ?? [], 'notice'),
    cover_url: requireString(payload.cover_url, 'cover_url'),
    status: requireEnum(payload.status, ['active', 'inactive'], 'status'),
    image_urls: requireStringArray(payload.image_urls ?? [], 'image_urls')
  }
}

function validateStorePayload(payload) {
  return {
    name: requireString(payload.name, 'name'),
    phone: requireString(payload.phone, 'phone'),
    address: requireString(payload.address, 'address'),
    business_hours: requireString(payload.business_hours, 'business_hours'),
    cover_url: requireString(payload.cover_url, 'cover_url'),
    status: requireEnum(payload.status, ['active', 'inactive'], 'status')
  }
}

function validateTimeSlotPayload(payload) {
  return {
    label: requireString(payload.label, 'label'),
    start_time: requireTime(payload.start_time, 'start_time'),
    end_time: requireTime(payload.end_time, 'end_time'),
    capacity: requireInteger(payload.capacity, 'capacity', { min: 1 }),
    sort_order: requireInteger(payload.sort_order, 'sort_order', { min: 0 }),
    is_enabled: toBoolean(payload.is_enabled)
  }
}

function ensureCategoryExists(db, categoryId) {
  const category = findCategoryById(db, categoryId)
  if (!category) {
    throw new AppError(404, 40400, 'category not found')
  }

  return category
}

function ensureProductExists(db, productId) {
  const product = findAnyProductById(db, productId)
  if (!product) {
    throw new AppError(404, 40400, 'product not found')
  }

  return product
}

function ensureServiceExists(db, serviceId) {
  const service = findServiceById(db, serviceId)
  if (!service) {
    throw new AppError(404, 40400, 'service not found')
  }

  return service
}

function ensureStoreExists(db, storeId) {
  const store = findStoreById(db, storeId)
  if (!store) {
    throw new AppError(404, 40400, 'store not found')
  }

  return store
}

function ensureTimeSlotExists(db, slotId) {
  const slot = findTimeSlotById(db, slotId)
  if (!slot) {
    throw new AppError(404, 40400, 'time slot not found')
  }

  return slot
}

export function getAdminCategories(db) {
  return listCategories(db).map(mapCategory)
}

export function createAdminCategory(db, payload) {
  const category = validateCategoryPayload(payload)
  const timestamp = now()
  const record = {
    id: `cat_${randomUUID().slice(0, 8)}`,
    ...category,
    is_enabled: category.is_enabled ? 1 : 0,
    created_at: timestamp,
    updated_at: timestamp
  }

  createCategory(db, record)
  return mapCategory(record)
}

export function updateAdminCategory(db, categoryId, payload) {
  const currentCategory = findCategoryById(db, categoryId)
  if (!currentCategory) {
    throw new AppError(404, 40400, 'category not found')
  }

  const category = validateCategoryPayload(payload)
  const record = {
    id: categoryId,
    ...category,
    is_enabled: category.is_enabled ? 1 : 0,
    updated_at: now()
  }

  updateCategory(db, record)
  return mapCategory({
    ...currentCategory,
    ...record
  })
}

export function deleteAdminCategory(db, categoryId) {
  const category = findCategoryById(db, categoryId)
  if (!category) {
    throw new AppError(404, 40400, 'category not found')
  }

  const activeProductCount = countActiveProductsByCategoryId(db, categoryId)
  if (activeProductCount > 0) {
    throw new AppError(409, 40900, 'category has active products')
  }

  if (countProductsByCategoryId(db, categoryId) > 0) {
    throw new AppError(409, 40900, 'category has related products')
  }

  deleteCategory(db, categoryId)
  return { id: categoryId }
}

export function getAdminProducts(db) {
  return listAllProducts(db).map((row) => mapProduct(db, row))
}

export function createAdminProduct(db, payload) {
  const product = validateProductPayload(payload)
  ensureCategoryExists(db, product.category_id)
  const timestamp = now()
  const transaction = db.transaction(() => {
    const record = {
      id: `p_${randomUUID().slice(0, 8)}`,
      ...product,
      tags_json: JSON.stringify(product.tags),
      specs_json: JSON.stringify(product.specs),
      summary_json: JSON.stringify(product.summary),
      rating: 0,
      review_count: 0,
      sold_count: 0,
      created_at: timestamp,
      updated_at: timestamp
    }

    createProduct(db, record)
    replaceProductImages(db, record.id, product.image_urls)
    return record.id
  })

  return mapProduct(db, ensureProductExists(db, transaction()))
}

export function updateAdminProduct(db, productId, payload) {
  ensureProductExists(db, productId)
  const product = validateProductPayload(payload)
  ensureCategoryExists(db, product.category_id)

  const transaction = db.transaction(() => {
    updateProduct(db, {
      id: productId,
      ...product,
      tags_json: JSON.stringify(product.tags),
      specs_json: JSON.stringify(product.specs),
      summary_json: JSON.stringify(product.summary),
      updated_at: now()
    })
    replaceProductImages(db, productId, product.image_urls)
  })

  transaction()

  return mapProduct(db, ensureProductExists(db, productId))
}

export function deleteAdminProduct(db, productId) {
  const product = ensureProductExists(db, productId)

  if (countOrderItemsByProductId(db, productId) > 0) {
    updateProductStatus(db, {
      id: productId,
      status: 'inactive',
      updated_at: now()
    })
    return mapProduct(db, ensureProductExists(db, productId))
  }

  deleteProduct(db, productId)
  return { id: productId }
}

export function getAdminServices(db) {
  return listAllServices(db).map((row) => mapService(db, row))
}

export function createAdminService(db, payload) {
  const service = validateServicePayload(payload)
  const timestamp = now()
  const transaction = db.transaction(() => {
    const record = {
      id: `s_${randomUUID().slice(0, 8)}`,
      ...service,
      highlights_json: JSON.stringify(service.highlights),
      summary_json: JSON.stringify(service.summary),
      notice_json: JSON.stringify(service.notice),
      rating: 0,
      review_count: 0,
      created_at: timestamp,
      updated_at: timestamp
    }

    createService(db, record)
    replaceServiceImages(db, record.id, service.image_urls)
    return record.id
  })

  return mapService(db, ensureServiceExists(db, transaction()))
}

export function updateAdminService(db, serviceId, payload) {
  ensureServiceExists(db, serviceId)
  const service = validateServicePayload(payload)

  const transaction = db.transaction(() => {
    updateService(db, {
      id: serviceId,
      ...service,
      highlights_json: JSON.stringify(service.highlights),
      summary_json: JSON.stringify(service.summary),
      notice_json: JSON.stringify(service.notice),
      updated_at: now()
    })
    replaceServiceImages(db, serviceId, service.image_urls)
  })

  transaction()

  return mapService(db, ensureServiceExists(db, serviceId))
}

export function deleteAdminService(db, serviceId) {
  ensureServiceExists(db, serviceId)

  if (countBookingsByServiceId(db, serviceId) > 0) {
    updateServiceStatus(db, {
      id: serviceId,
      status: 'inactive',
      updated_at: now()
    })
    return mapService(db, ensureServiceExists(db, serviceId))
  }

  deleteService(db, serviceId)
  return { id: serviceId }
}

export function getAdminStores(db) {
  return listStores(db).map(mapStore)
}

export function createAdminStore(db, payload) {
  const store = validateStorePayload(payload)
  const timestamp = now()
  const record = {
    id: `store_${randomUUID().slice(0, 8)}`,
    ...store,
    created_at: timestamp,
    updated_at: timestamp
  }

  createStore(db, record)
  return mapStore(record)
}

export function updateAdminStore(db, storeId, payload) {
  const currentStore = ensureStoreExists(db, storeId)
  const store = validateStorePayload(payload)
  const record = {
    id: storeId,
    ...store,
    updated_at: now()
  }

  updateStore(db, record)
  return mapStore({
    ...currentStore,
    ...record
  })
}

export function deleteAdminStore(db, storeId) {
  ensureStoreExists(db, storeId)

  if (countBookingsByStoreId(db, storeId) > 0) {
    updateStoreStatus(db, {
      id: storeId,
      status: 'inactive',
      updated_at: now()
    })
    return mapStore(ensureStoreExists(db, storeId))
  }

  deleteStore(db, storeId)
  return { id: storeId }
}

export function getAdminTimeSlots(db) {
  return listTimeSlots(db).map(mapTimeSlot)
}

export function createAdminTimeSlot(db, payload) {
  const slot = validateTimeSlotPayload(payload)
  const timestamp = now()
  const record = {
    id: `ts_${randomUUID().slice(0, 8)}`,
    ...slot,
    is_enabled: slot.is_enabled ? 1 : 0,
    created_at: timestamp,
    updated_at: timestamp
  }

  createTimeSlot(db, record)
  return mapTimeSlot(record)
}

export function updateAdminTimeSlot(db, slotId, payload) {
  const currentSlot = ensureTimeSlotExists(db, slotId)
  const slot = validateTimeSlotPayload(payload)
  const record = {
    id: slotId,
    ...slot,
    is_enabled: slot.is_enabled ? 1 : 0,
    updated_at: now()
  }

  updateTimeSlot(db, record)
  return mapTimeSlot({
    ...currentSlot,
    ...record
  })
}

export function deleteAdminTimeSlot(db, slotId) {
  ensureTimeSlotExists(db, slotId)

  if (countBookingsByTimeSlotId(db, slotId) > 0) {
    updateTimeSlotEnabled(db, {
      id: slotId,
      is_enabled: 0,
      updated_at: now()
    })
    return mapTimeSlot(ensureTimeSlotExists(db, slotId))
  }

  deleteTimeSlot(db, slotId)
  return { id: slotId }
}
