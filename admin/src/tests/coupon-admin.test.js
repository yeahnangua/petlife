import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App.vue'
import { createAdminRouter } from '@/router'
import { ADMIN_KEY_STORAGE } from '@/stores/session'

const couponApi = vi.hoisted(() => ({
  listCouponCampaigns: vi.fn(),
  createCouponCampaign: vi.fn(),
  updateCouponCampaign: vi.fn(),
  issueCoupon: vi.fn(),
  listUserCoupons: vi.fn(),
  updateUserCoupon: vi.fn()
}))

vi.mock('@/api/coupons', () => couponApi)

function createCampaign(overrides = {}) {
  return {
    id: 'coupon_cart_199_35',
    name: '购物车唤醒券',
    description: '满 199 减 35',
    discount_amount: 35,
    min_order_amount: 199,
    total_limit: 1000,
    issued_count: 1,
    status: 'active',
    valid_from: '2026-01-01 00:00:00',
    valid_to: '2099-12-31 23:59:59',
    ...overrides
  }
}

function createUserCoupon(overrides = {}) {
  return {
    id: 'uc_demo_001',
    campaign_id: 'coupon_cart_199_35',
    user_id: 'u_demo_001',
    name: '购物车唤醒券',
    discount_amount: 35,
    min_order_amount: 199,
    status: 'available',
    ...overrides
  }
}

async function mountAdmin(path = '/coupons') {
  localStorage.setItem(ADMIN_KEY_STORAGE, 'demo-admin-key')
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createAdminRouter(pinia)
  router.push(path)
  await router.isReady()

  const wrapper = mount(App, {
    global: {
      plugins: [pinia, router]
    }
  })
  await flushPromises()

  return { router, wrapper }
}

describe('admin coupon management', () => {
  beforeEach(() => {
    localStorage.clear()
    Object.values(couponApi).forEach((mock) => mock.mockReset())
    couponApi.listCouponCampaigns.mockResolvedValue({ list: [createCampaign()] })
    couponApi.listUserCoupons.mockResolvedValue({ list: [createUserCoupon()] })
  })

  it('adds coupon management to the admin shell and renders existing campaigns', async () => {
    const { router, wrapper } = await mountAdmin('/coupons')

    expect(router.currentRoute.value.fullPath).toBe('/coupons')
    expect(wrapper.text()).toContain('优惠券')
    expect(wrapper.text()).toContain('购物车唤醒券')
    expect(wrapper.text()).toContain('满 199 减 35')
  })

  it('creates a campaign, issues it to a user, and disables an issued coupon', async () => {
    couponApi.createCouponCampaign.mockResolvedValue({
      item: createCampaign({ id: 'coupon_summer_20', name: '夏日护理券', discount_amount: 20 })
    })
    couponApi.issueCoupon.mockResolvedValue({
      item: createUserCoupon({ id: 'uc_new_001', name: '夏日护理券' })
    })
    couponApi.updateUserCoupon.mockResolvedValue({
      item: createUserCoupon({ id: 'uc_demo_001', status: 'disabled' })
    })

    const { wrapper } = await mountAdmin('/coupons')

    await wrapper.get('[data-test="campaign-name"]').setValue('夏日护理券')
    await wrapper.get('[data-test="campaign-description"]').setValue('满 129 减 20')
    await wrapper.get('[data-test="campaign-discount"]').setValue('20')
    await wrapper.get('[data-test="campaign-threshold"]').setValue('129')
    await wrapper.get('[data-test="campaign-limit"]').setValue('100')
    await wrapper.get('[data-test="campaign-valid-from"]').setValue('2026-06-01 00:00:00')
    await wrapper.get('[data-test="campaign-valid-to"]').setValue('2026-08-31 23:59:59')
    await wrapper.get('[data-test="create-campaign"]').trigger('click')
    await flushPromises()

    expect(couponApi.createCouponCampaign).toHaveBeenCalledWith({
      name: '夏日护理券',
      description: '满 129 减 20',
      discount_amount: 20,
      min_order_amount: 129,
      total_limit: 100,
      valid_from: '2026-06-01 00:00:00',
      valid_to: '2026-08-31 23:59:59'
    })

    await wrapper.get('[data-test="issue-user-id"]').setValue('u_demo_001')
    await wrapper.get('[data-test="issue-coupon_cart_199_35"]').trigger('click')
    await flushPromises()
    expect(couponApi.issueCoupon).toHaveBeenCalledWith('coupon_cart_199_35', { user_id: 'u_demo_001' })

    await wrapper.get('[data-test="disable-uc_demo_001"]').trigger('click')
    await flushPromises()
    expect(couponApi.updateUserCoupon).toHaveBeenCalledWith('uc_demo_001', { status: 'disabled' })
  })
})
