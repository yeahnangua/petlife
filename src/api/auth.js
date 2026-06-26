import { request } from './http'

export function loginWithWechat() {
  return request('/api/auth/wechat-login', {
    method: 'POST'
  })
}

export function getWechatOAuthStartUrl(redirect = '/') {
  const params = new URLSearchParams()

  if (redirect) {
    params.set('redirect', redirect)
  }

  return `/api/auth/wechat-oauth/start?${params.toString()}`
}

export function getSession() {
  return request('/api/auth/session')
}

export function logoutSession() {
  return request('/api/auth/logout', {
    method: 'POST'
  })
}
