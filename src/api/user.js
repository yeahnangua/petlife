import { request } from './http'

export function getProfile() {
  return request('/api/user/profile')
}

export function updateProfile(payload) {
  return request('/api/user/profile', {
    method: 'PUT',
    body: payload
  })
}

export function getAddresses() {
  return request('/api/user/addresses')
}

export function createAddress(payload) {
  return request('/api/user/addresses', {
    method: 'POST',
    body: payload
  })
}

export function updateAddress(id, payload) {
  return request(`/api/user/addresses/${id}`, {
    method: 'PUT',
    body: payload
  })
}

export function deleteAddress(id) {
  return request(`/api/user/addresses/${id}`, {
    method: 'DELETE'
  })
}

export function getPets() {
  return request('/api/user/pets')
}

export function createPet(payload) {
  return request('/api/user/pets', {
    method: 'POST',
    body: payload
  })
}

export function updatePet(id, payload) {
  return request(`/api/user/pets/${id}`, {
    method: 'PUT',
    body: payload
  })
}

export function deletePet(id) {
  return request(`/api/user/pets/${id}`, {
    method: 'DELETE'
  })
}

export function getCart() {
  return request('/api/user/cart')
}

export function addCartItem(payload) {
  return request('/api/user/cart/items', {
    method: 'POST',
    body: payload
  })
}

export function updateCartItem(id, payload) {
  return request(`/api/user/cart/items/${id}`, {
    method: 'PUT',
    body: payload
  })
}

export function deleteCartItem(id) {
  return request(`/api/user/cart/items/${id}`, {
    method: 'DELETE'
  })
}

export function clearInvalidCartItems() {
  return request('/api/user/cart/invalid-items', {
    method: 'DELETE'
  })
}

export function createOrder(payload) {
  return request('/api/user/orders', {
    method: 'POST',
    body: payload
  })
}

export function getOrders() {
  return request('/api/user/orders')
}

export function getOrderDetail(id) {
  return request(`/api/user/orders/${id}`)
}

export function cancelOrder(id) {
  return request(`/api/user/orders/${id}/cancel`, {
    method: 'POST'
  })
}

export function createBooking(payload) {
  return request('/api/user/bookings', {
    method: 'POST',
    body: payload
  })
}

export function getBookings() {
  return request('/api/user/bookings')
}

export function getBookingDetail(id) {
  return request(`/api/user/bookings/${id}`)
}

export function cancelBooking(id) {
  return request(`/api/user/bookings/${id}/cancel`, {
    method: 'POST'
  })
}
