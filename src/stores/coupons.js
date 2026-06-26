import { defineStore } from 'pinia'
import { getCoupons } from '@/api/user'

const unavailableReasonText = {
  'coupon is unavailable': '优惠券不可用',
  'campaign is disabled': '优惠活动已停用',
  'coupon is expired': '优惠券已过期',
  'coupon threshold is not met': '订单金额未满足使用门槛'
}

function formatUnavailableReason(reason = '') {
  return unavailableReasonText[reason] || reason
}

function adaptCoupon(coupon = {}) {
  return {
    id: coupon.id,
    campaignId: coupon.campaign_id,
    name: coupon.name,
    description: coupon.description,
    amount: coupon.discount_amount ?? 0,
    minOrderAmount: coupon.min_order_amount ?? 0,
    status: coupon.status,
    available: Boolean(coupon.available),
    unavailableReason: formatUnavailableReason(coupon.unavailable_reason || ''),
    validFrom: coupon.valid_from,
    validTo: coupon.valid_to
  }
}

export const useCouponStore = defineStore('coupons', {
  state: () => ({
    items: [],
    loading: false,
    error: ''
  }),
  getters: {
    availableCoupons: (state) => state.items.filter((coupon) => coupon.available),
    accountAvailableCoupons: (state) => state.items.filter((coupon) => coupon.status === 'available'),
    usedCoupons: (state) => state.items.filter((coupon) => coupon.status === 'used'),
    checkoutUnavailableCoupons: (state) => state.items.filter((coupon) => coupon.status === 'available' && !coupon.available)
  },
  actions: {
    async fetchCoupons(params = {}) {
      this.loading = true
      this.error = ''

      try {
        const data = await getCoupons(params)
        this.items = (data.list || []).map(adaptCoupon)
        return this.items
      } catch (error) {
        this.error = error instanceof Error ? error.message : '优惠券加载失败'
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
