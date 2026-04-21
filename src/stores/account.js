import { defineStore } from 'pinia'
import { getBookings, getOrders } from '@/api/user'
import { adaptBooking, adaptOrder } from '@/adapters/order'

function sortByCreatedAt(list) {
  return [...list].sort((left, right) => (left.createdAt < right.createdAt ? 1 : -1))
}

export const useAccountStore = defineStore('account', {
  state: () => ({
    productOrders: [],
    serviceBookings: [],
    loading: false,
    error: ''
  }),
  getters: {
    allOrders: (state) => sortByCreatedAt([...state.productOrders, ...state.serviceBookings]),
    pendingShipmentCount: (state) =>
      state.productOrders.filter((item) => item.status === 'pendingShipment').length,
    pendingServiceCount: (state) =>
      state.serviceBookings.filter((item) => item.status === 'pendingService').length
  },
  actions: {
    async fetchOrdersAndBookings() {
      this.loading = true
      this.error = ''

      try {
        const [ordersData, bookingsData] = await Promise.all([
          getOrders(),
          getBookings()
        ])
        this.productOrders = (ordersData.list || []).map(adaptOrder)
        this.serviceBookings = (bookingsData.list || []).map(adaptBooking)
      } catch (requestError) {
        this.error = requestError instanceof Error ? requestError.message : '订单记录加载失败'
      } finally {
        this.loading = false
      }
    }
  }
})
