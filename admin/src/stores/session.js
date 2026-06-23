import { defineStore } from 'pinia'
import { ADMIN_KEY_STORAGE, clearAdminKey, getAdminKey, setAdminKey } from '@/api/auth'

export { ADMIN_KEY_STORAGE }

export const useSessionStore = defineStore('admin-session', {
  state: () => ({
    adminKey: getAdminKey()
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.adminKey)
  },
  actions: {
    login(value) {
      const adminKey = value.trim()
      this.adminKey = adminKey
      setAdminKey(adminKey)
      return adminKey
    },
    logout() {
      this.adminKey = ''
      clearAdminKey()
    }
  }
})
