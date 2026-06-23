import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import { buildProductImageSimilarities, recognizeImageElement } from '@/lib/imageRecognition'
import SearchView from '@/views/SearchView.vue'

vi.mock('@/lib/imageRecognition', () => ({
  buildProductImageSimilarities: vi.fn().mockResolvedValue({
    'p-001': 94,
    'p-004': 30
  }),
  recognizeImageElement: vi.fn().mockResolvedValue({
    source: 'mobilenet',
    labels: ['tabby cat', 'packet package'],
    keywords: ['tabby', 'cat', 'packet', 'package'],
    petType: 'cat',
    categoryHints: ['food'],
    embedding: [1, 0, 0],
    predictions: [
      { label: 'tabby cat', score: 0.82 },
      { label: 'packet package', score: 0.64 }
    ]
  })
}))

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

  it('recognizes the selected image before showing visual search matches', async () => {
    vi.mocked(recognizeImageElement).mockClear()
    vi.mocked(buildProductImageSimilarities).mockClear()
    const wrapper = await mountSearchView()

    await wrapper.findAll('button').find((button) => button.text() === '使用示例图').trigger('click')
    await wrapper.vm.$nextTick()
    await wrapper.findAll('button').find((button) => button.text() === '确认识别').trigger('click')
    await new Promise((resolve) => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()

    expect(recognizeImageElement).toHaveBeenCalledTimes(1)
    expect(buildProductImageSimilarities).toHaveBeenCalledWith(
      expect.any(Array),
      [1, 0, 0]
    )
    expect(wrapper.text()).toContain('找到')
    expect(wrapper.text()).toContain('tabby cat')

    wrapper.unmount()
  })
})
