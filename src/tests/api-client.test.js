import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getCategories,
  getProductDetail,
  getProducts,
  getServiceDetail,
  getServices,
  getStoreSlots,
  getStores
} from '@/api/public'
import {
  addCartItem,
  cancelBooking,
  cancelOrder,
  clearInvalidCartItems,
  createAddress,
  createBooking,
  createOrder,
  createPet,
  deleteAddress,
  deleteCartItem,
  deletePet,
  getAddresses,
  getBookingDetail,
  getBookings,
  getCart,
  getOrderDetail,
  getOrders,
  getPets,
  getProfile,
  updateAddress,
  updateCartItem,
  updatePet
} from '@/api/user'
import { request } from '@/api/http'
import {
  adaptCategory,
  adaptProduct,
  adaptProductDetail,
  adaptService,
  adaptServiceDetail,
  adaptStore,
  adaptStoreSlot
} from '@/adapters/catalog'
import { adaptAddress, adaptPet, adaptProfile } from '@/adapters/profile'
import { adaptBooking, adaptOrder } from '@/adapters/order'

function createJsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'Content-Type': 'application/json' },
    ...init
  })
}

describe('frontend api client', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('unwraps the common ok envelope for successful responses', async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse({
      code: 0,
      message: 'ok',
      data: { list: [{ id: 'cat-food' }] }
    }))

    await expect(request('/api/public/categories')).resolves.toEqual({
      list: [{ id: 'cat-food' }]
    })
    expect(fetchMock).toHaveBeenCalledWith('/api/public/categories', expect.any(Object))
  })

  it('throws the response message when business code is non-zero', async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse({
      code: 4001,
      message: 'invalid params',
      data: null
    }))

    await expect(request('/api/public/products')).rejects.toThrow('invalid params')
  })

  it('throws a readable http error when response status is not ok', async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse({
      code: 4040,
      message: 'not found',
      data: null
    }, { status: 404 }))

    await expect(request('/api/public/products/p-missing')).rejects.toThrow('not found')
  })

  it('builds public api query strings and returns raw data payloads', async () => {
    fetchMock
      .mockResolvedValueOnce(createJsonResponse({ code: 0, message: 'ok', data: { list: [] } }))
      .mockResolvedValueOnce(createJsonResponse({ code: 0, message: 'ok', data: { list: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } } }))
      .mockResolvedValueOnce(createJsonResponse({ code: 0, message: 'ok', data: { item: { id: 'p-001' } } }))
      .mockResolvedValueOnce(createJsonResponse({ code: 0, message: 'ok', data: { list: [] } }))
      .mockResolvedValueOnce(createJsonResponse({ code: 0, message: 'ok', data: { item: { id: 's-001' } } }))
      .mockResolvedValueOnce(createJsonResponse({ code: 0, message: 'ok', data: { list: [] } }))
      .mockResolvedValueOnce(createJsonResponse({ code: 0, message: 'ok', data: { list: [] } }))

    await expect(getCategories()).resolves.toEqual({ list: [] })
    await expect(getProducts({ categoryId: 'cat-food', keyword: '鸡肉', petType: 'cat', page: 2, pageSize: 6 })).resolves.toEqual({
      list: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 }
    })
    await expect(getProductDetail('p-001')).resolves.toEqual({ item: { id: 'p-001' } })
    await expect(getServices({ petType: 'dog', page: 3, pageSize: 5 })).resolves.toEqual({ list: [] })
    await expect(getServiceDetail('s-001')).resolves.toEqual({ item: { id: 's-001' } })
    await expect(getStores()).resolves.toEqual({ list: [] })
    await expect(getStoreSlots('store-1', { date: '2026-04-22', serviceId: 's-001' })).resolves.toEqual({ list: [] })

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/api/public/categories',
      '/api/public/products?categoryId=cat-food&keyword=%E9%B8%A1%E8%82%89&petType=cat&page=2&pageSize=6',
      '/api/public/products/p-001',
      '/api/public/services?petType=dog&page=3&pageSize=5',
      '/api/public/services/s-001',
      '/api/public/stores',
      '/api/public/stores/store-1/slots?date=2026-04-22&serviceId=s-001'
    ])
  })

  it('sends json payloads for user api mutations and uses the correct verbs', async () => {
    fetchMock
      .mockResolvedValueOnce(createJsonResponse({ code: 0, message: 'ok', data: { profile: { id: 'u_demo_001' } } }))
      .mockResolvedValueOnce(createJsonResponse({ code: 0, message: 'ok', data: { list: [] } }))
      .mockResolvedValueOnce(createJsonResponse({ code: 0, message: 'ok', data: { item: { id: 'addr_002' } } }, { status: 201 }))
      .mockResolvedValueOnce(createJsonResponse({ code: 0, message: 'ok', data: { item: { id: 'addr_002' } } }))
      .mockResolvedValueOnce(createJsonResponse({ code: 0, message: 'ok', data: { removed: true } }))
      .mockResolvedValueOnce(createJsonResponse({ code: 0, message: 'ok', data: { list: [] } }))
      .mockResolvedValueOnce(createJsonResponse({ code: 0, message: 'ok', data: { item: { id: 'pet_003' } } }, { status: 201 }))
      .mockResolvedValueOnce(createJsonResponse({ code: 0, message: 'ok', data: { item: { id: 'pet_003' } } }))
      .mockResolvedValueOnce(createJsonResponse({ code: 0, message: 'ok', data: { removed: true } }))
      .mockResolvedValueOnce(createJsonResponse({ code: 0, message: 'ok', data: { list: [], summary: { selectedCount: 0, invalidCount: 0, totalAmount: 0 } } }))
      .mockResolvedValueOnce(createJsonResponse({ code: 0, message: 'ok', data: { item: { id: 'ci_010' } } }))
      .mockResolvedValueOnce(createJsonResponse({ code: 0, message: 'ok', data: { item: { id: 'ci_010' } } }))
      .mockResolvedValueOnce(createJsonResponse({ code: 0, message: 'ok', data: { removed: true } }))
      .mockResolvedValueOnce(createJsonResponse({ code: 0, message: 'ok', data: { removedCount: 1 } }))
      .mockResolvedValueOnce(createJsonResponse({ code: 0, message: 'ok', data: { list: [] } }))
      .mockResolvedValueOnce(createJsonResponse({ code: 0, message: 'ok', data: { order: { id: 'order_002' } } }, { status: 201 }))
      .mockResolvedValueOnce(createJsonResponse({ code: 0, message: 'ok', data: { list: [] } }))
      .mockResolvedValueOnce(createJsonResponse({ code: 0, message: 'ok', data: { order: { id: 'order_002' } } }))
      .mockResolvedValueOnce(createJsonResponse({ code: 0, message: 'ok', data: { order: { id: 'order_002', status: 'cancelled' } } }))
      .mockResolvedValueOnce(createJsonResponse({ code: 0, message: 'ok', data: { booking: { id: 'booking_002' } } }, { status: 201 }))
      .mockResolvedValueOnce(createJsonResponse({ code: 0, message: 'ok', data: { list: [] } }))
      .mockResolvedValueOnce(createJsonResponse({ code: 0, message: 'ok', data: { booking: { id: 'booking_002' } } }))
      .mockResolvedValueOnce(createJsonResponse({ code: 0, message: 'ok', data: { booking: { id: 'booking_002', status: 'cancelled' } } }))

    const addressPayload = {
      receiver_name: '拾柒',
      receiver_phone: '13527882788',
      region: '上海市 静安区 南京西路街道',
      detail_address: '梅园里小区 12 号 3B 室',
      tag: '家',
      is_default: true
    }

    const petPayload = {
      name: 'Mocha',
      type: 'dog',
      breed: '比熊犬',
      gender: 'male',
      birthday: '2022-02-14',
      weight: 6.5,
      neutered: false,
      allergies: ['鸡肉'],
      preferences: ['精致美容'],
      avatar_url: 'https://example.com/pet.png',
      color: '#B58463'
    }

    const cartPayload = {
      product_id: 'p-001',
      spec_key: '3kg|鸡肉',
      spec_label: '3kg · 鸡肉',
      quantity: 1
    }

    const orderPayload = { address_id: 'addr_001', remark: '工作日请放前台' }
    const bookingPayload = {
      pet_id: 'pet_001',
      service_id: 's-001',
      store_id: 'store-1',
      time_slot_id: 't-1',
      booking_date: '2026-04-22',
      contact_phone: '13527882788',
      note: '猫咪比较敏感'
    }

    await getProfile()
    await getAddresses()
    await createAddress(addressPayload)
    await updateAddress('addr_002', addressPayload)
    await deleteAddress('addr_002')
    await getPets()
    await createPet(petPayload)
    await updatePet('pet_003', petPayload)
    await deletePet('pet_003')
    await getCart()
    await addCartItem(cartPayload)
    await updateCartItem('ci_010', { quantity: 4, selected: false })
    await deleteCartItem('ci_010')
    await clearInvalidCartItems()
    await getOrders()
    await createOrder(orderPayload)
    await getOrderDetail('order_002')
    await cancelOrder('order_002')
    await createBooking(bookingPayload)
    await getBookings()
    await getBookingDetail('booking_002')
    await cancelBooking('booking_002')

    expect(fetchMock.mock.calls[0][0]).toBe('/api/user/profile')
    expect(fetchMock.mock.calls[2][1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify(addressPayload)
    })
    expect(fetchMock.mock.calls[3][0]).toBe('/api/user/addresses/addr_002')
    expect(fetchMock.mock.calls[3][1]).toMatchObject({
      method: 'PUT',
      body: JSON.stringify(addressPayload)
    })
    expect(fetchMock.mock.calls[4][1]).toMatchObject({ method: 'DELETE' })
    expect(fetchMock.mock.calls[10][1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify(cartPayload)
    })
    expect(fetchMock.mock.calls[11][1]).toMatchObject({
      method: 'PUT',
      body: JSON.stringify({ quantity: 4, selected: false })
    })
    expect(fetchMock.mock.calls[13][1]).toMatchObject({ method: 'DELETE' })
    expect(fetchMock.mock.calls[15][1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify(orderPayload)
    })
    expect(fetchMock.mock.calls[17][0]).toBe('/api/user/orders/order_002/cancel')
    expect(fetchMock.mock.calls[17][1]).toMatchObject({ method: 'POST' })
    expect(fetchMock.mock.calls[18][1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify(bookingPayload)
    })
    expect(fetchMock.mock.calls[21][0]).toBe('/api/user/bookings/booking_002/cancel')
  })

  it('adapts backend payloads into the current UI-friendly shapes', () => {
    expect(adaptCategory({
      id: 'cat-food',
      name: '主粮',
      slug: 'food',
      pet_type: 'cat',
      cover_url: 'https://example.com/cat-food.jpg'
    })).toEqual({
      id: 'cat-food',
      name: '主粮',
      label: '主粮',
      slug: 'food',
      petType: 'cat',
      cover: 'https://example.com/cat-food.jpg'
    })

    expect(adaptProduct({
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
      tags: ['低敏', '无谷'],
      specs: [{ group: '规格', options: ['1.5kg', '3kg'] }],
      summary: ['鲜肉含量 70%'],
      suitable_text: '适合 1-8 岁成猫 / 全品种',
      cover_url: 'https://example.com/product.jpg',
      rating: 4.9,
      review_count: 1283,
      sold_count: 12800
    })).toMatchObject({
      id: 'p-001',
      category: 'food',
      petType: 'cat',
      memberPrice: 248,
      originalPrice: 298,
      cover: 'https://example.com/product.jpg',
      suitable: '适合 1-8 岁成猫 / 全品种',
      reviewCount: 1283,
      sold: 12800,
      gradient: expect.any(Array)
    })

    expect(adaptProductDetail({
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
      tags: ['低敏', '无谷'],
      specs: [{ group: '规格', options: ['1.5kg', '3kg'] }],
      summary: ['鲜肉含量 70%'],
      suitable_text: '适合 1-8 岁成猫 / 全品种',
      cover_url: 'https://example.com/product.jpg',
      rating: 4.9,
      review_count: 1283,
      sold_count: 12800,
      product_images: [{ image_url: 'https://example.com/1.jpg' }, { image_url: 'https://example.com/2.jpg' }]
    }).images).toEqual(['https://example.com/1.jpg', 'https://example.com/2.jpg'])

    expect(adaptService({
      id: 's-001',
      title: '基础洗护 · 标准套餐',
      subtitle: '门店 60 分钟基础洁净护理',
      pet_type: 'cat',
      price: 128,
      member_price: 108,
      original_price: 158,
      duration_minutes: 60,
      badge: '热门',
      highlights: ['基础洗护', '指甲修剪'],
      summary: ['短毛猫', '长毛猫'],
      notice: ['请提前 10 分钟到店'],
      cover_url: 'https://example.com/service.jpg',
      rating: 4.8,
      review_count: 612
    })).toMatchObject({
      id: 's-001',
      tagline: '门店 60 分钟基础洁净护理',
      memberPrice: 108,
      duration: 60,
      includes: ['基础洗护', '指甲修剪'],
      suitable: ['短毛猫', '长毛猫'],
      tips: ['请提前 10 分钟到店'],
      cover: 'https://example.com/service.jpg',
      gradient: expect.any(Array)
    })

    expect(adaptServiceDetail({
      id: 's-001',
      title: '基础洗护 · 标准套餐',
      subtitle: '门店 60 分钟基础洁净护理',
      pet_type: 'cat',
      price: 128,
      member_price: 108,
      original_price: 158,
      duration_minutes: 60,
      badge: '热门',
      highlights: ['基础洗护', '指甲修剪'],
      summary: ['短毛猫', '长毛猫'],
      notice: ['请提前 10 分钟到店'],
      cover_url: 'https://example.com/service.jpg',
      rating: 4.8,
      review_count: 612,
      service_images: [{ image_url: 'https://example.com/service-1.jpg' }]
    }).images).toEqual(['https://example.com/service-1.jpg'])

    expect(adaptStore({
      id: 'store-1',
      name: 'PetLife 生活馆 · 静安寺店',
      phone: '13527882788',
      address: '静安区南京西路 188 号',
      business_hours: '10:00-22:00',
      cover_url: 'https://example.com/store.jpg',
      status: 'active'
    })).toEqual({
      id: 'store-1',
      name: 'PetLife 生活馆 · 静安寺店',
      phone: '13527882788',
      address: '静安区南京西路 188 号',
      businessHours: '10:00-22:00',
      cover: 'https://example.com/store.jpg',
      status: 'active'
    })

    expect(adaptStoreSlot({
      id: 't-1',
      label: '10:00',
      capacity: 3,
      used: 1,
      remaining: 2,
      isAvailable: true
    })).toEqual({
      id: 't-1',
      label: '10:00',
      capacity: 3,
      used: 1,
      remaining: 2,
      available: true
    })

    expect(adaptProfile({
      id: 'u_demo_001',
      nickname: '拾柒',
      avatar_url: 'https://example.com/avatar.jpg',
      phone: '135 **** 2788',
      member_level: 'PetLife · 挚友会员',
      join_date: '2024-02',
      points: 1260,
      coupon_count: 5,
      stats: {
        order_count: 18,
        service_count: 7,
        saved_amount: 386
      }
    })).toEqual({
      id: 'u_demo_001',
      nickname: '拾柒',
      avatar: 'https://example.com/avatar.jpg',
      phone: '135 **** 2788',
      level: 'PetLife · 挚友会员',
      joinDate: '2024-02',
      points: 1260,
      couponCount: 5,
      stats: {
        orderCount: 18,
        serviceCount: 7,
        savedAmount: 386
      }
    })

    expect(adaptAddress({
      id: 'addr_001',
      receiver_name: '拾柒',
      receiver_phone: '13527882788',
      region: '上海市 静安区 南京西路街道',
      detail_address: '梅园里小区 12 号 3B 室',
      tag: '家',
      is_default: true
    })).toEqual({
      id: 'addr_001',
      name: '拾柒',
      phone: '13527882788',
      region: '上海市 静安区 南京西路街道',
      detail: '梅园里小区 12 号 3B 室',
      tag: '家',
      isDefault: true,
      displayAddress: '上海市 静安区 南京西路街道 梅园里小区 12 号 3B 室'
    })

    expect(adaptPet({
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
    })).toMatchObject({
      id: 'pet_001',
      avatar: 'https://example.com/pet.jpg',
      age: expect.any(String),
      allergies: ['牛肉'],
      preferences: ['洗护清洁']
    })

    expect(adaptOrder({
      id: 'order_001',
      order_no: 'PO20260402013',
      status: 'completed',
      status_label: '已完成',
      created_at: '2026-04-02 12:08',
      total_amount: 248,
      item_count: 1,
      receiver_region_snapshot: '上海市 静安区 南京西路街道',
      receiver_address_snapshot: '梅园里小区 12 号 3B 室',
      items: [{
        product_id: 'p-001',
        product_title_snapshot: '鲜肉全价猫粮',
        product_cover_snapshot: 'https://example.com/product.jpg',
        spec_label_snapshot: '3kg · 鸡肉',
        quantity: 1,
        unit_price_snapshot: 248,
        line_total: 248
      }]
    })).toEqual({
      id: 'order_001',
      kind: 'product',
      orderNo: 'PO20260402013',
      status: 'completed',
      statusLabel: '已完成',
      createdAt: '2026-04-02 12:08',
      totalAmount: 248,
      subtotalAmount: 248,
      shippingAmount: 12,
      payableAmount: 260,
      itemCount: 1,
      address: '上海市 静安区 南京西路街道 梅园里小区 12 号 3B 室',
      remark: undefined,
      items: [{
        id: 'p-001-3kg · 鸡肉',
        productId: 'p-001',
        title: '鲜肉全价猫粮',
        cover: 'https://example.com/product.jpg',
        specLabel: '3kg · 鸡肉',
        quantity: 1,
        unitPrice: 248,
        totalAmount: 248
      }]
    })

    expect(adaptBooking({
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
    })).toEqual({
      id: 'booking_001',
      kind: 'service',
      orderNo: 'BK20260410002',
      status: 'pendingService',
      statusLabel: '待服务',
      createdAt: '2026-04-19 17:12',
      totalAmount: 108,
      service: {
        title: '基础洗护 · 标准套餐',
        cover: 'https://example.com/service.jpg'
      },
      pet: {
        name: '橘子',
        avatar: 'https://example.com/pet.jpg'
      },
      scheduledAt: '2026-04-22 11:30',
      store: 'PetLife 生活馆 · 静安寺店'
    })
  })
})
