import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import { scoreVisualSearchProducts } from '@/api/public'
import { buildProductImageSimilarities, recognizeImageElement } from '@/lib/imageRecognition'
import { useCatalogStore } from '@/stores/catalog'
import SearchView from '@/views/SearchView.vue'

vi.mock('@/api/public', () => ({
  getCategories: vi.fn(),
  getProductDetail: vi.fn(),
  getProducts: vi.fn(),
  getServiceDetail: vi.fn(),
  getServices: vi.fn(),
  getStoreSlots: vi.fn(),
  getStores: vi.fn(),
  scoreVisualSearchProducts: vi.fn().mockResolvedValue({
    aiSimilarities: {
      'p-001': 96,
      'p-004': 35
    },
    labels: ['主粮包装'],
    model: 'deepseek-test-model'
  })
}))

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

const defaultCatalogProducts = [
  {
    id: 'p-001',
    category: 'food',
    title: '鲜肉全价猫粮',
    subtitle: '低敏冷鲜配方',
    petType: 'cat',
    stockStatus: 'inStock',
    memberPrice: 248,
    originalPrice: 298,
    cover: '/images/products/cat-food.svg',
    rating: 4.9,
    sold: 12800
  },
  {
    id: 'p-004',
    category: 'toy',
    title: '羽毛逗猫棒套装',
    subtitle: '互动消耗',
    petType: 'cat',
    stockStatus: 'inStock',
    memberPrice: 42,
    cover: '/images/products/cat-wand.svg',
    rating: 4.6,
    sold: 3200
  }
]

async function mountSearchView({ catalogProducts = defaultCatalogProducts } = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const catalogStore = useCatalogStore()

  catalogStore.fetchVisualSearchProducts = vi.fn().mockResolvedValue(catalogProducts)
  catalogStore.$patch({
    visualSearchProducts: catalogProducts
  })

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
      plugins: [router, pinia]
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
    vi.mocked(scoreVisualSearchProducts).mockClear()
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
    expect(scoreVisualSearchProducts).toHaveBeenCalledWith({
      recognition: expect.objectContaining({
        labels: ['tabby cat', 'packet package'],
        keywords: ['tabby', 'cat', 'packet', 'package']
      }),
      products: expect.arrayContaining([
        expect.objectContaining({
          id: 'p-001',
          title: '鲜肉全价猫粮',
          subtitle: '低敏冷鲜配方',
          tags: expect.any(Array)
        })
      ])
    })
    expect(wrapper.text()).toContain('找到')
    expect(wrapper.text()).toContain('主粮包装')
    expect(wrapper.text()).not.toContain('tabby cat')

    wrapper.unmount()
  })

  it('uses live catalog products when rendering visual search results', async () => {
    const wrapper = await mountSearchView({
      catalogProducts: [
        {
          id: 'p-001',
          category: 'food',
          title: '鲜肉全价猫粮',
          subtitle: '后台更新后的商品',
          petType: 'cat',
          stockStatus: 'inStock',
          memberPrice: 248,
          originalPrice: 298,
          cover: '/uploads/2026/04/product-updated.png',
          rating: 4.9,
          sold: 12800
        }
      ]
    })

    await wrapper.findAll('button').find((button) => button.text() === '使用示例图').trigger('click')
    await wrapper.vm.$nextTick()
    await wrapper.findAll('button').find((button) => button.text() === '确认识别').trigger('click')
    await new Promise((resolve) => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()

    expect(buildProductImageSimilarities).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'p-001',
          cover: '/uploads/2026/04/product-updated.png'
        })
      ]),
      [1, 0, 0]
    )
    expect(wrapper.find('.search__card-media img').attributes('src')).toBe('/uploads/2026/04/product-updated.png')

    wrapper.unmount()
  })
})
