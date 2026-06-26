import { request } from './http'

export function loginWithWechat() {
  return request('/api/auth/wechat-login', {
    method: 'POST'
  })
}

export function getSession() {
  return request('/api/auth/session')
}

export function logoutSession() {
  return request('/api/auth/logout', {
    method: 'POST'
  })
}
