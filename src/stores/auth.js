import { defineStore } from 'pinia'
import {
  MOBILE_TOKEN_STORAGE,
  clearMobileToken,
  getMobileToken,
  setMobileToken
} from '@/api/mobileSession'
import {
  getSession,
  loginWithWechat,
  logoutSession
} from '@/api/auth'

export { MOBILE_TOKEN_STORAGE }

export const useAuthStore = defineStore('mobile-auth', {
  state: () => ({
    token: getMobileToken(),
    user: null,
    checked: false,
    loading: false,
    error: ''
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token)
  },
  actions: {
    loadFromStorage() {
      this.token = getMobileToken()
      return this.token
    },
    setSession({ token, user }) {
      this.token = token || ''
      this.user = user ?? null
      this.checked = true
      setMobileToken(this.token)
    },
    clearSession() {
      this.token = ''
      this.user = null
      this.checked = true
      clearMobileToken()
    },
    async ensureSession() {
      this.loadFromStorage()

      if (!this.token) {
        this.checked = true
        return false
      }

      if (this.checked && this.user) {
        return true
      }

      try {
        const data = await getSession()
        this.user = data.user ?? null
        this.checked = true
        return true
      } catch (error) {
        this.clearSession()
        return false
      }
    },
    async loginWithWechat() {
      this.loading = true
      this.error = ''

      try {
        const data = await loginWithWechat()
        this.setSession({
          token: data.token,
          user: data.user
        })
        return data
      } catch (error) {
        this.error = error instanceof Error ? error.message : '登录失败'
        throw error
      } finally {
        this.loading = false
      }
    },
    async consumeWechatOAuthToken(token) {
      this.loading = true
      this.error = ''
      this.token = token || ''
      setMobileToken(this.token)

      try {
        const data = await getSession()
        this.setSession({
          token: this.token,
          user: data.user
        })
        return data
      } catch (error) {
        this.clearSession()
        this.error = error instanceof Error ? error.message : '登录失败'
        throw error
      } finally {
        this.loading = false
      }
    },
    async logout() {
      try {
        if (this.token) {
          await logoutSession()
        }
      } finally {
        this.clearSession()
      }
    }
  }
})
