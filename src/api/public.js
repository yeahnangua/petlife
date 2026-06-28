import { request, withQuery } from './http'

export function getCategories() {
  return request('/api/public/categories')
}

export function getProducts(params = {}) {
  return request(withQuery('/api/public/products', params))
}

export function getProductDetail(id) {
  return request(`/api/public/products/${id}`)
}

export function getServices(params = {}) {
  return request(withQuery('/api/public/services', params))
}

export function getServiceDetail(id) {
  return request(`/api/public/services/${id}`)
}

export function getStores() {
  return request('/api/public/stores')
}

export function getStoreSlots(storeId, params = {}) {
  return request(withQuery(`/api/public/stores/${storeId}/slots`, params))
}

export function sendAiConsultMessage(payload) {
  return request('/api/public/ai-consult', {
    method: 'POST',
    body: payload
  })
}

export function scoreVisualSearchProducts(payload) {
  return request('/api/public/visual-search/similarity', {
    method: 'POST',
    body: payload
  })
}
