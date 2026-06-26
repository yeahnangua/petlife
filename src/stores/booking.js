import { defineStore } from 'pinia'
import { createBooking as createBookingRequest, cancelBooking as cancelBookingRequest, getBookingDetail } from '@/api/user'
import { getStoreSlots } from '@/api/public'
import { adaptStoreSlot } from '@/adapters/catalog'
import { adaptBooking } from '@/adapters/order'

const defaultPhone = '13527882788'

function addDays(baseDate, days) {
  const nextDate = new Date(baseDate)
  nextDate.setDate(baseDate.getDate() + days)
  return nextDate
}

function formatWeekday(date) {
  return new Intl.DateTimeFormat('zh-CN', { weekday: 'short' }).format(date)
}

function formatMonthDay(date) {
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function formatDateValue(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function buildDateOptions(count = 7) {
  const today = new Date()

  return Array.from({ length: count }, (_, index) => {
    const date = addDays(today, index)

    return {
      date: formatDateValue(date),
      label: index === 0 ? '今天' : index === 1 ? '明天' : formatMonthDay(date),
      weekday: formatWeekday(date)
    }
  })
}

export const useBookingStore = defineStore('booking', {
  state: () => ({
    serviceId: null,
    serviceTitle: '',
    serviceCover: '',
    servicePrice: 0,
    serviceDuration: 0,
    storeOptions: [],
    timeSlots: [],
    dateOptions: buildDateOptions(),
    petId: null,
    date: buildDateOptions()[0]?.date ?? null,
    slotId: null,
    storeId: null,
    note: '',
    phone: defaultPhone,
    selectedCouponId: '',
    loading: false,
    submitting: false,
    error: '',
    currentBooking: null,
    currentBookingDetail: null
  }),
  getters: {
    isReady(state) {
      return Boolean(state.serviceId && state.petId && state.date && state.slotId && state.storeId)
    },
    currentService(state) {
      if (!state.serviceId) {
        return null
      }

      return {
        id: state.serviceId,
        title: state.serviceTitle,
        cover: state.serviceCover,
        duration: state.serviceDuration,
        memberPrice: state.servicePrice,
        price: state.servicePrice,
        storeOptions: state.storeOptions,
        timeSlots: state.timeSlots
      }
    }
  },
  actions: {
    prepareFromService(service, selection = {}) {
      const dateOptions = selection.dateOptions || service.dateOptions || buildDateOptions()

      this.serviceId = service.id
      this.serviceTitle = service.title
      this.serviceCover = service.cover
      this.servicePrice = service.memberPrice ?? service.price ?? 0
      this.serviceDuration = service.duration ?? 0
      this.storeOptions = service.storeOptions || []
      this.timeSlots = service.timeSlots || []
      this.dateOptions = dateOptions
      this.storeId = selection.storeId ?? service.storeOptions?.[0]?.id ?? null
      this.date = selection.date ?? dateOptions[0]?.date ?? null
      this.slotId = selection.slotId ?? service.timeSlots?.find((item) => item.available)?.id ?? null
      this.note = selection.note ?? ''
      this.selectedCouponId = selection.selectedCouponId ?? ''
      this.error = ''
    },
    setPet(id) {
      this.petId = id
    },
    async setDate(date) {
      this.date = date
      await this.fetchSlots()
    },
    setSlot(slotId) {
      this.slotId = slotId
    },
    async setStore(storeId) {
      this.storeId = storeId
      await this.fetchSlots()
    },
    hydrate(payload) {
      this.serviceId = payload.serviceId ?? this.serviceId
      this.serviceTitle = payload.serviceTitle ?? this.serviceTitle
      this.serviceCover = payload.serviceCover ?? this.serviceCover
      this.servicePrice = payload.servicePrice ?? this.servicePrice
      this.serviceDuration = payload.serviceDuration ?? this.serviceDuration
      this.storeOptions = payload.storeOptions ?? this.storeOptions
      this.timeSlots = payload.timeSlots ?? this.timeSlots
      this.dateOptions = payload.dateOptions ?? this.dateOptions
      this.petId = payload.petId ?? this.petId
      this.date = payload.date ?? this.date
      this.slotId = payload.slotId ?? this.slotId
      this.storeId = payload.storeId ?? this.storeId
      this.note = payload.note ?? this.note
      this.phone = payload.phone ?? this.phone
      this.selectedCouponId = payload.selectedCouponId ?? this.selectedCouponId
    },
    async fetchSlots() {
      if (!this.serviceId || !this.storeId || !this.date) {
        this.timeSlots = []
        this.slotId = null
        return []
      }

      this.loading = true
      this.error = ''

      try {
        const data = await getStoreSlots(this.storeId, {
          date: this.date,
          serviceId: this.serviceId
        })
        this.timeSlots = (data.list || []).map(adaptStoreSlot)

        if (!this.timeSlots.find((item) => item.id === this.slotId && item.available)) {
          this.slotId = this.timeSlots.find((item) => item.available)?.id ?? null
        }

        return this.timeSlots
      } catch (requestError) {
        this.error = requestError instanceof Error ? requestError.message : '预约时段加载失败'
        this.timeSlots = []
        this.slotId = null
        throw requestError
      } finally {
        this.loading = false
      }
    },
    async submitBooking() {
      this.submitting = true
      this.error = ''

      try {
        const data = await createBookingRequest({
          pet_id: this.petId,
          service_id: this.serviceId,
          store_id: this.storeId,
          time_slot_id: this.slotId,
          booking_date: this.date,
          contact_phone: this.phone,
          ...(this.selectedCouponId ? { coupon_id: this.selectedCouponId } : {}),
          note: this.note
        })
        this.currentBooking = adaptBooking(data.booking)
        this.currentBookingDetail = data.booking
        return this.currentBooking
      } catch (requestError) {
        this.error = requestError instanceof Error ? requestError.message : '提交预约失败'
        throw requestError
      } finally {
        this.submitting = false
      }
    },
    async fetchBookingDetail(id) {
      this.loading = true
      this.error = ''

      try {
        const data = await getBookingDetail(id)
        this.currentBooking = adaptBooking(data.booking)
        this.currentBookingDetail = data.booking
        return data.booking
      } catch (requestError) {
        this.error = requestError instanceof Error ? requestError.message : '预约详情加载失败'
        throw requestError
      } finally {
        this.loading = false
      }
    },
    async cancelBooking(id) {
      this.submitting = true
      this.error = ''

      try {
        const data = await cancelBookingRequest(id)
        const booking = adaptBooking(data.booking)
        this.currentBooking = booking
        this.currentBookingDetail = {
          ...this.currentBookingDetail,
          ...data.booking
        }
        return booking
      } catch (requestError) {
        this.error = requestError instanceof Error ? requestError.message : '取消预约失败'
        throw requestError
      } finally {
        this.submitting = false
      }
    }
  }
})
