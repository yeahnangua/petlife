import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const catalogApi = vi.hoisted(() => ({
  listCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  listProducts: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
  listServices: vi.fn(),
  createService: vi.fn(),
  updateService: vi.fn(),
  deleteService: vi.fn()
}))

const uploadApi = vi.hoisted(() => ({
  uploadImage: vi.fn()
}))

vi.mock('@/api/catalog', () => catalogApi)
vi.mock('@/api/upload', () => uploadApi)

import { useCatalogStore } from '@/stores/catalog'
import UploadImageField from '@/components/UploadImageField.vue'

function makeCategory(overrides = {}) {
  return {
    id: 'cat_001',
    name: '猫粮',
    slug: 'cat-food',
    pet_type: 'cat',
    sort_order: 1,
    cover_url: '/uploads/category-cat.jpg',
    is_enabled: true,
    ...overrides
  }
}

function makeProduct(overrides = {}) {
  return {
    id: 'p_001',
    category_id: 'cat_001',
    category_slug: 'cat-food',
    title: '鲜肉全价猫粮',
    subtitle: '低敏冷鲜配方',
    pet_type: 'cat',
    price: 268,
    member_price: 248,
    original_price: 298,
    stock: 42,
    stock_status: 'inStock',
    badge: '热卖',
    tags: ['低敏'],
    specs: [{ group: '规格', options: ['3kg'] }],
    summary: ['鲜肉含量 70%'],
    suitable_text: '适合 1-8 岁成猫',
    cover_url: '/uploads/product.jpg',
    status: 'active',
    image_urls: ['/uploads/product-detail.jpg'],
    ...overrides
  }
}

function makeService(overrides = {}) {
  return {
    id: 's_001',
    title: '基础洗护',
    subtitle: '60 分钟护理',
    pet_type: 'cat',
    price: 138,
    member_price: 118,
    original_price: 168,
    duration_minutes: 60,
    badge: '热门',
    highlights: ['修剪脚底毛'],
    summary: ['适合敏感猫咪'],
    notice: ['提前 10 分钟到店'],
    cover_url: '/uploads/service.jpg',
    status: 'active',
    image_urls: ['/uploads/service-detail.jpg'],
    ...overrides
  }
}

describe.skip('admin catalog store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    Object.values(catalogApi).forEach((mock) => mock.mockReset())
    uploadApi.uploadImage.mockReset()
  })

  it('creates updates and deletes categories', async () => {
    catalogApi.listCategories.mockResolvedValue({ list: [makeCategory()] })
    catalogApi.createCategory.mockResolvedValue({
      item: makeCategory({ id: 'cat_002', name: '猫砂', slug: 'cat-litter' })
    })
    catalogApi.updateCategory.mockResolvedValue({
      item: makeCategory({ name: '冻干主粮', slug: 'freeze-dried' })
    })
    catalogApi.deleteCategory.mockResolvedValue({
      item: { id: 'cat_002' }
    })

    const store = useCatalogStore()
    await store.fetchCategories()
    await store.saveCategory({
      name: '猫砂',
      slug: 'cat-litter',
      pet_type: 'cat',
      sort_order: 2,
      cover_url: '/uploads/cat-litter.jpg',
      is_enabled: true
    })
    await store.saveCategory({
      name: '冻干主粮',
      slug: 'freeze-dried',
      pet_type: 'cat',
      sort_order: 1,
      cover_url: '/uploads/category-cat.jpg',
      is_enabled: true
    }, 'cat_001')
    await store.removeCategory('cat_002')

    expect(store.categories).toHaveLength(1)
    expect(store.categories[0].name).toBe('冻干主粮')
    expect(catalogApi.createCategory).toHaveBeenCalledWith(expect.objectContaining({
      name: '猫砂'
    }))
    expect(catalogApi.updateCategory).toHaveBeenCalledWith('cat_001', expect.objectContaining({
      slug: 'freeze-dried'
    }))
    expect(catalogApi.deleteCategory).toHaveBeenCalledWith('cat_002')
  })

  it('creates updates and deactivates products according to backend responses', async () => {
    catalogApi.listProducts.mockResolvedValue({ list: [makeProduct()] })
    catalogApi.createProduct.mockResolvedValue({
      item: makeProduct({ id: 'p_002', title: '肠胃舒缓罐头' })
    })
    catalogApi.updateProduct.mockResolvedValue({
      item: makeProduct({ title: '肠胃舒缓主食罐', badge: '新品' })
    })
    catalogApi.deleteProduct.mockResolvedValue({
      item: makeProduct({ id: 'p_002', title: '肠胃舒缓罐头', status: 'inactive' })
    })

    const store = useCatalogStore()
    await store.fetchProducts()
    await store.saveProduct(makeProduct({ id: undefined, title: '肠胃舒缓罐头' }))
    await store.saveProduct(makeProduct({ title: '肠胃舒缓主食罐', badge: '新品' }), 'p_001')
    await store.removeProduct('p_002')

    expect(store.products).toHaveLength(2)
    expect(store.products.find((item) => item.id === 'p_001')?.title).toBe('肠胃舒缓主食罐')
    expect(store.products.find((item) => item.id === 'p_002')?.status).toBe('inactive')
    expect(catalogApi.deleteProduct).toHaveBeenCalledWith('p_002')
  })

  it('creates updates and deactivates services according to backend responses', async () => {
    catalogApi.listServices.mockResolvedValue({ list: [makeService()] })
    catalogApi.createService.mockResolvedValue({
      item: makeService({ id: 's_002', title: '深层净护' })
    })
    catalogApi.updateService.mockResolvedValue({
      item: makeService({ title: '深层净护 Plus', badge: '升级' })
    })
    catalogApi.deleteService.mockResolvedValue({
      item: makeService({ id: 's_002', title: '深层净护', status: 'inactive' })
    })

    const store = useCatalogStore()
    await store.fetchServices()
    await store.saveService(makeService({ id: undefined, title: '深层净护' }))
    await store.saveService(makeService({ title: '深层净护 Plus', badge: '升级' }), 's_001')
    await store.removeService('s_002')

    expect(store.services).toHaveLength(2)
    expect(store.services.find((item) => item.id === 's_001')?.title).toBe('深层净护 Plus')
    expect(store.services.find((item) => item.id === 's_002')?.status).toBe('inactive')
    expect(catalogApi.deleteService).toHaveBeenCalledWith('s_002')
  })

  it('fills url fields after an image upload completes', async () => {
    uploadApi.uploadImage.mockResolvedValue({
      file: {
        url: '/uploads/2026/04/demo.jpg'
      }
    })

    const wrapper = mount(UploadImageField, {
      props: {
        modelValue: '',
        label: '封面图'
      }
    })

    const file = new File(['cover'], 'cover.jpg', { type: 'image/jpeg' })
    await wrapper.get('input[type="file"]').trigger('change', {
      target: {
        files: [file],
        value: 'cover.jpg'
      }
    })

    expect(uploadApi.uploadImage).toHaveBeenCalledWith(file)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['/uploads/2026/04/demo.jpg'])
  })
})
