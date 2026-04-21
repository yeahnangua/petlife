import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '@/App.vue'
import { createAdminRouter } from '@/router'
import { ADMIN_KEY_STORAGE } from '@/stores/session'

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
  })

  it('redirects unauthenticated visitors to the login page', async () => {
    const { router, wrapper } = await mountAdminApp('/')

    expect(router.currentRoute.value.fullPath).toBe('/login')
    expect(wrapper.text()).toContain('管理员登录')
  })

  it('allows entering the admin shell once an admin key exists', async () => {
    const { router, wrapper } = await mountAdminApp('/', 'demo-admin-key')

    expect(router.currentRoute.value.fullPath).toBe('/')
    expect(wrapper.text()).toContain('PetLife Admin')
    expect(wrapper.text()).toContain('后台概览建设中')
  })

  it('clears the admin key and returns to the login page after logout', async () => {
    const { router, wrapper } = await mountAdminApp('/', 'demo-admin-key')

    await wrapper.get('[data-test=\"logout\"]').trigger('click')
    await flushPromises()

    expect(localStorage.getItem(ADMIN_KEY_STORAGE)).toBeNull()
    expect(router.currentRoute.value.fullPath).toBe('/login')
  })
})
