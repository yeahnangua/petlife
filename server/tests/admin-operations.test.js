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

  return { app, db, ctx }
}

function withAdminKey(ctx, builder) {
  return builder.set('x-admin-key', ctx.adminKey)
}

describe('admin order and booking operations apis', () => {
  const cleanups = []

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()()
    }
  })

  it('lists orders and returns order detail for administrators', async () => {
    const { app, ctx } = createSeededApp(cleanups)

    const listResponse = await withAdminKey(ctx, request(app).get('/api/admin/orders'))

    expect(listResponse.status).toBe(200)
    expect(listResponse.body.data.list).toHaveLength(1)
    expect(listResponse.body.data.list[0]).toMatchObject({
      id: 'order_001',
      user_id: 'u_demo_001',
      status: 'completed',
      status_label: '已完成',
      total_amount: 248
    })

    const detailResponse = await withAdminKey(ctx, request(app).get('/api/admin/orders/order_001'))

    expect(detailResponse.status).toBe(200)
    expect(detailResponse.body.data.order).toMatchObject({
      id: 'order_001',
      order_no: 'PO20260402013',
      receiver_name_snapshot: '拾柒',
      receiver_phone_snapshot: '13527882788'
    })
    expect(detailResponse.body.data.order.items).toEqual([
      expect.objectContaining({
        product_id: 'p-001',
        product_title_snapshot: '鲜肉全价猫粮',
        quantity: 1
      })
    ])
  })

  it('lists bookings and returns booking detail for administrators', async () => {
    const { app, ctx } = createSeededApp(cleanups)

    const listResponse = await withAdminKey(ctx, request(app).get('/api/admin/bookings'))

    expect(listResponse.status).toBe(200)
    expect(listResponse.body.data.list).toHaveLength(1)
    expect(listResponse.body.data.list[0]).toMatchObject({
      id: 'booking_001',
      user_id: 'u_demo_001',
      status: 'completed',
      status_label: '已完成',
      service_title_snapshot: '基础洗护 · 标准套餐'
    })

    const detailResponse = await withAdminKey(
      ctx,
      request(app).get('/api/admin/bookings/booking_001')
    )

    expect(detailResponse.status).toBe(200)
    expect(detailResponse.body.data.booking).toMatchObject({
      id: 'booking_001',
      pet_name_snapshot: '橘子',
      store_name_snapshot: 'PetLife 生活馆 · 静安寺店',
      time_slot_label_snapshot: '11:30'
    })
  })

  it('updates order status to completed or cancelled and restores stock on cancellation', async () => {
    const { app, db, ctx } = createSeededApp(cleanups)

    const pendingOrderResponse = await request(app).post('/api/user/orders').send({
      address_id: 'addr_001',
      remark: '管理员改状态测试'
    })

    expect(pendingOrderResponse.status).toBe(201)
    expect(db.prepare('SELECT stock FROM products WHERE id = ?').get('p-001').stock).toBe(47)

    const completeResponse = await withAdminKey(
      ctx,
      request(app)
        .post(`/api/admin/orders/${pendingOrderResponse.body.data.order.id}/status`)
        .send({ status: 'completed' })
    )

    expect(completeResponse.status).toBe(200)
    expect(completeResponse.body.data.order.status).toBe('completed')
    expect(completeResponse.body.data.order.status_label).toBe('已完成')

    const reseededOrderContext = createSeededApp(cleanups)
    const cancelCreateResponse = await request(reseededOrderContext.app).post('/api/user/orders').send({
      address_id: 'addr_001',
      remark: '管理员取消订单测试'
    })

    expect(cancelCreateResponse.status).toBe(201)
    expect(reseededOrderContext.db.prepare('SELECT stock FROM products WHERE id = ?').get('p-001').stock).toBe(47)

    const cancelResponse = await withAdminKey(
      reseededOrderContext.ctx,
      request(reseededOrderContext.app)
        .post(`/api/admin/orders/${cancelCreateResponse.body.data.order.id}/status`)
        .send({ status: 'cancelled' })
    )

    expect(cancelResponse.status).toBe(200)
    expect(cancelResponse.body.data.order.status).toBe('cancelled')
    expect(reseededOrderContext.db.prepare('SELECT stock FROM products WHERE id = ?').get('p-001').stock).toBe(48)
  })

  it('updates booking status to completed or cancelled', async () => {
    const { app, ctx } = createSeededApp(cleanups)

    const createResponse = await request(app).post('/api/user/bookings').send({
      pet_id: 'pet_001',
      service_id: 's-001',
      store_id: 'store-1',
      time_slot_id: 't-1',
      booking_date: '2026-04-24',
      contact_phone: '13527882788',
      note: '管理员预约改状态测试'
    })

    expect(createResponse.status).toBe(201)

    const completeResponse = await withAdminKey(
      ctx,
      request(app)
        .post(`/api/admin/bookings/${createResponse.body.data.booking.id}/status`)
        .send({ status: 'completed' })
    )

    expect(completeResponse.status).toBe(200)
    expect(completeResponse.body.data.booking.status).toBe('completed')
    expect(completeResponse.body.data.booking.status_label).toBe('已完成')

    const secondCreateResponse = await request(app).post('/api/user/bookings').send({
      pet_id: 'pet_001',
      service_id: 's-001',
      store_id: 'store-2',
      time_slot_id: 't-3',
      booking_date: '2026-04-25',
      contact_phone: '13527882788',
      note: '管理员取消预约测试'
    })

    expect(secondCreateResponse.status).toBe(201)

    const cancelResponse = await withAdminKey(
      ctx,
      request(app)
        .post(`/api/admin/bookings/${secondCreateResponse.body.data.booking.id}/status`)
        .send({ status: 'cancelled' })
    )

    expect(cancelResponse.status).toBe(200)
    expect(cancelResponse.body.data.booking.status).toBe('cancelled')
    expect(cancelResponse.body.data.booking.status_label).toBe('已取消')
  })
})
