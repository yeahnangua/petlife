import { getAdminKey, handleUnauthorized } from '@/api/auth'

function buildHeaders(body, headers = {}) {
  const nextHeaders = new Headers(headers)
  const adminKey = getAdminKey()

  if (adminKey) {
    nextHeaders.set('x-admin-key', adminKey)
  }

  if (!(body instanceof FormData) && !nextHeaders.has('Content-Type')) {
    nextHeaders.set('Content-Type', 'application/json')
  }

  if (!nextHeaders.has('Accept')) {
    nextHeaders.set('Accept', 'application/json')
  }

  return nextHeaders
}

export async function request(path, options = {}) {
  const { body, headers, ...rest } = options
  const response = await fetch(path, {
    ...rest,
    headers: buildHeaders(body, headers),
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined
  })
  const payload = await response.json()

  if (response.status === 401) {
    handleUnauthorized()
    throw new Error(payload.message || 'unauthorized')
  }

  if (!response.ok || payload.code !== 0) {
    throw new Error(payload.message || '请求失败')
  }

  return payload.data ?? {}
}
