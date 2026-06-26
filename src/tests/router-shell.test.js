import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import { describe, expect, it } from 'vitest'
import App from '@/App.vue'

function makeRouter(routes) {
  const shellRoutes = ['/', '/category', '/service', '/orders', '/profile']
    .filter((path) => !routes.some((route) => route.path === path))
    .map((path) => ({ path, component: { template: '<section />' } }))

  return createRouter({
    history: createWebHashHistory(),
    routes: [
      ...routes,
      ...shellRoutes
    ]
  })
}

async function mountApp(routes, path) {
  const router = makeRouter(routes)
  router.push(path)
  await router.isReady()
  return mount(App, { global: { plugins: [router, createPinia()] } })
}

describe('app shell', () => {
  it('renders the bottom tab bar on primary tab routes', async () => {
    const wrapper = await mountApp(
      [{ path: '/', component: { template: '<section>home</section>' }, meta: { tab: 'home', title: '首页' } }],
      '/'
    )
    expect(wrapper.find('.tab-bar').exists()).toBe(true)
    expect(wrapper.find('.app').attributes('style')).toContain('--shell-bottom-offset: calc(var(--tabbar-height) + var(--safe-bottom))')
  })

  it('hides the tab bar and shows the top bar on secondary routes', async () => {
    const wrapper = await mountApp(
      [{ path: '/product/demo', component: { template: '<section>detail</section>' }, meta: { title: '商品详情' } }],
      '/product/demo'
    )
    expect(wrapper.find('.tab-bar').exists()).toBe(false)
    expect(wrapper.find('.top-bar').exists()).toBe(true)
    expect(wrapper.find('.top-bar').text()).toContain('商品详情')
    expect(wrapper.find('.app').attributes('style')).toContain('--shell-bottom-offset: var(--safe-bottom)')
  })

  it('shows the AI customer service page as a secondary route', async () => {
    const wrapper = await mountApp(
      [{ path: '/ai-consult', component: { template: '<section>consult</section>' }, meta: { title: 'AI客服' } }],
      '/ai-consult'
    )

    expect(wrapper.find('.tab-bar').exists()).toBe(false)
    expect(wrapper.find('.top-bar').exists()).toBe(true)
    expect(wrapper.find('.top-bar').text()).toContain('AI客服')
    expect(wrapper.find('.app').attributes('style')).toContain('--shell-bottom-offset: var(--safe-bottom)')
  })

  it('keeps the current page component mounted when only route query changes', async () => {
    let mountCount = 0
    const CategoryStub = {
      template: '<section>category</section>',
      mounted() {
        mountCount += 1
      }
    }
    const router = makeRouter([
      { path: '/category', component: CategoryStub, meta: { tab: 'category', title: '分类' } }
    ])

    router.push('/category?pet=cat')
    await router.isReady()
    mount(App, { global: { plugins: [router, createPinia()] } })

    await router.replace('/category?pet=dog')
    await flushPromises()

    expect(mountCount).toBe(1)
  })
})
