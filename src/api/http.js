import { getMobileToken, handleUnauthorized } from './mobileSession'

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}

export function withQuery(path, params = {}) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    searchParams.append(key, String(value))
  })

  const query = searchParams.toString()
  return query ? `${path}?${query}` : path
}

export async function request(path, options = {}) {
  const {
    base = '',
    method = 'GET',
    headers = {},
    body,
    ...rest
  } = options

  const init = {
    method,
    headers: {
      Accept: 'application/json',
      ...headers
    },
    ...rest
  }
  const token = getMobileToken()

  if (token && !init.headers.Authorization) {
    init.headers.Authorization = `Bearer ${token}`
  }

  if (body !== undefined) {
    if (body instanceof FormData || typeof body === 'string') {
      init.body = body
    } else if (isPlainObject(body) || Array.isArray(body)) {
      init.body = JSON.stringify(body)
      init.headers['Content-Type'] = init.headers['Content-Type'] || 'application/json'
    } else {
      init.body = body
    }
  }

  const response = await fetch(`${base}${path}`, init)
  const text = await response.text()
  const payload = text ? JSON.parse(text) : null
  const message =
    payload?.message ||
    `request failed with status ${response.status}`

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized()
    }

    const error = new Error(message)
    error.status = response.status
    error.code = payload?.code ?? response.status
    error.data = payload?.data ?? null
    throw error
  }

  if (!payload || payload.code !== 0) {
    const error = new Error(message)
    error.status = response.status
    error.code = payload?.code ?? -1
    error.data = payload?.data ?? null
    throw error
  }

  return payload.data
}
