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

export function listCouponCampaigns() {
  return request('/api/admin/coupon-campaigns')
}

export function createCouponCampaign(payload) {
  return request('/api/admin/coupon-campaigns', {
    method: 'POST',
    body: payload
  })
}

export function updateCouponCampaign(id, payload) {
  return request(`/api/admin/coupon-campaigns/${id}`, {
    method: 'PUT',
    body: payload
  })
}

export function issueCoupon(campaignId, payload) {
  return request(`/api/admin/coupon-campaigns/${campaignId}/issue`, {
    method: 'POST',
    body: payload
  })
}

export function listUserCoupons(query = {}) {
  return request(withQuery('/api/admin/user-coupons', query))
}

export function updateUserCoupon(id, payload) {
  return request(`/api/admin/user-coupons/${id}`, {
    method: 'PUT',
    body: payload
  })
}
