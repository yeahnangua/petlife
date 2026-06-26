import { defineStore } from 'pinia'
import { getCoupons } from '@/api/user'

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
    unavailableReason: coupon.unavailable_reason || '',
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
    availableCoupons: (state) => state.items.filter((coupon) => coupon.available)
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
