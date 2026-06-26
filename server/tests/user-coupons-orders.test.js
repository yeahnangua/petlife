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

  return { app, db, ctx, authHeader: createDemoUserAuthHeader(db) }
}

function withAdminKey(ctx, builder) {
  return builder.set('x-admin-key', ctx.adminKey)
}

describe('user coupons and order redemption', () => {
  const cleanups = []

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()()
    }
  })

  it('lists account-owned coupons with checkout availability', async () => {
    const { app, authHeader } = createSeededApp(cleanups)

    const response = await request(app)
      .get('/api/user/coupons?subtotal=248')
      .set(authHeader)

    expect(response.status).toBe(200)
    expect(response.body.data.list).toEqual([
      expect.objectContaining({
        id: 'uc_demo_001',
        campaign_id: 'coupon_cart_199_35',
        name: '购物车唤醒券',
        discount_amount: 35,
        min_order_amount: 199,
        status: 'available',
        available: true,
        unavailable_reason: ''
      })
    ])
  })

  it('filters checkout coupons by target while keeping universal coupons', async () => {
    const { app, ctx, authHeader } = createSeededApp(cleanups)

    const serviceCampaign = await withAdminKey(
      ctx,
      request(app).post('/api/admin/coupon-campaigns').send({
        name: '预约专享券',
        description: '预约服务满 99 减 20',
        discount_amount: 20,
        min_order_amount: 99,
        total_limit: 100,
        target_type: 'service',
        valid_from: '2026-06-01 00:00:00',
        valid_to: '2026-12-31 23:59:59'
      })
    )
    const universalCampaign = await withAdminKey(
      ctx,
      request(app).post('/api/admin/coupon-campaigns').send({
        name: '全场通用券',
        description: '满 99 减 10',
        discount_amount: 10,
        min_order_amount: 99,
        total_limit: 100,
        target_type: 'universal',
        valid_from: '2026-06-01 00:00:00',
        valid_to: '2026-12-31 23:59:59'
      })
    )
    await withAdminKey(
      ctx,
      request(app).post(`/api/admin/coupon-campaigns/${serviceCampaign.body.data.item.id}/issue`).send({
        user_id: 'u_demo_001'
      })
    )
    await withAdminKey(
      ctx,
      request(app).post(`/api/admin/coupon-campaigns/${universalCampaign.body.data.item.id}/issue`).send({
        user_id: 'u_demo_001'
      })
    )

    const productResponse = await request(app)
      .get('/api/user/coupons?subtotal=248&target=product')
      .set(authHeader)
    const serviceResponse = await request(app)
      .get('/api/user/coupons?subtotal=108&target=service')
      .set(authHeader)

    expect(productResponse.status).toBe(200)
    expect(productResponse.body.data.list.map((item) => item.target_type)).toEqual(expect.arrayContaining(['universal', 'product']))
    expect(productResponse.body.data.list.map((item) => item.target_type)).toHaveLength(2)
    expect(serviceResponse.status).toBe(200)
    expect(serviceResponse.body.data.list.map((item) => item.target_type)).toEqual(expect.arrayContaining(['universal', 'service']))
    expect(serviceResponse.body.data.list.map((item) => item.target_type)).toHaveLength(2)
  })

  it('applies a valid coupon when creating an order and marks it used', async () => {
    const { app, db, authHeader } = createSeededApp(cleanups)

    const createResponse = await request(app)
      .post('/api/user/orders')
      .set(authHeader)
      .send({
        address_id: 'addr_001',
        coupon_id: 'uc_demo_001',
        remark: '优惠券核销测试'
      })

    expect(createResponse.status).toBe(201)
    expect(createResponse.body.data.order).toMatchObject({
      subtotal_amount: 248,
      shipping_fee: 12,
      discount_amount: 35,
      payable_amount: 225,
      total_amount: 213,
      coupon_id: 'uc_demo_001',
      coupon_name_snapshot: '购物车唤醒券'
    })

    const coupon = db
      .prepare('SELECT status, used_order_id FROM user_coupons WHERE id = ?')
      .get('uc_demo_001')

    expect(coupon).toEqual({
      status: 'used',
      used_order_id: createResponse.body.data.order.id
    })

    await request(app).post('/api/user/cart/items').set(authHeader).send({
      product_id: 'p-002',
      spec_key: '120g',
      spec_label: '120g',
      quantity: 4
    })

    const secondResponse = await request(app)
      .post('/api/user/orders')
      .set(authHeader)
      .send({
        address_id: 'addr_001',
        coupon_id: 'uc_demo_001',
        remark: '重复核销测试'
      })

    expect(secondResponse.status).toBe(409)
    expect(secondResponse.body.message).toBe('coupon is unavailable')
  })

  it('rejects a service-only coupon when creating a product order', async () => {
    const { app, ctx, authHeader } = createSeededApp(cleanups)

    const createCampaignResponse = await withAdminKey(
      ctx,
      request(app).post('/api/admin/coupon-campaigns').send({
        name: '预约专享券',
        description: '预约服务满 99 减 20',
        discount_amount: 20,
        min_order_amount: 99,
        total_limit: 100,
        target_type: 'service',
        valid_from: '2026-06-01 00:00:00',
        valid_to: '2026-12-31 23:59:59'
      })
    )
    const issueResponse = await withAdminKey(
      ctx,
      request(app).post(`/api/admin/coupon-campaigns/${createCampaignResponse.body.data.item.id}/issue`).send({
        user_id: 'u_demo_001'
      })
    )

    const createResponse = await request(app)
      .post('/api/user/orders')
      .set(authHeader)
      .send({
        address_id: 'addr_001',
        coupon_id: issueResponse.body.data.item.id,
        remark: '错误券类型测试'
      })

    expect(createResponse.status).toBe(409)
    expect(createResponse.body.message).toBe('coupon target is not supported')
  })
})
