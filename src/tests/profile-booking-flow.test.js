import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createWebHashHistory } from 'vue-router'

const userApi = vi.hoisted(() => ({
  getProfile: vi.fn(),
  getPets: vi.fn(),
  createPet: vi.fn(),
  updatePet: vi.fn(),
  deletePet: vi.fn(),
  createBooking: vi.fn(),
  getCoupons: vi.fn(),
  getBookings: vi.fn(),
  getBookingDetail: vi.fn(),
  cancelBooking: vi.fn(),
  getOrders: vi.fn()
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

import { useProfileStore } from '@/stores/profile'
import { useBookingStore } from '@/stores/booking'
import { useAccountStore } from '@/stores/account'
import OrderListView from '@/views/OrderListView.vue'

function createTestRouter() {
  const router = createRouter({
    history: createWebHashHistory(),
    routes: [{ path: '/orders', component: OrderListView }]
  })

  router.push('/orders')
  return router
}

describe('profile and booking flow', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    Object.values(userApi).forEach((mock) => mock.mockReset())
    Object.values(publicApi).forEach((mock) => mock.mockReset())
  })

  it('loads the real profile and pets into the profile store', async () => {
    userApi.getProfile.mockResolvedValue({
      profile: {
        id: 'u_demo_001',
        nickname: '拾柒',
        phone: '135 **** 2788',
        avatar_url: 'https://example.com/avatar.jpg',
        member_level: 'PetLife · 挚友会员',
        points: 1260,
        join_date: '2024-02',
        coupon_count: 0,
        stats: {
          order_count: 18,
          service_count: 7,
          saved_amount: 0
        }
      }
    })
    userApi.getPets.mockResolvedValue({
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
    })

    const store = useProfileStore()
    await store.fetchProfile()
    await store.fetchPets()

    expect(store.profile).toMatchObject({
      nickname: '拾柒',
      level: 'PetLife · 挚友会员'
    })
    expect(store.pets[0]).toMatchObject({
      id: 'pet_001',
      avatar: 'https://example.com/pet.jpg',
      allergies: ['牛肉']
    })
  })

  it('creates, updates, and deletes pets through the real pet apis', async () => {
    userApi.getPets.mockResolvedValue({ list: [] })
    userApi.createPet.mockResolvedValue({
      item: {
        id: 'pet_003',
        name: 'Mocha',
        type: 'dog',
        breed: '比熊犬',
        gender: 'male',
        birthday: '2022-02-14',
        weight: 6.5,
        neutered: false,
        allergies: ['鸡肉'],
        preferences: ['精致美容'],
        avatar_url: 'https://example.com/mocha.jpg',
        color: '#B58463'
      }
    })
    userApi.updatePet.mockResolvedValue({
      item: {
        id: 'pet_003',
        name: 'Mocha',
        type: 'dog',
        breed: '比熊犬',
        gender: 'male',
        birthday: '2022-02-14',
        weight: 6.8,
        neutered: true,
        allergies: [],
        preferences: ['短期寄养'],
        avatar_url: 'https://example.com/mocha.jpg',
        color: '#B58463'
      }
    })
    userApi.deletePet.mockResolvedValue({ removed: true })

    const store = useProfileStore()
    await store.fetchPets()

    await store.createPet({
      name: 'Mocha',
      type: 'dog',
      breed: '比熊犬',
      gender: 'male',
      birthday: '2022-02-14',
      weight: 6.5,
      neutered: false,
      allergies: ['鸡肉'],
      preferences: ['精致美容'],
      avatar: 'https://example.com/mocha.jpg',
      color: '#B58463'
    })

    expect(userApi.createPet).toHaveBeenCalledWith(expect.objectContaining({
      avatar_url: 'https://example.com/mocha.jpg'
    }))
    expect(store.pets[0].id).toBe('pet_003')

    await store.updatePet('pet_003', {
      name: 'Mocha',
      type: 'dog',
      breed: '比熊犬',
      gender: 'male',
      birthday: '2022-02-14',
      weight: 6.8,
      neutered: true,
      allergies: [],
      preferences: ['短期寄养'],
      avatar: 'https://example.com/mocha.jpg',
      color: '#B58463'
    })

    expect(userApi.updatePet).toHaveBeenCalledWith('pet_003', expect.objectContaining({
      weight: 6.8,
      neutered: true
    }))
    expect(store.pets[0].weight).toBe(6.8)

    await store.deletePet('pet_003')
    expect(userApi.deletePet).toHaveBeenCalledWith('pet_003')
    expect(store.pets).toHaveLength(0)
  })

  it('creates and cancels bookings through the booking store', async () => {
    publicApi.getStoreSlots.mockResolvedValue({
      list: [
        { id: 't-1', label: '10:00', capacity: 3, used: 0, remaining: 3, isAvailable: true }
      ]
    })
    userApi.createBooking.mockResolvedValue({
      booking: {
        id: 'booking_002',
        booking_no: 'BK20260422001',
        status: 'pendingService',
        status_label: '待服务',
        created_at: '2026-04-21 18:20',
        booking_date: '2026-04-22',
        service_title_snapshot: '基础洗护 · 标准套餐',
        service_cover_snapshot: 'https://example.com/service.jpg',
        service_price_snapshot: 108,
        pet_name_snapshot: '橘子',
        pet_avatar_snapshot: 'https://example.com/pet.jpg',
        store_name_snapshot: 'PetLife 生活馆 · 静安寺店',
        time_slot_label_snapshot: '10:00',
        contact_phone: '13527882788',
        note: '猫咪比较敏感'
      }
    })
    userApi.cancelBooking.mockResolvedValue({
      booking: {
        id: 'booking_002',
        booking_no: 'BK20260422001',
        status: 'cancelled',
        status_label: '已取消',
        created_at: '2026-04-21 18:20',
        booking_date: '2026-04-22',
        service_title_snapshot: '基础洗护 · 标准套餐',
        service_cover_snapshot: 'https://example.com/service.jpg',
        service_price_snapshot: 108,
        pet_name_snapshot: '橘子',
        pet_avatar_snapshot: 'https://example.com/pet.jpg',
        store_name_snapshot: 'PetLife 生活馆 · 静安寺店',
        time_slot_label_snapshot: '10:00'
      }
    })

    const store = useBookingStore()
    store.prepareFromService({
      id: 's-001',
      title: '基础洗护 · 标准套餐',
      cover: 'https://example.com/service.jpg',
      duration: 60,
      memberPrice: 108,
      storeOptions: [
        { id: 'store-1', name: 'PetLife 生活馆 · 静安寺店', address: '静安区南京西路 188 号' }
      ],
      timeSlots: [],
      dateOptions: [{ date: '2026-04-22', label: '明天', weekday: '周三' }]
    }, {
      date: '2026-04-22',
      storeId: 'store-1'
    })

    await store.fetchSlots()
    store.setPet('pet_001')
    store.setSlot('t-1')
    store.selectedCouponId = 'uc_service_001'
    store.phone = '13527882788'
    store.note = '猫咪比较敏感'

    const createdBooking = await store.submitBooking()

    expect(userApi.createBooking).toHaveBeenCalledWith({
      pet_id: 'pet_001',
      service_id: 's-001',
      store_id: 'store-1',
      time_slot_id: 't-1',
      booking_date: '2026-04-22',
      contact_phone: '13527882788',
      coupon_id: 'uc_service_001',
      note: '猫咪比较敏感'
    })
    expect(createdBooking).toMatchObject({
      id: 'booking_002',
      statusLabel: '待服务'
    })

    const cancelledBooking = await store.cancelBooking('booking_002')
    expect(userApi.cancelBooking).toHaveBeenCalledWith('booking_002')
    expect(cancelledBooking.status).toBe('cancelled')
  })

  it('shows product orders and service bookings in separate tabs on the order list page', async () => {
    userApi.getOrders.mockResolvedValue({
      list: [
        {
          id: 'order_001',
          order_no: 'PO20260402013',
          status: 'completed',
          status_label: '已完成',
          created_at: '2026-04-02 12:08',
          total_amount: 248,
          item_count: 1,
          receiver_region_snapshot: '上海市 静安区 南京西路街道',
          receiver_address_snapshot: '梅园里小区 12 号 3B 室',
          items: [
            {
              product_id: 'p-001',
              product_title_snapshot: '鲜肉全价猫粮',
              product_cover_snapshot: 'https://example.com/product.jpg',
              spec_label_snapshot: '3kg · 鸡肉',
              quantity: 1,
              unit_price_snapshot: 248,
              line_total: 248
            }
          ]
        }
      ]
    })
    userApi.getBookings.mockResolvedValue({
      list: [
        {
          id: 'booking_001',
          booking_no: 'BK20260410002',
          status: 'pendingService',
          status_label: '待服务',
          created_at: '2026-04-19 17:12',
          booking_date: '2026-04-22',
          service_title_snapshot: '基础洗护 · 标准套餐',
          service_cover_snapshot: 'https://example.com/service.jpg',
          service_price_snapshot: 108,
          pet_name_snapshot: '橘子',
          pet_avatar_snapshot: 'https://example.com/pet.jpg',
          store_name_snapshot: 'PetLife 生活馆 · 静安寺店',
          time_slot_label_snapshot: '11:30'
        }
      ]
    })

    const accountStore = useAccountStore()
    const router = createTestRouter()
    await router.isReady()

    const wrapper = mount(OrderListView, {
      global: {
        plugins: [router]
      }
    })

    await accountStore.fetchOrdersAndBookings()
    await flushPromises()

    expect(wrapper.text()).toContain('鲜肉全价猫粮')

    const serviceTab = wrapper.findAll('.orders__tab').find((button) => button.text().includes('服务预约'))
    await serviceTab.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('基础洗护 · 标准套餐')
    expect(wrapper.text()).toContain('待服务')
  })
})
