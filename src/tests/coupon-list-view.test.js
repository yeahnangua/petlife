import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createWebHashHistory } from 'vue-router'

const userApi = vi.hoisted(() => ({
  getCoupons: vi.fn()
}))

vi.mock('@/api/user', () => userApi)

import CouponListView from '@/views/CouponListView.vue'

function createTestRouter() {
  return createRouter({
    history: createWebHashHistory(),
    routes: [{ path: '/coupons', component: CouponListView }]
  })
}

describe('coupon list view', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    userApi.getCoupons.mockReset()
  })

  it('renders the current account coupon list from the real user coupon api', async () => {
    userApi.getCoupons.mockResolvedValue({
      list: [
        {
          id: 'uc_demo_001',
          campaign_id: 'coupon_cart_199_35',
          name: '购物车唤醒券',
          description: '满 199 减 35',
          discount_amount: 35,
          min_order_amount: 199,
          status: 'available',
          available: true,
          unavailable_reason: '',
          valid_to: '2099-12-31 23:59:59'
        },
        {
          id: 'uc_used_001',
          campaign_id: 'coupon_old',
          name: '旧券',
          description: '已使用',
          discount_amount: 10,
          min_order_amount: 99,
          status: 'used',
          available: false,
          unavailable_reason: 'coupon is unavailable',
          valid_to: '2026-01-31 23:59:59'
        }
      ]
    })

    const router = createTestRouter()
    router.push('/coupons')
    await router.isReady()

    const wrapper = mount(CouponListView, {
      global: {
        plugins: [router]
      }
    })

    await flushPromises()

    expect(userApi.getCoupons).toHaveBeenCalledWith({})
    expect(wrapper.text()).toContain('我的优惠券')
    expect(wrapper.text()).toContain('购物车唤醒券')
    expect(wrapper.text()).toContain('¥35')
    expect(wrapper.text()).toContain('满 199 可用')
    expect(wrapper.text()).toContain('旧券')
    expect(wrapper.text()).toContain('不可用')
  })
})
