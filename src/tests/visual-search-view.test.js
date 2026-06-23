import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import { describe, expect, it } from 'vitest'
import SearchView from '@/views/SearchView.vue'

async function mountSearchView() {
  const router = createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/search', name: 'search', component: SearchView },
      { path: '/products', name: 'product-list', component: { template: '<div />' } },
      { path: '/product/:id', name: 'product-detail', component: { template: '<div />' } }
    ]
  })

  router.push('/search')
  await router.isReady()

  return mount(SearchView, {
    attachTo: document.body,
    global: {
      plugins: [router, createPinia()]
    }
  })
}

describe('SearchView visual search flow', () => {
  it('renders the visual search entry and action sheet choices', async () => {
    const wrapper = await mountSearchView()

    expect(wrapper.text()).toContain('拍照搜商品')
    expect(wrapper.find('[aria-label="打开拍照搜商品"]').exists()).toBe(true)

    await wrapper.find('[aria-label="打开拍照搜商品"]').trigger('click')

    expect(document.body.textContent).toContain('拍照搜索')
    expect(document.body.textContent).toContain('从相册选择')
    expect(document.body.textContent).toContain('查看图搜历史')

    wrapper.unmount()
  })
})
