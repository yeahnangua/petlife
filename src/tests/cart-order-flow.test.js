import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createWebHashHistory } from 'vue-router'

const userApi = vi.hoisted(() => ({
  getCart: vi.fn(),
  addCartItem: vi.fn(),
  updateCartItem: vi.fn(),
  deleteCartItem: vi.fn(),
  clearInvalidCartItems: vi.fn(),
  getAddresses: vi.fn(),
  createAddress: vi.fn(),
  updateAddress: vi.fn(),
  deleteAddress: vi.fn(),
  createOrder: vi.fn(),
  getOrderDetail: vi.fn()
}))

vi.mock('@/api/user', () => userApi)

import { useCartStore } from '@/stores/cart'
import CartView from '@/views/CartView.vue'
import OrderConfirmView from '@/views/OrderConfirmView.vue'

function createTestRouter(routes) {
  const router = createRouter({
    history: createWebHashHistory(),
    routes
  })

  return router
}

function makeCartResponse(overrides = {}) {
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
      },
      {
        id: 'ci_002',
        productId: 'p-008',
        specKey: '苔绿色',
        specLabel: '苔绿色',
        quantity: 1,
        selected: false,
        isValid: false,
        invalidReason: '商品已售罄',
        product: {
          id: 'p-008',
          category_id: 'all-travel',
          category_slug: 'travel',
          title: '轻量出行包',
          subtitle: '可折叠便携',
          pet_type: 'all',
          price: 168,
          member_price: 148,
          original_price: 188,
          stock_status: 'soldOut',
          badge: '',
          tags: ['出行'],
          specs: [{ group: '颜色', options: ['苔绿色'] }],
          summary: ['轻量便携'],
          suitable_text: '适合短途出行',
          cover_url: 'https://example.com/bag.jpg',
          rating: 4.7,
          review_count: 88,
          sold_count: 430
        }
      }
    ],
    summary: {
      selectedCount: 1,
      invalidCount: 1,
      totalAmount: 248
    },
    ...overrides
  }
}

function makeAddressResponse(overrides = {}) {
  return {
    list: [
      {
        id: 'addr_001',
        receiver_name: '拾柒',
        receiver_phone: '13527882788',
        region: '上海市 静安区 南京西路街道',
        detail_address: '梅园里小区 12 号 3B 室',
        tag: '家',
        is_default: true
      }
    ],
    ...overrides
  }
}

describe('cart and order flow', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    Object.values(userApi).forEach((mock) => mock.mockReset())
  })

  it('adds products through the real cart api and refreshes merged quantities', async () => {
    userApi.getCart
      .mockResolvedValueOnce(makeCartResponse({
        list: [makeCartResponse().list[0]],
        summary: { selectedCount: 1, invalidCount: 0, totalAmount: 248 }
      }))
      .mockResolvedValueOnce(makeCartResponse({
        list: [
          {
            ...makeCartResponse().list[0],
            quantity: 3
          }
        ],
        summary: { selectedCount: 3, invalidCount: 0, totalAmount: 744 }
      }))
    userApi.addCartItem.mockResolvedValue({
      item: { id: 'ci_001', quantity: 3 }
    })

    const store = useCartStore()
    await store.fetchCart()
    await store.addProduct(
      {
        id: 'p-001',
        memberPrice: 248,
        price: 268,
        stockStatus: 'inStock'
      },
      '3kg · 鸡肉',
      2
    )

    expect(userApi.addCartItem).toHaveBeenCalledWith({
      product_id: 'p-001',
      spec_key: '3kg|鸡肉',
      spec_label: '3kg · 鸡肉',
      quantity: 2
    })
    expect(store.items).toHaveLength(1)
    expect(store.items[0].quantity).toBe(3)
    expect(store.summary.selectedCount).toBe(3)
  })

  it('shows invalid cart items returned by the user cart api', async () => {
    userApi.getCart.mockResolvedValue(makeCartResponse())

    const router = createTestRouter([{ path: '/cart', component: CartView }])
    router.push('/cart')
    await router.isReady()

    const wrapper = mount(CartView, {
      global: {
        plugins: [router]
      }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('失效商品')
    expect(wrapper.text()).toContain('商品已售罄')
  })

  it('requires at least one address before creating an order', async () => {
    userApi.getCart.mockResolvedValue(makeCartResponse({
      list: [makeCartResponse().list[0]],
      summary: { selectedCount: 1, invalidCount: 0, totalAmount: 248 }
    }))
    userApi.getAddresses.mockResolvedValue({ list: [] })

    const router = createTestRouter([
      { path: '/order/confirm', component: OrderConfirmView },
      { path: '/orders/:id', component: { template: '<div>detail</div>' } }
    ])
    router.push('/order/confirm')
    await router.isReady()

    const wrapper = mount(OrderConfirmView, {
      global: {
        plugins: [router]
      }
    })

    await flushPromises()
    await wrapper.find('.button-primary').trigger('click')
    await flushPromises()

    expect(userApi.createOrder).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('下单前需要先添加收货地址')
  })

  it('submits orders through the real api, refreshes cart, and routes to the detail page', async () => {
    userApi.getCart
      .mockResolvedValueOnce(makeCartResponse({
        list: [makeCartResponse().list[0]],
        summary: { selectedCount: 1, invalidCount: 0, totalAmount: 248 }
      }))
      .mockResolvedValueOnce({
        list: [],
        summary: { selectedCount: 0, invalidCount: 0, totalAmount: 0 }
      })
    userApi.getAddresses.mockResolvedValue(makeAddressResponse())
    userApi.createOrder.mockResolvedValue({
      order: {
        id: 'order_002',
        status: 'pendingShipment'
      }
    })

    const router = createTestRouter([
      { path: '/order/confirm', component: OrderConfirmView },
      { path: '/orders/:id', component: { template: '<div>detail</div>' } }
    ])
    router.push('/order/confirm')
    await router.isReady()

    const wrapper = mount(OrderConfirmView, {
      global: {
        plugins: [router]
      }
    })

    await flushPromises()
    await wrapper.find('.button-primary').trigger('click')
    await flushPromises()

    expect(userApi.createOrder).toHaveBeenCalledWith({
      address_id: 'addr_001',
      remark: ''
    })
    expect(userApi.getCart).toHaveBeenCalledTimes(2)
    expect(router.currentRoute.value.fullPath).toBe('/orders/order_002?backTo=/')
  })
})
