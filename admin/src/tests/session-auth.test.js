import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App.vue'
import { createAdminRouter } from '@/router'
import { ADMIN_KEY_STORAGE } from '@/stores/session'

function createApiResponse(data, status = 200, message = 'ok') {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => ({
      code: status >= 200 && status < 300 ? 0 : 40100,
      message,
      data
    })
  }
}

async function mountAdminApp(path = '/', adminKey = '') {
  localStorage.clear()

  if (adminKey) {
    localStorage.setItem(ADMIN_KEY_STORAGE, adminKey)
  }

  const pinia = createPinia()
  setActivePinia(pinia)

  const router = createAdminRouter(pinia)
  router.push(path)
  await router.isReady()

  const wrapper = mount(App, {
    global: {
      plugins: [pinia, router]
    }
  })

  await flushPromises()

  return {
    router,
    wrapper
  }
}

describe('admin session auth', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createApiResponse({ list: [] })))
  })

  it('redirects unauthenticated visitors to the login page', async () => {
    const { router, wrapper } = await mountAdminApp('/')

    expect(router.currentRoute.value.fullPath).toBe('/login')
    expect(wrapper.text()).toContain('管理员登录')
  })

  it('allows entering the admin shell once an admin key exists', async () => {
    const { router, wrapper } = await mountAdminApp('/', 'demo-admin-key')

    expect(router.currentRoute.value.fullPath).toBe('/')
    expect(wrapper.text()).toContain('PetLife')
    expect(wrapper.text()).toContain('Admin')
    expect(wrapper.text()).toContain('后台概览')
  })

  it('clears the admin key and returns to the login page after logout', async () => {
    const { router, wrapper } = await mountAdminApp('/', 'demo-admin-key')

    await wrapper.get('[data-test=\"logout\"]').trigger('click')
    await flushPromises()

    expect(localStorage.getItem(ADMIN_KEY_STORAGE)).toBeNull()
    expect(router.currentRoute.value.fullPath).toBe('/login')
  })

  it('loads the dashboard summary and sends x-admin-key on every admin request', async () => {
    global.fetch
      .mockResolvedValueOnce(createApiResponse({ list: [{ id: 'cat-1' }, { id: 'cat-2' }] }))
      .mockResolvedValueOnce(createApiResponse({ list: [{ id: 'prod-1' }, { id: 'prod-2' }, { id: 'prod-3' }] }))
      .mockResolvedValueOnce(createApiResponse({ list: [{ id: 'svc-1' }, { id: 'svc-2' }] }))
      .mockResolvedValueOnce(createApiResponse({ list: [{ id: 'store-1' }] }))
      .mockResolvedValueOnce(createApiResponse({ list: [{ id: 'order-1' }, { id: 'order-2' }] }))
      .mockResolvedValueOnce(createApiResponse({ list: [{ id: 'booking-1' }] }))

    const { wrapper } = await mountAdminApp('/', 'demo-admin-key')

    expect(wrapper.text()).toContain('概览')
    expect(wrapper.text()).toContain('分类')
    expect(wrapper.text()).toContain('商品')
    expect(wrapper.text()).toContain('服务')
    expect(wrapper.text()).toContain('门店')
    expect(wrapper.text()).toContain('时段')
    expect(wrapper.text()).toContain('订单')
    expect(wrapper.text()).toContain('预约')
    expect(wrapper.get('[data-test="stat-categories"]').text()).toContain('2')
    expect(wrapper.get('[data-test="stat-products"]').text()).toContain('3')
    expect(wrapper.get('[data-test="stat-services"]').text()).toContain('2')
    expect(wrapper.get('[data-test="stat-stores"]').text()).toContain('1')
    expect(wrapper.get('[data-test="stat-orders"]').text()).toContain('2')
    expect(wrapper.get('[data-test="stat-bookings"]').text()).toContain('1')
    expect(global.fetch.mock.calls[0][0]).toBe('/api/admin/categories')
    expect(global.fetch.mock.calls[0][1].headers.get('x-admin-key')).toBe('demo-admin-key')
    expect(global.fetch.mock.calls[4][0]).toBe('/api/admin/orders?status=pendingShipment')
    expect(global.fetch.mock.calls[4][1].headers.get('x-admin-key')).toBe('demo-admin-key')
    expect(global.fetch.mock.calls[5][0]).toBe('/api/admin/bookings?status=pendingService')
    expect(global.fetch.mock.calls[5][1].headers.get('x-admin-key')).toBe('demo-admin-key')
  })

  it('clears session and returns to login when an admin request gets 401', async () => {
    global.fetch.mockResolvedValue(createApiResponse(null, 401, 'unauthorized'))

    const { router } = await mountAdminApp('/', 'demo-admin-key')

    expect(localStorage.getItem(ADMIN_KEY_STORAGE)).toBeNull()
    expect(router.currentRoute.value.fullPath).toBe('/login')
  })
})
