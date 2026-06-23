import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCatalogStore } from '@/stores/catalog'
import CategoryView from '@/views/CategoryView.vue'

const categories = [
  { id: 'cat-food', slug: 'food', label: '主粮', name: '主粮', petType: 'cat' },
  { id: 'cat-snack', slug: 'snack', label: '零食', name: '零食', petType: 'cat' },
  { id: 'cat-litter', slug: 'litter', label: '猫砂', name: '猫砂', petType: 'cat' },
  { id: 'cat-toy', slug: 'toy', label: '玩具', name: '玩具', petType: 'cat' },
  { id: 'cat-clean', slug: 'clean', label: '清洁护理', name: '清洁护理', petType: 'cat' },
  { id: 'all-travel', slug: 'travel', label: '出行', name: '出行', petType: 'all' }
]

const products = [
  {
    id: 'p-001',
    title: '鲜肉全价猫粮',
    subtitle: '低敏冷鲜配方',
    cover: '/images/products/cat-food.svg',
    categoryId: 'cat-food',
    petType: 'cat',
    memberPrice: 248,
    originalPrice: 298,
    rating: 4.9,
    sold: 12800
  }
]

async function mountCategoryView({ loadingProducts = false, productList = products } = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)

  const store = useCatalogStore()
  store.$patch({
    categories,
    productList,
    loading: {
      ...store.loading,
      products: loadingProducts
    },
    error: {
      ...store.error,
      products: ''
    }
  })
  store.fetchProductList = vi.fn()

  const router = createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/category', name: 'category', component: CategoryView },
      { path: '/products', name: 'product-list', component: { template: '<div />' } }
    ]
  })

  router.push('/category?pet=cat&category=cat-food')
  await router.isReady()

  const wrapper = mount(CategoryView, {
    attachTo: document.body,
    global: {
      plugins: [router, pinia],
      stubs: {
        ProductCard: {
          props: ['product'],
          template: '<article class="product-card">{{ product.title }}</article>'
        },
        SkeletonBlock: {
          template: '<div class="skeleton-block" />'
        }
      }
    }
  })

  await wrapper.vm.$nextTick()
  return { wrapper, store }
}

describe('CategoryView', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('keeps product cards visible while a category refresh is loading', async () => {
    const { wrapper } = await mountCategoryView({ loadingProducts: true })

    expect(wrapper.find('.product-card').exists()).toBe(true)
    expect(wrapper.text()).toContain('鲜肉全价猫粮')
    expect(wrapper.find('.skeleton-block').exists()).toBe(false)
    expect(wrapper.find('.category__refreshing').exists()).toBe(true)

    wrapper.unmount()
  })

  it('renders the secondary category chips as a draggable horizontal scroller', async () => {
    const { wrapper } = await mountCategoryView()
    const scroller = wrapper.find('.category__chips')
    const element = scroller.element

    expect(scroller.attributes('data-draggable-scroll')).toBe('true')
    expect(scroller.attributes('aria-label')).toBe('商品二级分类')

    element.scrollLeft = 20
    await scroller.trigger('pointerdown', { clientX: 100, pointerId: 1 })
    expect(scroller.classes()).toContain('category__chips--dragging')

    await scroller.trigger('pointermove', { clientX: 60, pointerId: 1 })
    expect(element.scrollLeft).toBe(60)

    await scroller.trigger('pointerup', { pointerId: 1 })
    expect(scroller.classes()).not.toContain('category__chips--dragging')

    wrapper.unmount()
  })
})
