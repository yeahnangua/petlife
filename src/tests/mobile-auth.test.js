import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '@/api/http'
import App from '@/App.vue'
import { createMobileRouter } from '@/router'
import { MOBILE_TOKEN_STORAGE, useAuthStore } from '@/stores/auth'
import LoginView from '@/views/LoginView.vue'

function createJsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'Content-Type': 'application/json' },
    ...init
  })
}

function createOkEnvelope(data) {
  return {
    code: 0,
    message: 'ok',
    data
  }
}

describe('mobile auth', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    window.localStorage.clear()
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    window.scrollTo = vi.fn()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('redirects unauthenticated visitors to login before showing app content', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createMobileRouter(pinia, [
      { path: '/login', component: LoginView, meta: { public: true, hideShell: true, title: '登录' } },
      { path: '/', component: { template: '<section>home</section>' }, meta: { title: '首页' } },
      { path: '/cart', component: { template: '<section>cart</section>' }, meta: { title: '购物车' } }
    ])

    router.push('/')
    await router.isReady()

    expect(router.currentRoute.value.fullPath).toBe('/login?redirect=/')
  })

  it('logs in with the WeChat SSO button, persists the token, and returns to the redirect target', async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse(createOkEnvelope({
      token: 'demo-session-token',
      user: {
        id: 'u_demo_001',
        nickname: '拾柒',
        avatar_url: 'https://example.com/avatar.jpg'
      }
    })))

    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createMobileRouter(pinia, [
      { path: '/login', component: LoginView, meta: { public: true, hideShell: true, title: '登录' } },
      { path: '/cart', component: { template: '<section>cart</section>' }, meta: { title: '购物车' } }
    ])
    router.push('/login?redirect=/cart')
    await router.isReady()
    const replaceSpy = vi.spyOn(router, 'replace')

    const wrapper = mount(App, {
      global: {
        plugins: [pinia, router]
      }
    })

    await wrapper.get('[data-test="wechat-login"]').trigger('click')
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 0))
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 10))
    await flushPromises()
    expect(window.localStorage.getItem(MOBILE_TOKEN_STORAGE)).toBe('demo-session-token')
    expect(replaceSpy).toHaveBeenCalledWith('/cart')
  })

  it('adds Authorization to user requests when a token exists', async () => {
    window.localStorage.setItem(MOBILE_TOKEN_STORAGE, 'persisted-token')
    fetchMock.mockResolvedValueOnce(createJsonResponse(createOkEnvelope({ profile: { id: 'u_demo_001' } })))

    await request('/api/user/profile')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/user/profile',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer persisted-token'
        })
      })
    )
  })

  it('clears mobile auth state when a user request returns 401', async () => {
    window.localStorage.setItem(MOBILE_TOKEN_STORAGE, 'expired-token')
    const pinia = createPinia()
    setActivePinia(pinia)
    createMobileRouter(pinia)
    const authStore = useAuthStore()
    authStore.loadFromStorage()

    fetchMock.mockResolvedValueOnce(createJsonResponse({
      code: 40100,
      message: 'unauthorized',
      data: null
    }, { status: 401 }))

    await expect(request('/api/user/profile')).rejects.toThrow('unauthorized')
    expect(window.localStorage.getItem(MOBILE_TOKEN_STORAGE)).toBeNull()
    expect(authStore.isAuthenticated).toBe(false)
  })
})
