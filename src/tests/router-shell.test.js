import { mount } from '@vue/test-utils'
import { createRouter, createWebHashHistory } from 'vue-router'
import { describe, expect, it } from 'vitest'
import App from '@/App.vue'

describe('app shell', () => {
  it('renders the bottom tab bar on primary tab routes', async () => {
    const router = createRouter({
      history: createWebHashHistory(),
      routes: [
        {
          path: '/',
          component: { template: '<section>home page</section>' },
          meta: { tab: 'home', title: '首页' }
        }
      ]
    })

    router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.find('.tabbar').exists()).toBe(true)
    expect(wrapper.find('.app-shell__phone').attributes('style')).toContain('--shell-bottom-offset: calc(var(--tabbar-height) + var(--safe-bottom));')
  })

  it('hides the bottom tab bar on secondary routes', async () => {
    const router = createRouter({
      history: createWebHashHistory(),
      routes: [
        {
          path: '/product/demo',
          component: { template: '<section>detail page</section>' },
          meta: { title: '商品详情' }
        }
      ]
    })

    router.push('/product/demo')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.find('.tabbar').exists()).toBe(false)
    expect(wrapper.find('.app-shell__phone').attributes('style')).toContain('--shell-bottom-offset: var(--safe-bottom);')
  })
})
