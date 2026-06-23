import request from 'supertest'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { createDatabase } from '../src/db/index.js'
import { migrate } from '../src/db/migrate.js'
import { seed } from '../src/db/seed.js'
import { createTestContext } from './helpers/createTestContext.js'

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

  return { app, ctx, db }
}

describe('public catalog apis', () => {
  const cleanups = []

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()()
    }
  })

  it('returns only enabled categories', async () => {
    const { app, db } = createSeededApp(cleanups)
    db.prepare('UPDATE categories SET is_enabled = 0 WHERE id = ?').run('all-clean')

    const response = await request(app).get('/api/public/categories')

    expect(response.status).toBe(200)
    expect(response.body.data.list.map((item) => item.id)).toEqual([
      'cat-food',
      'cat-snack',
      'cat-litter',
      'all-toy',
      'all-travel',
      'all-care',
      'all-home'
    ])
  })

  it('filters and paginates products by categoryId, keyword, and petType', async () => {
    const { app } = createSeededApp(cleanups)

    const response = await request(app).get(
      '/api/public/products?categoryId=cat-snack&keyword=鸡肉&petType=cat&page=1&pageSize=1'
    )

    expect(response.status).toBe(200)
    expect(response.body.data.list).toHaveLength(1)
    expect(response.body.data.list[0].id).toBe('p-002')
    expect(response.body.data.pagination).toEqual({
      page: 1,
      pageSize: 1,
      total: 1,
      totalPages: 1
    })
  })

  it('returns product detail with ordered image list', async () => {
    const { app } = createSeededApp(cleanups)

    const response = await request(app).get('/api/public/products/p-001')

    expect(response.status).toBe(200)
    expect(response.body.data.item.id).toBe('p-001')
    expect(response.body.data.item.product_images).toHaveLength(1)
    expect(response.body.data.item.product_images[0].image_url).toContain(
      '/images/products/cat-food.svg'
    )
  })

  it('returns only active services for list and detail', async () => {
    const { app, db } = createSeededApp(cleanups)
    db.prepare('UPDATE services SET status = ? WHERE id = ?').run('inactive', 's-002')

    const listResponse = await request(app).get('/api/public/services')
    const detailResponse = await request(app).get('/api/public/services/s-002')

    expect(listResponse.status).toBe(200)
    expect(listResponse.body.data.list.map((item) => item.id)).toEqual(['s-001'])
    expect(detailResponse.status).toBe(404)
  })

  it('computes slot capacity usage and availability from bookings', async () => {
    const { app } = createSeededApp(cleanups)

    const response = await request(app).get(
      '/api/public/stores/store-1/slots?date=2026-04-10&serviceId=s-001'
    )

    expect(response.status).toBe(200)
    expect(response.body.data.list).toEqual([
      {
        id: 't-1',
        label: '10:00',
        capacity: 3,
        used: 0,
        remaining: 3,
        isAvailable: true
      },
      {
        id: 't-2',
        label: '11:30',
        capacity: 1,
        used: 1,
        remaining: 0,
        isAvailable: false
      },
      {
        id: 't-3',
        label: '14:30',
        capacity: 2,
        used: 0,
        remaining: 2,
        isAvailable: true
      }
    ])
  })
})
