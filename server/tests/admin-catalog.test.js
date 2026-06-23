import { existsSync } from 'node:fs'
import { join } from 'node:path'
import request from 'supertest'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { createDatabase } from '../src/db/index.js'
import { migrate } from '../src/db/migrate.js'
import { seed } from '../src/db/seed.js'
import { createTestContext } from './helpers/createTestContext.js'

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+pF9sAAAAASUVORK5CYII=',
  'base64'
)

function createSeededApp(cleanups) {
  const ctx = createTestContext()
  cleanups.push(() => ctx.cleanup())

  const db = createDatabase(ctx.dbPath)
  cleanups.push(() => db.close())

  migrate(db)
  seed(db)

  const app = createApp({
    adminKey: ctx.adminKey,
    dbPath: ctx.dbPath,
    uploadDir: ctx.uploadDir,
    database: db
  })

  return { app, db, ctx }
}

function withAdminKey(ctx, builder) {
  return builder.set('x-admin-key', ctx.adminKey)
}

describe('admin upload and catalog apis', () => {
  const cleanups = []

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()()
    }
  })

  it('returns 401 when admin key is missing', async () => {
    const { app } = createSeededApp(cleanups)

    const response = await request(app).get('/api/admin/categories')

    expect(response.status).toBe(401)
    expect(response.body.message).toBe('unauthorized')
  })

  it('rejects non-image uploads and returns a stable uploads url for image files', async () => {
    const { app, ctx } = createSeededApp(cleanups)

    const invalidUpload = await withAdminKey(
      ctx,
      request(app)
        .post('/api/admin/uploads/images')
        .attach('file', Buffer.from('not-an-image'), {
          filename: 'note.txt',
          contentType: 'text/plain'
        })
    )

    expect(invalidUpload.status).toBe(400)
    expect(invalidUpload.body.message).toBe('only image uploads are allowed')

    const uploadResponse = await withAdminKey(
      ctx,
      request(app)
        .post('/api/admin/uploads/images')
        .attach('file', PNG_1X1, {
          filename: 'tiny.png',
          contentType: 'image/png'
        })
    )

    expect(uploadResponse.status).toBe(200)
    expect(uploadResponse.body.data.file.url).toMatch(/^\/uploads\/\d{4}\/\d{2}\//)

    const relativePath = uploadResponse.body.data.file.url.replace('/uploads/', '')
    expect(existsSync(join(ctx.uploadDir, relativePath))).toBe(true)
  })

  it('supports category, store, and time-slot crud for unreferenced records', async () => {
    const { app, ctx } = createSeededApp(cleanups)

    const createCategory = await withAdminKey(
      ctx,
      request(app).post('/api/admin/categories').send({
        name: '玩具',
        slug: 'toy-extra',
        pet_type: 'all',
        sort_order: 9,
        cover_url: '/uploads/2026/04/toy.png',
        is_enabled: true
      })
    )

    expect(createCategory.status).toBe(201)
    expect(createCategory.body.data.item.slug).toBe('toy-extra')

    const updateCategory = await withAdminKey(
      ctx,
      request(app).put(`/api/admin/categories/${createCategory.body.data.item.id}`).send({
        name: '互动玩具',
        slug: 'toy-extra',
        pet_type: 'all',
        sort_order: 7,
        cover_url: '/uploads/2026/04/toy-updated.png',
        is_enabled: true
      })
    )

    expect(updateCategory.status).toBe(200)
    expect(updateCategory.body.data.item.name).toBe('互动玩具')

    const createStore = await withAdminKey(
      ctx,
      request(app).post('/api/admin/stores').send({
        name: 'PetLife 生活馆 · 浦东店',
        phone: '021-68551234',
        address: '上海市浦东新区世纪大道 1001 号',
        business_hours: '10:00-21:00',
        cover_url: '/uploads/2026/04/store.png',
        status: 'active'
      })
    )

    expect(createStore.status).toBe(201)
    expect(createStore.body.data.item.name).toContain('浦东店')

    const updateStore = await withAdminKey(
      ctx,
      request(app).put(`/api/admin/stores/${createStore.body.data.item.id}`).send({
        name: 'PetLife 生活馆 · 浦东世纪店',
        phone: '021-68551234',
        address: '上海市浦东新区世纪大道 1001 号',
        business_hours: '10:00-22:00',
        cover_url: '/uploads/2026/04/store-2.png',
        status: 'inactive'
      })
    )

    expect(updateStore.status).toBe(200)
    expect(updateStore.body.data.item.status).toBe('inactive')

    const createTimeSlot = await withAdminKey(
      ctx,
      request(app).post('/api/admin/time-slots').send({
        label: '18:00',
        start_time: '18:00',
        end_time: '19:00',
        capacity: 4,
        sort_order: 9,
        is_enabled: true
      })
    )

    expect(createTimeSlot.status).toBe(201)
    expect(createTimeSlot.body.data.item.capacity).toBe(4)

    const updateTimeSlot = await withAdminKey(
      ctx,
      request(app).put(`/api/admin/time-slots/${createTimeSlot.body.data.item.id}`).send({
        label: '18:30',
        start_time: '18:30',
        end_time: '19:30',
        capacity: 2,
        sort_order: 10,
        is_enabled: false
      })
    )

    expect(updateTimeSlot.status).toBe(200)
    expect(updateTimeSlot.body.data.item.is_enabled).toBe(false)

    const deleteCategory = await withAdminKey(
      ctx,
      request(app).delete(`/api/admin/categories/${createCategory.body.data.item.id}`)
    )
    const deleteStore = await withAdminKey(
      ctx,
      request(app).delete(`/api/admin/stores/${createStore.body.data.item.id}`)
    )
    const deleteTimeSlot = await withAdminKey(
      ctx,
      request(app).delete(`/api/admin/time-slots/${createTimeSlot.body.data.item.id}`)
    )

    expect(deleteCategory.status).toBe(200)
    expect(deleteStore.status).toBe(200)
    expect(deleteTimeSlot.status).toBe(200)

    const categoriesResponse = await withAdminKey(ctx, request(app).get('/api/admin/categories'))
    const storesResponse = await withAdminKey(ctx, request(app).get('/api/admin/stores'))
    const timeSlotsResponse = await withAdminKey(ctx, request(app).get('/api/admin/time-slots'))

    expect(categoriesResponse.body.data.list.map((item) => item.id)).not.toContain(
      createCategory.body.data.item.id
    )
    expect(storesResponse.body.data.list.map((item) => item.id)).not.toContain(
      createStore.body.data.item.id
    )
    expect(timeSlotsResponse.body.data.list.map((item) => item.id)).not.toContain(
      createTimeSlot.body.data.item.id
    )
  })

  it('creates and updates products and services', async () => {
    const { app, ctx } = createSeededApp(cleanups)

    const createProduct = await withAdminKey(
      ctx,
      request(app).post('/api/admin/products').send({
        category_id: 'cat-snack',
        title: '冻干鹌鹑小食',
        subtitle: '高蛋白 · 训练奖励',
        pet_type: 'cat',
        price: 88,
        member_price: 76,
        original_price: 98,
        stock: 36,
        stock_status: 'inStock',
        badge: '新品',
        tags: ['高蛋白', '无添加'],
        specs: [{ group: '规格', options: ['80g'] }],
        summary: ['鹌鹑整肉冻干', '适合作为训练奖励'],
        suitable_text: '适合 3 月龄以上猫咪',
        cover_url: '/uploads/2026/04/product.png',
        status: 'active',
        image_urls: ['/uploads/2026/04/product-1.png', '/uploads/2026/04/product-2.png']
      })
    )

    expect(createProduct.status).toBe(201)
    expect(createProduct.body.data.item.title).toBe('冻干鹌鹑小食')
    expect(createProduct.body.data.item.image_urls).toHaveLength(2)

    const updateProduct = await withAdminKey(
      ctx,
      request(app).put(`/api/admin/products/${createProduct.body.data.item.id}`).send({
        category_id: 'cat-snack',
        title: '冻干鹌鹑小食 · 升级版',
        subtitle: '高蛋白 · 训练奖励',
        pet_type: 'cat',
        price: 92,
        member_price: 79,
        original_price: 108,
        stock: 20,
        stock_status: 'inStock',
        badge: '热卖',
        tags: ['高蛋白', '无添加'],
        specs: [{ group: '规格', options: ['80g', '120g'] }],
        summary: ['鹌鹑整肉冻干', '适合作为训练奖励'],
        suitable_text: '适合 3 月龄以上猫咪',
        cover_url: '/uploads/2026/04/product-updated.png',
        status: 'inactive',
        image_urls: ['/uploads/2026/04/product-3.png']
      })
    )

    expect(updateProduct.status).toBe(200)
    expect(updateProduct.body.data.item.title).toContain('升级版')
    expect(updateProduct.body.data.item.status).toBe('inactive')
    expect(updateProduct.body.data.item.image_urls).toEqual(['/uploads/2026/04/product-3.png'])

    const createService = await withAdminKey(
      ctx,
      request(app).post('/api/admin/services').send({
        title: '深层护理 · 换毛季套餐',
        subtitle: '深层清洁 · 顺毛护理',
        pet_type: 'all',
        price: 188,
        member_price: 168,
        original_price: 208,
        duration_minutes: 90,
        badge: '限定',
        highlights: ['深层清洁', '顺毛精华'],
        summary: ['短毛猫', '短毛犬 10kg 以内'],
        notice: ['请提前 15 分钟到店'],
        cover_url: '/uploads/2026/04/service.png',
        status: 'active',
        image_urls: ['/uploads/2026/04/service-1.png']
      })
    )

    expect(createService.status).toBe(201)
    expect(createService.body.data.item.title).toContain('换毛季')

    const updateService = await withAdminKey(
      ctx,
      request(app).put(`/api/admin/services/${createService.body.data.item.id}`).send({
        title: '深层护理 · 换毛季套餐 Plus',
        subtitle: '深层清洁 · 顺毛护理',
        pet_type: 'all',
        price: 198,
        member_price: 178,
        original_price: 228,
        duration_minutes: 100,
        badge: '限定',
        highlights: ['深层清洁', '顺毛精华'],
        summary: ['短毛猫', '短毛犬 10kg 以内'],
        notice: ['请提前 15 分钟到店'],
        cover_url: '/uploads/2026/04/service-updated.png',
        status: 'inactive',
        image_urls: ['/uploads/2026/04/service-2.png', '/uploads/2026/04/service-3.png']
      })
    )

    expect(updateService.status).toBe(200)
    expect(updateService.body.data.item.duration_minutes).toBe(100)
    expect(updateService.body.data.item.image_urls).toHaveLength(2)
  })

  it('applies conservative delete rules for referenced catalog records', async () => {
    const { app, ctx, db } = createSeededApp(cleanups)

    const deleteCategory = await withAdminKey(
      ctx,
      request(app).delete('/api/admin/categories/cat-food')
    )
    const deleteProduct = await withAdminKey(ctx, request(app).delete('/api/admin/products/p-001'))
    const deleteService = await withAdminKey(ctx, request(app).delete('/api/admin/services/s-001'))
    const deleteTimeSlot = await withAdminKey(ctx, request(app).delete('/api/admin/time-slots/t-2'))

    expect(deleteCategory.status).toBe(409)
    expect(deleteCategory.body.message).toBe('category has active products')

    expect(deleteProduct.status).toBe(200)
    expect(deleteProduct.body.data.item.status).toBe('inactive')
    expect(db.prepare('SELECT status FROM products WHERE id = ?').get('p-001').status).toBe('inactive')

    expect(deleteService.status).toBe(200)
    expect(deleteService.body.data.item.status).toBe('inactive')
    expect(db.prepare('SELECT status FROM services WHERE id = ?').get('s-001').status).toBe('inactive')

    expect(deleteTimeSlot.status).toBe(200)
    expect(deleteTimeSlot.body.data.item.is_enabled).toBe(false)
    expect(db.prepare('SELECT is_enabled FROM time_slots WHERE id = ?').get('t-2').is_enabled).toBe(0)
  })
})
