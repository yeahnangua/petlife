import { AppError } from '../utils/appError.js'
import { listSlotUsageByStoreAndDate } from '../repositories/bookingRepository.js'
import { listEnabledCategories } from '../repositories/categoryRepository.js'
import {
  countProducts,
  findProductById,
  listProductImages,
  listProducts
} from '../repositories/productRepository.js'
import {
  countServices,
  findActiveServiceById,
  listServiceImages,
  listServices
} from '../repositories/serviceRepository.js'
import { findActiveStoreById, listActiveStores } from '../repositories/storeRepository.js'
import { listEnabledTimeSlots } from '../repositories/timeSlotRepository.js'

function parseJsonArray(value) {
  if (!value) return []
  return JSON.parse(value)
}

function parsePositiveInt(value, fallback, fieldName) {
  if (value == null || value === '') {
    return fallback
  }

  const parsed = Number.parseInt(value, 10)
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new AppError(400, 40000, `${fieldName} must be a positive integer`)
  }

  return parsed
}

function parsePagination(query = {}) {
  const page = parsePositiveInt(query.page, 1, 'page')
  const pageSize = parsePositiveInt(query.pageSize, 10, 'pageSize')

  return {
    page,
    pageSize,
    limit: pageSize,
    offset: (page - 1) * pageSize
  }
}

function formatPagination(page, pageSize, total) {
  return {
    page,
    pageSize,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / pageSize)
  }
}

function mapProduct(row) {
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
    tags: parseJsonArray(row.tags_json),
    specs: parseJsonArray(row.specs_json),
    summary: parseJsonArray(row.summary_json),
    suitable_text: row.suitable_text,
    cover_url: row.cover_url,
    status: row.status,
    rating: row.rating,
    review_count: row.review_count,
    sold_count: row.sold_count
  }
}

function mapService(row) {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    pet_type: row.pet_type,
    price: row.price,
    member_price: row.member_price,
    original_price: row.original_price,
    duration_minutes: row.duration_minutes,
    badge: row.badge || null,
    highlights: parseJsonArray(row.highlights_json),
    summary: parseJsonArray(row.summary_json),
    notice: parseJsonArray(row.notice_json),
    cover_url: row.cover_url,
    status: row.status,
    rating: row.rating,
    review_count: row.review_count
  }
}

export function getCategories(db) {
  return listEnabledCategories(db)
}

export function getProducts(db, query = {}) {
  const pagination = parsePagination(query)
  const filters = {
    categoryId: query.categoryId?.trim(),
    keyword: query.keyword?.trim(),
    petType: query.petType?.trim()
  }

  const total = countProducts(db, filters)
  const list = listProducts(db, filters, pagination).map(mapProduct)

  return {
    list,
    pagination: formatPagination(pagination.page, pagination.pageSize, total)
  }
}

export function getProductDetail(db, productId) {
  const product = findProductById(db, productId)
  if (!product) {
    throw new AppError(404, 40400, 'product not found')
  }

  return {
    ...mapProduct(product),
    product_images: listProductImages(db, productId)
  }
}

export function getServices(db, query = {}) {
  const pagination = parsePagination(query)
  const filters = {
    petType: query.petType?.trim()
  }

  const total = countServices(db, filters)
  const list = listServices(db, filters, pagination).map(mapService)

  return {
    list,
    pagination: formatPagination(pagination.page, pagination.pageSize, total)
  }
}

export function getServiceDetail(db, serviceId) {
  const service = findActiveServiceById(db, serviceId)
  if (!service) {
    throw new AppError(404, 40400, 'service not found')
  }

  return {
    ...mapService(service),
    service_images: listServiceImages(db, serviceId)
  }
}

export function getStores(db) {
  return listActiveStores(db)
}

export function getStoreSlots(db, storeId, query = {}) {
  const bookingDate = query.date?.trim()
  const serviceId = query.serviceId?.trim()

  if (!bookingDate) {
    throw new AppError(400, 40000, 'date is required')
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) {
    throw new AppError(400, 40000, 'date must use YYYY-MM-DD')
  }

  if (!serviceId) {
    throw new AppError(400, 40000, 'serviceId is required')
  }

  const store = findActiveStoreById(db, storeId)
  if (!store) {
    throw new AppError(404, 40400, 'store not found')
  }

  const service = findActiveServiceById(db, serviceId)
  if (!service) {
    throw new AppError(404, 40400, 'service not found')
  }

  const usageBySlotId = new Map(
    listSlotUsageByStoreAndDate(db, storeId, bookingDate).map((row) => [row.time_slot_id, row.used])
  )

  const list = listEnabledTimeSlots(db).map((slot) => {
    const used = usageBySlotId.get(slot.id) ?? 0
    const remaining = Math.max(slot.capacity - used, 0)

    return {
      id: slot.id,
      label: slot.label,
      capacity: slot.capacity,
      used,
      remaining,
      isAvailable: remaining > 0
    }
  })

  return {
    store,
    service,
    list
  }
}
