import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import { useCartStore } from '@/stores/cart'
import { useCatalogStore } from '@/stores/catalog'
import { useProfileStore } from '@/stores/profile'
import HomeView from '@/views/HomeView.vue'

async function mountHomeView() {
  const pinia = createPinia()
  setActivePinia(pinia)

  const catalogStore = useCatalogStore()
  catalogStore.fetchHomeData = vi.fn()
  catalogStore.$patch({
    homeProducts: [
      {
        id: 'p-001',
        title: '鲜肉全价猫粮',
        petType: 'cat',
        stockStatus: 'inStock',
        memberPrice: 248,
        cover: '/images/products/cat-food.svg'
      }
    ],
    homeServices: [
      {
        id: 's-001',
        title: '基础洗护',
        petType: 'all',
        memberPrice: 108,
        originalPrice: 128,
        duration: 60,
        rating: 4.8,
        cover: '/images/services/bath.svg'
      }
    ]
  })

  const profileStore = useProfileStore()
  profileStore.fetchProfile = vi.fn()
  profileStore.$patch({
    profile: {
      level: '普通会员',
      points: 120,
      stats: { orderCount: 1 }
    },
    activePetType: 'cat'
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
      { path: '/', name: 'home', component: HomeView },
      { path: '/products/:id', name: 'product-detail', component: { template: '<div />' } },
      { path: '/service/:id', name: 'service-detail', component: { template: '<div />' } },
      { path: '/products', name: 'product-list', component: { template: '<div />' } },
      { path: '/service', name: 'service', component: { template: '<div />' } },
      { path: '/search', name: 'search', component: { template: '<div />' } },
      { path: '/cart', name: 'cart', component: { template: '<div />' } },
      { path: '/member', name: 'member', component: { template: '<div />' } },
      { path: '/ai-consult', name: 'ai-consult', component: { template: '<div />' } }
    ]
  })

  router.push('/')
  await router.isReady()

  const wrapper = mount(HomeView, {
    global: {
      plugins: [router, pinia],
      stubs: {
        ProductCard: {
          props: ['product'],
          template: '<article>{{ product.title }}</article>'
        },
        ServiceCard: {
          props: ['service'],
          template: '<article>{{ service.title }}</article>'
        },
        SkeletonBlock: true
      }
    }
  })

  return { wrapper, router }
}

describe('HomeView', () => {
  it('does not render the bundle recommendation section', async () => {
    const { wrapper } = await mountHomeView()

    expect(wrapper.text()).not.toContain('组合推荐')
    expect(wrapper.text()).not.toContain('按场景选购')
    expect(wrapper.text()).toContain('热卖商品')
  })

  it('opens the AI pre-sales consultation page from the homepage card', async () => {
    const { wrapper, router } = await mountHomeView()

    const entry = wrapper.get('[data-test="home-ai-consult"]')
    expect(entry.text()).toContain('AI 售前咨询')
    expect(entry.text()).toContain('不知道怎么选')

    await entry.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/ai-consult')
  })
})
