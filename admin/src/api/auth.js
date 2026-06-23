export const ADMIN_KEY_STORAGE = 'petlife.admin.key'

let unauthorizedHandler = null

export function getAdminKey() {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.localStorage.getItem(ADMIN_KEY_STORAGE) ?? ''
}

export function setAdminKey(value) {
  if (typeof window === 'undefined') {
    return
  }

  if (!value) {
    clearAdminKey()
    return
  }

  window.localStorage.setItem(ADMIN_KEY_STORAGE, value)
}

export function clearAdminKey() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(ADMIN_KEY_STORAGE)
}

export function registerUnauthorizedHandler(handler) {
  unauthorizedHandler = handler
}

export function handleUnauthorized() {
  clearAdminKey()

  if (typeof unauthorizedHandler === 'function') {
    unauthorizedHandler()
  }
}
