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

export function listOrders(query = {}) {
  return request(withQuery('/api/admin/orders', query))
}

export function getOrderDetail(id) {
  return request(`/api/admin/orders/${id}`)
}

export function updateOrderStatus(id, status) {
  return request(`/api/admin/orders/${id}/status`, {
    method: 'POST',
    body: { status }
  })
}

export function listBookings(query = {}) {
  return request(withQuery('/api/admin/bookings', query))
}

export function getBookingDetail(id) {
  return request(`/api/admin/bookings/${id}`)
}

export function updateBookingStatus(id, status) {
  return request(`/api/admin/bookings/${id}/status`, {
    method: 'POST',
    body: { status }
  })
}
