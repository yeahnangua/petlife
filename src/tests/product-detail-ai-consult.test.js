import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import { useCartStore } from '@/stores/cart'
import { useCatalogStore } from '@/stores/catalog'
import ProductDetailView from '@/views/ProductDetailView.vue'

const product = {
  id: 'p-001',
  title: '鲜肉全价猫粮',
  subtitle: '低敏冷鲜配方',
  petType: 'cat',
  stockStatus: 'inStock',
  cover: '/images/products/cat-food.svg',
  images: ['/images/products/cat-food.svg'],
  price: 268,
  memberPrice: 248,
  originalPrice: 298,
  badge: '热卖',
  tags: ['低敏'],
  specs: [{ group: '规格', options: ['1.5kg', '3kg'] }],
  summary: ['鲜肉含量 70%'],
  suitable: '适合 1-8 岁成猫 / 全品种',
  rating: 4.9,
  reviewCount: 1283,
  sold: 12800
}

async function mountProductDetail() {
  const pinia = createPinia()
  setActivePinia(pinia)

  const catalogStore = useCatalogStore()
  catalogStore.fetchProductDetail = vi.fn()
  catalogStore.$patch({
    currentProduct: product,
    relatedProducts: [],
    loading: {
      ...catalogStore.loading,
      productDetail: false
    },
    error: {
      ...catalogStore.error,
      productDetail: ''
    }
  })

  const cartStore = useCartStore()
  cartStore.fetchCart = vi.fn()
  cartStore.$patch({
    hydrated: true,
    items: []
  })

  const router = createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/product/:id', name: 'product-detail', component: ProductDetailView },
      { path: '/ai-consult', name: 'ai-consult', component: { template: '<div />' } },
      { path: '/cart', name: 'cart', component: { template: '<div />' } },
      { path: '/order/confirm', name: 'order-confirm', component: { template: '<div />' } },
      { path: '/products', name: 'product-list', component: { template: '<div />' } }
    ]
  })

  router.push('/product/p-001')
  await router.isReady()

  const wrapper = mount(ProductDetailView, {
    global: {
      plugins: [router, pinia],
      stubs: {
        ProductCard: true,
        BottomSheet: {
          props: ['open', 'title'],
          template: '<div v-if="open"><slot /></div>'
        },
        SkeletonBlock: true
      }
    }
  })

  await wrapper.vm.$nextTick()
  return { wrapper, router }
}

describe('ProductDetailView AI consultation entry', () => {
  it('opens AI consultation with the current product id', async () => {
    const { wrapper, router } = await mountProductDetail()

    const entry = wrapper.get('[data-test="detail-ai-consult"]')
    expect(entry.text()).toContain('AI咨询')

    await entry.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/ai-consult')
    expect(router.currentRoute.value.query.productId).toBe('p-001')
  })
})
