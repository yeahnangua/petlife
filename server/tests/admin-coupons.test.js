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

  return { app, ctx }
}

function withAdminKey(ctx, builder) {
  return builder.set('x-admin-key', ctx.adminKey)
}

describe('admin coupon apis', () => {
  const cleanups = []

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()()
    }
  })

  it('creates, updates, and lists coupon campaigns', async () => {
    const { app, ctx } = createSeededApp(cleanups)

    const createResponse = await withAdminKey(
      ctx,
      request(app).post('/api/admin/coupon-campaigns').send({
        name: '夏日护理券',
        description: '满 129 减 20',
        discount_amount: 20,
        min_order_amount: 129,
        total_limit: 100,
        valid_from: '2026-06-01 00:00:00',
        valid_to: '2026-08-31 23:59:59'
      })
    )

    expect(createResponse.status).toBe(201)
    expect(createResponse.body.data.item).toMatchObject({
      name: '夏日护理券',
      status: 'active',
      discount_amount: 20,
      min_order_amount: 129
    })

    const updateResponse = await withAdminKey(
      ctx,
      request(app)
        .put(`/api/admin/coupon-campaigns/${createResponse.body.data.item.id}`)
        .send({
          status: 'disabled',
          name: '夏日护理券',
          description: '满 129 减 20',
          discount_amount: 20,
          min_order_amount: 129,
          total_limit: 100,
          valid_from: '2026-06-01 00:00:00',
          valid_to: '2026-08-31 23:59:59'
        })
    )

    expect(updateResponse.status).toBe(200)
    expect(updateResponse.body.data.item.status).toBe('disabled')

    const listResponse = await withAdminKey(ctx, request(app).get('/api/admin/coupon-campaigns'))

    expect(listResponse.status).toBe(200)
    expect(listResponse.body.data.list.map((item) => item.name)).toContain('夏日护理券')
  })

  it('issues a campaign to a user and disables the issued coupon', async () => {
    const { app, ctx } = createSeededApp(cleanups)

    const issueResponse = await withAdminKey(
      ctx,
      request(app).post('/api/admin/coupon-campaigns/coupon_cart_199_35/issue').send({
        user_id: 'u_demo_001'
      })
    )

    expect(issueResponse.status).toBe(201)
    expect(issueResponse.body.data.item).toMatchObject({
      campaign_id: 'coupon_cart_199_35',
      user_id: 'u_demo_001',
      status: 'available'
    })

    const disableResponse = await withAdminKey(
      ctx,
      request(app).put(`/api/admin/user-coupons/${issueResponse.body.data.item.id}`).send({
        status: 'disabled'
      })
    )

    expect(disableResponse.status).toBe(200)
    expect(disableResponse.body.data.item.status).toBe('disabled')

    const listResponse = await withAdminKey(ctx, request(app).get('/api/admin/user-coupons?user_id=u_demo_001'))

    expect(listResponse.status).toBe(200)
    expect(listResponse.body.data.list.map((item) => item.id)).toContain(issueResponse.body.data.item.id)
  })
})
