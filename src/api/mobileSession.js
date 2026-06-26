export const MOBILE_TOKEN_STORAGE = 'petlife.mobile.token'

let unauthorizedHandler = null

export function getMobileToken() {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.localStorage.getItem(MOBILE_TOKEN_STORAGE) ?? ''
}

export function setMobileToken(token) {
  if (typeof window === 'undefined') {
    return
  }

  if (!token) {
    clearMobileToken()
    return
  }

  window.localStorage.setItem(MOBILE_TOKEN_STORAGE, token)
}

export function clearMobileToken() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(MOBILE_TOKEN_STORAGE)
}

export function registerUnauthorizedHandler(handler) {
  unauthorizedHandler = handler
}

export function handleUnauthorized() {
  clearMobileToken()

  if (typeof unauthorizedHandler === 'function') {
    unauthorizedHandler()
  }
}
