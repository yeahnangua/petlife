import request from 'supertest'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { createDatabase } from '../src/db/index.js'
import { migrate } from '../src/db/migrate.js'
import { seed } from '../src/db/seed.js'
import { createDemoUserAuthHeader } from './helpers/auth.js'
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

  return { app, authHeader: createDemoUserAuthHeader(db) }
}

describe('cart apis', () => {
  const cleanups = []

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()()
    }
  })

  it('merges quantity when adding the same product and spec key again', async () => {
    const { app, authHeader } = createSeededApp(cleanups)

    const addResponse = await request(app).post('/api/user/cart/items').set(authHeader).send({
      product_id: 'p-001',
      spec_key: '3kg|鸡肉',
      spec_label: '3kg · 鸡肉',
      quantity: 2
    })

    expect(addResponse.status).toBe(200)
    expect(addResponse.body.data.item.quantity).toBe(3)

    const cartResponse = await request(app).get('/api/user/cart').set(authHeader)
    const duplicates = cartResponse.body.data.list.filter(
      (item) => item.productId === 'p-001' && item.specKey === '3kg|鸡肉'
    )

    expect(duplicates).toHaveLength(1)
    expect(duplicates[0].quantity).toBe(3)
  })

  it('marks sold out items as invalid when reading the cart', async () => {
    const { app, authHeader } = createSeededApp(cleanups)

    const response = await request(app).get('/api/user/cart').set(authHeader)
    const invalidItem = response.body.data.list.find((item) => item.productId === 'p-008')

    expect(response.status).toBe(200)
    expect(invalidItem.isValid).toBe(false)
    expect(invalidItem.invalidReason).toBe('商品已售罄')
    expect(response.body.data.summary.invalidCount).toBe(1)
  })

  it('removes all invalid items in one operation', async () => {
    const { app, authHeader } = createSeededApp(cleanups)

    const deleteResponse = await request(app).delete('/api/user/cart/invalid-items').set(authHeader)

    expect(deleteResponse.status).toBe(200)
    expect(deleteResponse.body.data.removedCount).toBe(1)

    const cartResponse = await request(app).get('/api/user/cart').set(authHeader)
    expect(cartResponse.body.data.list.every((item) => item.isValid)).toBe(true)
  })

  it('updates quantity and selected state for an existing cart item', async () => {
    const { app, authHeader } = createSeededApp(cleanups)

    const cartResponse = await request(app).get('/api/user/cart').set(authHeader)
    const item = cartResponse.body.data.list.find((entry) => entry.productId === 'p-001')

    const updateResponse = await request(app).put(`/api/user/cart/items/${item.id}`).set(authHeader).send({
      quantity: 4,
      selected: false
    })

    expect(updateResponse.status).toBe(200)
    expect(updateResponse.body.data.item.quantity).toBe(4)
    expect(updateResponse.body.data.item.selected).toBe(false)

    const refreshedCart = await request(app).get('/api/user/cart').set(authHeader)
    expect(refreshedCart.body.data.summary.selectedCount).toBe(0)
    expect(refreshedCart.body.data.summary.totalAmount).toBe(0)
  })
})
