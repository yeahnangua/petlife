import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '@/api/http'
import App from '@/App.vue'
import { createMobileRouter } from '@/router'
import { MOBILE_TOKEN_STORAGE, useAuthStore } from '@/stores/auth'
import LoginView from '@/views/LoginView.vue'
import ProfileView from '@/views/ProfileView.vue'

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
    vi.unstubAllEnvs()
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
    vi.stubEnv('VITE_WECHAT_OAUTH_ENABLED', 'false')

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

    const qrCode = wrapper.get('[data-test="wechat-official-account-qr"]')
    expect(qrCode.attributes('src')).toBe('/images/wechat-test-official-account.png')
    expect(qrCode.attributes('alt')).toBe('测试公众号二维码')
    expect(wrapper.text()).toContain('关注测试公众号后使用微信一键登录')

    await wrapper.get('[data-test="wechat-login"]').trigger('click')
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 0))
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 10))
    await flushPromises()
    expect(window.localStorage.getItem(MOBILE_TOKEN_STORAGE)).toBe('demo-session-token')
    expect(replaceSpy).toHaveBeenCalledWith('/cart')
  })

  it('logs in to the demo account with the test WeChat button', async () => {
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

    const demoButton = wrapper.get('[data-test="wechat-demo-login"]')
    expect(demoButton.text()).toContain('微信登录（测试）')

    await demoButton.trigger('click')
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 0))
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/wechat-login',
      expect.objectContaining({ method: 'POST' })
    )
    expect(window.localStorage.getItem(MOBILE_TOKEN_STORAGE)).toBe('demo-session-token')
    expect(replaceSpy).toHaveBeenCalledWith('/cart')
  })

  it('consumes the official account OAuth token from the login callback URL', async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse(createOkEnvelope({
      user: {
        id: 'u_wx_001',
        nickname: '微信测试用户',
        avatar_url: 'https://example.com/wechat.jpg'
      }
    })))

    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createMobileRouter(pinia, [
      { path: '/login', component: LoginView, meta: { public: true, hideShell: true, title: '登录' } },
      { path: '/cart', component: { template: '<section>cart</section>' }, meta: { title: '购物车' } }
    ])
    router.push('/login?wechat_token=real-wechat-session-token&redirect=/cart')
    await router.isReady()
    const replaceSpy = vi.spyOn(router, 'replace')

    mount(App, {
      global: {
        plugins: [pinia, router]
      }
    })

    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 0))
    await flushPromises()

    expect(window.localStorage.getItem(MOBILE_TOKEN_STORAGE)).toBe('real-wechat-session-token')
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/session',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer real-wechat-session-token'
        })
      })
    )
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

  it('logs out from the profile page and returns to login', async () => {
    fetchMock
      .mockResolvedValueOnce(createJsonResponse(createOkEnvelope({
        profile: {
          id: 'u_demo_001',
          nickname: '拾柒',
          avatar_url: 'https://example.com/avatar.jpg',
          phone: '13800000000',
          member_level: '微信会员',
          join_date: '2026-06',
          points: 120,
          coupon_count: 1,
          stats: {
            order_count: 2,
            service_count: 1,
            saved_amount: 35
          }
        }
      })))
      .mockResolvedValueOnce(createJsonResponse(createOkEnvelope({ list: [] })))
      .mockResolvedValueOnce(createJsonResponse(createOkEnvelope({ ok: true })))

    const pinia = createPinia()
    setActivePinia(pinia)
    const authStore = useAuthStore()
    authStore.setSession({
      token: 'demo-session-token',
      user: { id: 'u_demo_001', nickname: '拾柒' }
    })
    const router = createMobileRouter(pinia, [
      { path: '/login', component: LoginView, meta: { public: true, hideShell: true, title: '登录' } },
      { path: '/', component: { template: '<section>home</section>' }, meta: { tab: 'home', title: '首页' } },
      { path: '/category', component: { template: '<section>category</section>' }, meta: { tab: 'category', title: '分类' } },
      { path: '/service', component: { template: '<section>service</section>' }, meta: { tab: 'service', title: '服务' } },
      { path: '/orders', component: { template: '<section>orders</section>' }, meta: { tab: 'orders', title: '订单' } },
      { path: '/profile', component: ProfileView, meta: { tab: 'profile', title: '我的' } }
    ])
    router.push('/profile')
    await router.isReady()
    const replaceSpy = vi.spyOn(router, 'replace')

    const wrapper = mount(App, {
      global: {
        plugins: [pinia, router]
      }
    })
    await flushPromises()

    await wrapper.get('[data-test="profile-logout"]').trigger('click')
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/logout',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer demo-session-token'
        })
      })
    )
    expect(window.localStorage.getItem(MOBILE_TOKEN_STORAGE)).toBeNull()
    expect(authStore.isAuthenticated).toBe(false)
    expect(replaceSpy).toHaveBeenCalledWith('/login')
  })
})
