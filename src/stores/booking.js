import { defineStore } from 'pinia'
import { pets, serviceDates } from '@/mocks'

const defaultPhone = '1352788'

export const useBookingStore = defineStore('booking', {
  state: () => ({
    serviceId: null,
    petId: pets[0]?.id ?? null,
    date: serviceDates.find((item) => item.available)?.date ?? null,
    slotId: null,
    storeId: null,
    note: '',
    phone: defaultPhone
  }),
  getters: {
    isReady(state) {
      return Boolean(state.serviceId && state.petId && state.date && state.slotId && state.storeId)
    }
  },
  actions: {
    prepareFromService(service) {
      this.serviceId = service.id
      this.storeId = service.storeOptions[0]?.id ?? null
      this.slotId = service.timeSlots.find((item) => item.available)?.id ?? null
    },
    setPet(id) {
      this.petId = id
    },
    setDate(date) {
      this.date = date
    },
    setSlot(slotId) {
      this.slotId = slotId
    },
    setStore(storeId) {
      this.storeId = storeId
    },
    hydrate(payload) {
      this.serviceId = payload.serviceId ?? this.serviceId
      this.petId = payload.petId ?? this.petId
      this.date = payload.date ?? this.date
      this.slotId = payload.slotId ?? this.slotId
      this.storeId = payload.storeId ?? this.storeId
      this.note = payload.note ?? this.note
      this.phone = payload.phone ?? this.phone
    }
  }
})
