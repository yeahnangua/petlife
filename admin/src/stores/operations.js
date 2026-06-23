import { defineStore } from 'pinia'
import {
  getBookingDetail,
  getOrderDetail,
  listBookings,
  listOrders,
  updateBookingStatus,
  updateOrderStatus
} from '@/api/operations'

function upsertById(list, item) {
  const index = list.findIndex((entry) => entry.id === item.id)

  if (index === -1) {
    return [item, ...list]
  }

  return list.map((entry) => (entry.id === item.id ? item : entry))
}

export const useOperationsStore = defineStore('admin-operations', {
  state: () => ({
    orders: [],
    bookings: [],
    currentOrder: null,
    currentBooking: null,
    loading: {
      orders: false,
      bookings: false,
      orderDetail: false,
      bookingDetail: false
    },
    submitting: false,
    error: ''
  }),
  actions: {
    async fetchOrders(status = '') {
      this.loading.orders = true
      this.error = ''

      try {
        const data = await listOrders(status ? { status } : {})
        this.orders = data.list || []

        if (!this.currentOrder && this.orders[0]?.id) {
          await this.fetchOrderDetail(this.orders[0].id)
        }

        return this.orders
      } catch (error) {
        this.error = error instanceof Error ? error.message : '订单列表加载失败'
        throw error
      } finally {
        this.loading.orders = false
      }
    },
    async fetchOrderDetail(id) {
      this.loading.orderDetail = true
      this.error = ''

      try {
        const data = await getOrderDetail(id)
        this.currentOrder = data.order
        this.orders = upsertById(this.orders, data.order)
        return data.order
      } catch (error) {
        this.error = error instanceof Error ? error.message : '订单详情加载失败'
        throw error
      } finally {
        this.loading.orderDetail = false
      }
    },
    async changeOrderStatus(id, status) {
      this.submitting = true
      this.error = ''

      try {
        const data = await updateOrderStatus(id, status)
        this.currentOrder = data.order
        this.orders = upsertById(this.orders, data.order)
        return data.order
      } catch (error) {
        this.error = error instanceof Error ? error.message : '订单状态更新失败'
        throw error
      } finally {
        this.submitting = false
      }
    },
    async fetchBookings(status = '') {
      this.loading.bookings = true
      this.error = ''

      try {
        const data = await listBookings(status ? { status } : {})
        this.bookings = data.list || []

        if (!this.currentBooking && this.bookings[0]?.id) {
          await this.fetchBookingDetail(this.bookings[0].id)
        }

        return this.bookings
      } catch (error) {
        this.error = error instanceof Error ? error.message : '预约列表加载失败'
        throw error
      } finally {
        this.loading.bookings = false
      }
    },
    async fetchBookingDetail(id) {
      this.loading.bookingDetail = true
      this.error = ''

      try {
        const data = await getBookingDetail(id)
        this.currentBooking = data.booking
        this.bookings = upsertById(this.bookings, data.booking)
        return data.booking
      } catch (error) {
        this.error = error instanceof Error ? error.message : '预约详情加载失败'
        throw error
      } finally {
        this.loading.bookingDetail = false
      }
    },
    async changeBookingStatus(id, status) {
      this.submitting = true
      this.error = ''

      try {
        const data = await updateBookingStatus(id, status)
        this.currentBooking = data.booking
        this.bookings = upsertById(this.bookings, data.booking)
        return data.booking
      } catch (error) {
        this.error = error instanceof Error ? error.message : '预约状态更新失败'
        throw error
      } finally {
        this.submitting = false
      }
    }
  }
})
