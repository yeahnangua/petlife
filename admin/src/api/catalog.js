import { request } from '@/api/http'

function withQuery(path, query = {}) {
  const searchParams = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value))
    }
  })

  const queryString = searchParams.toString()
  return queryString ? `${path}?${queryString}` : path
}

export function listCategories() {
  return request('/api/admin/categories')
}

export function createCategory(payload) {
  return request('/api/admin/categories', {
    method: 'POST',
    body: payload
  })
}

export function updateCategory(id, payload) {
  return request(`/api/admin/categories/${id}`, {
    method: 'PUT',
    body: payload
  })
}

export function deleteCategory(id) {
  return request(`/api/admin/categories/${id}`, {
    method: 'DELETE'
  })
}

export function listProducts(query = {}) {
  return request(withQuery('/api/admin/products', query))
}

export function createProduct(payload) {
  return request('/api/admin/products', {
    method: 'POST',
    body: payload
  })
}

export function updateProduct(id, payload) {
  return request(`/api/admin/products/${id}`, {
    method: 'PUT',
    body: payload
  })
}

export function deleteProduct(id) {
  return request(`/api/admin/products/${id}`, {
    method: 'DELETE'
  })
}

export function generateProductAiDraft(payload) {
  return request('/api/admin/products/ai-draft', {
    method: 'POST',
    body: payload
  })
}

export function generateServiceAiDraft(payload) {
  return request('/api/admin/services/ai-draft', {
    method: 'POST',
    body: payload
  })
}

export function listServices(query = {}) {
  return request(withQuery('/api/admin/services', query))
}

export function createService(payload) {
  return request('/api/admin/services', {
    method: 'POST',
    body: payload
  })
}

export function updateService(id, payload) {
  return request(`/api/admin/services/${id}`, {
    method: 'PUT',
    body: payload
  })
}

export function deleteService(id) {
  return request(`/api/admin/services/${id}`, {
    method: 'DELETE'
  })
}

export function listStores(query = {}) {
  return request(withQuery('/api/admin/stores', query))
}

export function createStore(payload) {
  return request('/api/admin/stores', {
    method: 'POST',
    body: payload
  })
}

export function updateStore(id, payload) {
  return request(`/api/admin/stores/${id}`, {
    method: 'PUT',
    body: payload
  })
}

export function deleteStore(id) {
  return request(`/api/admin/stores/${id}`, {
    method: 'DELETE'
  })
}

export function listTimeSlots(query = {}) {
  return request(withQuery('/api/admin/time-slots', query))
}

export function createTimeSlot(payload) {
  return request('/api/admin/time-slots', {
    method: 'POST',
    body: payload
  })
}

export function updateTimeSlot(id, payload) {
  return request(`/api/admin/time-slots/${id}`, {
    method: 'PUT',
    body: payload
  })
}

export function deleteTimeSlot(id) {
  return request(`/api/admin/time-slots/${id}`, {
    method: 'DELETE'
  })
}
