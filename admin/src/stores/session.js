import { defineStore } from 'pinia'

export const ADMIN_KEY_STORAGE = 'petlife.admin.key'

function readAdminKey() {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.localStorage.getItem(ADMIN_KEY_STORAGE) ?? ''
}

function writeAdminKey(value) {
  if (typeof window === 'undefined') {
    return
  }

  if (value) {
    window.localStorage.setItem(ADMIN_KEY_STORAGE, value)
    return
  }

  window.localStorage.removeItem(ADMIN_KEY_STORAGE)
}

export const useSessionStore = defineStore('admin-session', {
  state: () => ({
    adminKey: readAdminKey()
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.adminKey)
  },
  actions: {
    login(value) {
      const adminKey = value.trim()
      this.adminKey = adminKey
      writeAdminKey(adminKey)
      return adminKey
    },
    logout() {
      this.adminKey = ''
      writeAdminKey('')
    }
  }
})
