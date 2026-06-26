import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import AppSidebar from '@/components/AppSidebar.vue'

async function mountSidebar(path) {
  const page = { template: '<div />' }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/',
        component: { template: '<router-view />' },
        children: [
          { path: '', component: page },
          { path: 'categories', component: page },
          { path: 'products', component: page },
          { path: 'services', component: page },
          { path: 'stores', component: page },
          { path: 'time-slots', component: page },
          { path: 'orders', component: page },
          { path: 'bookings', component: page }
        ]
      }
    ]
  })

  router.push(path)
  await router.isReady()

  return mount(AppSidebar, {
    global: {
      plugins: [router]
    }
  })
}

describe('AppSidebar', () => {
  it('only marks the exact current route as active', async () => {
    const wrapper = await mountSidebar('/products')
    const activeLinks = wrapper
      .findAll('.app-sidebar__link.is-active')
      .map((item) => item.text())

    expect(activeLinks).toEqual(['商品'])
  })
})
