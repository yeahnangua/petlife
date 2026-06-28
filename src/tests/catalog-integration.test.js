import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const publicApi = vi.hoisted(() => ({
  getCategories: vi.fn(),
  getProducts: vi.fn(),
  getProductDetail: vi.fn(),
  getServices: vi.fn(),
  getServiceDetail: vi.fn(),
  getStores: vi.fn(),
  getStoreSlots: vi.fn()
}))

vi.mock('@/api/public', () => publicApi)

import { useCatalogStore } from '@/stores/catalog'

describe('catalog integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    Object.values(publicApi).forEach((mock) => mock.mockReset())
  })

  it('loads categories, featured products, and featured services for the home page', async () => {
    publicApi.getCategories.mockResolvedValue({
      list: [
        { id: 'cat-food', name: '主粮', slug: 'food', pet_type: 'cat', cover_url: 'https://example.com/cat-food.jpg' },
        { id: 'all-travel', name: '出行', slug: 'travel', pet_type: 'all', cover_url: 'https://example.com/travel.jpg' }
      ]
    })
    publicApi.getProducts.mockResolvedValue({
      list: [
        {
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
          tags: ['低敏'],
          specs: [{ group: '规格', options: ['3kg'] }],
          summary: ['鲜肉含量 70%'],
          suitable_text: '适合 1-8 岁成猫 / 全品种',
          cover_url: 'https://example.com/product.jpg',
          rating: 4.9,
          review_count: 1283,
          sold_count: 12800
        }
      ],
      pagination: { page: 1, pageSize: 8, total: 1, totalPages: 1 }
    })
    publicApi.getServices.mockResolvedValue({
      list: [
        {
          id: 's-001',
          title: '基础洗护 · 标准套餐',
          subtitle: '门店 60 分钟基础洁净护理',
          pet_type: 'all',
          price: 128,
          member_price: 108,
          original_price: 158,
          duration_minutes: 60,
          badge: '热门',
          highlights: ['基础洗护'],
          summary: ['短毛猫'],
          notice: ['请提前 10 分钟到店'],
          cover_url: 'https://example.com/service.jpg',
          rating: 4.8,
          review_count: 612
        }
      ],
      pagination: { page: 1, pageSize: 4, total: 1, totalPages: 1 }
    })

    const store = useCatalogStore()
    await store.fetchHomeData('cat')

    expect(publicApi.getProducts).toHaveBeenCalledWith({ petType: 'cat', page: 1, pageSize: 8 })
    expect(publicApi.getServices).toHaveBeenCalledWith({ petType: 'cat', page: 1, pageSize: 4 })
    expect(store.categories).toHaveLength(2)
    expect(store.homeProducts[0]).toMatchObject({
      id: 'p-001',
      category: 'food',
      memberPrice: 248
    })
    expect(store.homeServices[0]).toMatchObject({
      id: 's-001',
      duration: 60,
      includes: ['基础洗护']
    })
  })

  it('supports product list filters and pagination', async () => {
    publicApi.getCategories.mockResolvedValue({
      list: [
        { id: 'cat-snack', name: '零食', slug: 'snack', pet_type: 'cat', cover_url: 'https://example.com/snack-cover.jpg' }
      ]
    })
    publicApi.getProducts.mockResolvedValue({
      list: [
        {
          id: 'p-002',
          category_id: 'cat-snack',
          category_slug: 'snack',
          title: '冻干鸡肉小食',
          subtitle: '原切冻干 · 适口性拉满',
          pet_type: 'cat',
          price: 58,
          member_price: 52,
          original_price: 68,
          stock_status: 'inStock',
          badge: '人气',
          tags: ['冻干'],
          specs: [{ group: '规格', options: ['120g'] }],
          summary: ['高蛋白'],
          suitable_text: '适合全阶段猫咪',
          cover_url: 'https://example.com/snack.jpg',
          rating: 4.8,
          review_count: 512,
          sold_count: 5300
        }
      ],
      pagination: { page: 2, pageSize: 1, total: 3, totalPages: 3 }
    })

    const store = useCatalogStore()
    await store.fetchProductList({
      petType: 'cat',
      categoryId: 'cat-snack',
      keyword: '鸡肉',
      page: 2,
      pageSize: 1
    })

    expect(publicApi.getProducts).toHaveBeenCalledWith({
      petType: 'cat',
      categoryId: 'cat-snack',
      keyword: '鸡肉',
      page: 2,
      pageSize: 1
    })
    expect(store.productFilters).toEqual({
      petType: 'cat',
      categoryId: 'cat-snack',
      keyword: '鸡肉',
      page: 2,
      pageSize: 1
    })
    expect(store.productPagination).toEqual({ page: 2, pageSize: 1, total: 3, totalPages: 3 })
    expect(store.productList[0]).toMatchObject({
      id: 'p-002',
      category: 'snack',
      memberPrice: 52
    })
  })

  it('loads visual search product candidates from the public catalog', async () => {
    publicApi.getProducts.mockResolvedValue({
      list: [
        {
          id: 'p-visual',
          category_id: 'cat-food',
          category_slug: 'food',
          title: '后台更新主图商品',
          subtitle: '用于以图搜商品',
          pet_type: 'cat',
          price: 268,
          member_price: 248,
          original_price: 298,
          stock_status: 'inStock',
          badge: '热卖',
          tags: ['低敏'],
          specs: [],
          summary: [],
          suitable_text: '适合成猫',
          cover_url: '/uploads/2026/04/product-updated.png',
          rating: 4.9,
          review_count: 1283,
          sold_count: 12800
        }
      ],
      pagination: { page: 1, pageSize: 100, total: 1, totalPages: 1 }
    })

    const store = useCatalogStore()
    await store.fetchVisualSearchProducts()

    expect(publicApi.getProducts).toHaveBeenCalledWith({ page: 1, pageSize: 100 })
    expect(store.visualSearchProducts).toEqual([
      expect.objectContaining({
        id: 'p-visual',
        cover: '/uploads/2026/04/product-updated.png'
      })
    ])
  })

  it('loads product detail with images and specs intact', async () => {
    publicApi.getProductDetail.mockResolvedValue({
      item: {
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
        tags: ['低敏'],
        specs: [
          { group: '规格', options: ['1.5kg', '3kg'] },
          { group: '口味', options: ['鸡肉', '三文鱼'] }
        ],
        summary: ['鲜肉含量 70%'],
        suitable_text: '适合 1-8 岁成猫 / 全品种',
        cover_url: 'https://example.com/product.jpg',
        rating: 4.9,
        review_count: 1283,
        sold_count: 12800,
        product_images: [
          { image_url: 'https://example.com/1.jpg' },
          { image_url: 'https://example.com/2.jpg' }
        ]
      }
    })
    publicApi.getProducts.mockResolvedValue({
      list: [],
      pagination: { page: 1, pageSize: 4, total: 0, totalPages: 0 }
    })

    const store = useCatalogStore()
    await store.fetchProductDetail('p-001')

    expect(store.currentProduct).toMatchObject({
      id: 'p-001',
      images: ['https://example.com/1.jpg', 'https://example.com/2.jpg']
    })
    expect(store.currentProduct.specs).toHaveLength(2)
    expect(store.error.productDetail).toBe('')
  })

  it('loads service detail with stores, live slots, and a bookable current service', async () => {
    publicApi.getServiceDetail.mockResolvedValue({
      item: {
        id: 's-001',
        title: '基础洗护 · 标准套餐',
        subtitle: '门店 60 分钟基础洁净护理',
        pet_type: 'all',
        price: 128,
        member_price: 108,
        original_price: 158,
        duration_minutes: 60,
        badge: '热门',
        highlights: ['基础洗护', '耳道护理'],
        summary: ['短毛猫'],
        notice: ['请提前 10 分钟到店'],
        cover_url: 'https://example.com/service.jpg',
        rating: 4.8,
        review_count: 612,
        service_images: [{ image_url: 'https://example.com/service-1.jpg' }]
      }
    })
    publicApi.getStores.mockResolvedValue({
      list: [
        {
          id: 'store-1',
          name: 'PetLife 生活馆 · 静安寺店',
          phone: '13527882788',
          address: '静安区南京西路 188 号',
          business_hours: '10:00-22:00',
          cover_url: 'https://example.com/store.jpg',
          status: 'active'
        }
      ]
    })
    publicApi.getStoreSlots.mockResolvedValue({
      list: [
        { id: 't-1', label: '10:00', capacity: 3, used: 0, remaining: 3, isAvailable: true },
        { id: 't-2', label: '11:30', capacity: 1, used: 1, remaining: 0, isAvailable: false }
      ]
    })

    const store = useCatalogStore()
    await store.fetchServiceDetail('s-001')

    expect(publicApi.getStoreSlots).toHaveBeenCalledWith(
      'store-1',
      expect.objectContaining({
        serviceId: 's-001'
      })
    )
    expect(store.currentService).toMatchObject({
      id: 's-001',
      includes: ['基础洗护', '耳道护理'],
      storeOptions: [
        {
          id: 'store-1',
          name: 'PetLife 生活馆 · 静安寺店'
        }
      ]
    })
    expect(store.serviceSlots).toEqual([
      { id: 't-1', label: '10:00', capacity: 3, used: 0, remaining: 3, available: true },
      { id: 't-2', label: '11:30', capacity: 1, used: 1, remaining: 0, available: false }
    ])
    expect(store.selectedStoreId).toBe('store-1')
    expect(store.selectedSlotDate).toBeTruthy()
  })
})
