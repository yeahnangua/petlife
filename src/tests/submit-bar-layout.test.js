import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createWebHashHistory } from 'vue-router'
import OrderConfirmView from '@/views/OrderConfirmView.vue'

const userApi = vi.hoisted(() => ({
  getCart: vi.fn(),
  getAddresses: vi.fn(),
  createOrder: vi.fn(),
  getPets: vi.fn()
}))

const publicApi = vi.hoisted(() => ({
  getStoreSlots: vi.fn()
}))

vi.mock('@/api/user', async () => {
  const actual = await vi.importActual('@/api/user')

  return {
    ...actual,
    ...userApi
  }
})

vi.mock('@/api/public', async () => {
  const actual = await vi.importActual('@/api/public')

  return {
    ...actual,
    ...publicApi
  }
})

function makeCartResponse() {
  return {
    list: [
      {
        id: 'ci_001',
        productId: 'p-001',
        specKey: '3kg|鸡肉',
        specLabel: '3kg · 鸡肉',
        quantity: 1,
        selected: true,
        isValid: true,
        invalidReason: '',
        product: {
          id: 'p-001',
          category_id: 'cat-food',
          category_slug: 'food',
          title: '鲜肉全价猫粮',
          subtitle: '低敏冷鲜配方 · 成猫通用',
          pet_type: 'cat',
          price: 268,
          member_price: 248,
          original_price: 298,
          stock_status: 'inStock',
          badge: '热卖',
          tags: ['低敏'],
          specs: [{ group: '规格', options: ['3kg'] }],
          summary: ['鲜肉含量 70%'],
          suitable_text: '适合 1-8 岁成猫 / 全品种',
          cover_url: 'https://example.com/product.jpg',
          rating: 4.9,
          review_count: 1283,
          sold_count: 12800
        }
      }
    ],
    summary: {
      selectedCount: 1,
      invalidCount: 0,
      totalAmount: 248
    }
  }
}

function makePetResponse() {
  return {
    list: [
      {
        id: 'pet_001',
        name: '橘子',
        type: 'cat',
        breed: '中华田园猫 · 橘猫',
        gender: 'male',
        birthday: '2023-06-12',
        weight: 5.2,
        neutered: true,
        allergies: ['牛肉'],
        preferences: ['洗护清洁'],
        avatar_url: 'https://example.com/pet.jpg',
        color: '#D97757'
      }
    ]
  }
}

function createTestRouter(component) {
  const router = createRouter({
    history: createWebHashHistory(),
    routes: [{ path: '/', component }]
  })

  router.push('/')
  return router
}

describe('bottom submit bar layout', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    Object.values(userApi).forEach((mock) => mock.mockReset())
    Object.values(publicApi).forEach((mock) => mock.mockReset())
    userApi.getCart.mockResolvedValue(makeCartResponse())
    userApi.getAddresses.mockResolvedValue({ list: [] })
    userApi.createOrder.mockResolvedValue({ order: { id: 'order_001' } })
    userApi.getPets.mockResolvedValue(makePetResponse())
    publicApi.getStoreSlots.mockResolvedValue({ list: [] })
  })

  it('anchors shared submit bars to the shell bottom offset variable', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/base.css'), 'utf8')

    expect(css).toContain('.page-with-submit-bar')
    expect(css).toContain('.page-submit-bar')
    expect(css).toContain('padding-bottom: calc(var(--shell-bottom-offset) + var(--action-bar-height) + var(--space-8));')
    expect(css).toContain('position: sticky;')
    expect(css).toContain('bottom: calc(var(--shell-bottom-offset) + var(--space-4));')
  })

  it('anchors detail action bars to the shell bottom offset variable', () => {
    const productDetail = readFileSync(resolve(process.cwd(), 'src/views/ProductDetailView.vue'), 'utf8')
    const serviceDetail = readFileSync(resolve(process.cwd(), 'src/views/ServiceDetailView.vue'), 'utf8')

    expect(productDetail).toContain('padding-bottom: calc(var(--shell-bottom-offset) + var(--action-bar-height) + var(--space-8));')
    expect(productDetail).toContain('bottom: calc(var(--shell-bottom-offset) + var(--space-4));')
    expect(serviceDetail).toContain('padding-bottom: calc(var(--shell-bottom-offset) + var(--action-bar-height) + var(--space-8));')
    expect(serviceDetail).toContain('bottom: calc(var(--shell-bottom-offset) + var(--space-4));')
  })

  it('uses the shared sticky bar on the order confirmation page', async () => {
    const router = createTestRouter(OrderConfirmView)
    await router.isReady()

    const wrapper = mount(OrderConfirmView, {
      global: {
        plugins: [router]
      }
    })

    await flushPromises()

    expect(wrapper.classes()).toContain('page-with-submit-bar')
    expect(wrapper.find('.page-submit-bar .sticky-bar').exists()).toBe(true)
    expect(wrapper.find('.sticky-bar .button-primary').exists()).toBe(true)
  })
})
