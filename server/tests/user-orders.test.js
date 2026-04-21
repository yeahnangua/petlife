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

  return { app, db }
}

async function addProductToCart(app, payload) {
  const response = await request(app).post('/api/user/cart/items').send(payload)
  expect(response.status).toBe(200)
  return response.body.data.item
}

describe('user order apis', () => {
  const cleanups = []

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()()
    }
  })

  it('creates an order from selected valid cart items and persists order snapshots', async () => {
    const { app, db } = createSeededApp(cleanups)

    await addProductToCart(app, {
      product_id: 'p-002',
      spec_key: '120g',
      spec_label: '120g',
      quantity: 2
    })

    const createResponse = await request(app).post('/api/user/orders').send({
      address_id: 'addr_001',
      remark: '工作日请放前台'
    })

    expect(createResponse.status).toBe(201)
    expect(createResponse.body.data.order.status).toBe('pendingShipment')
    expect(createResponse.body.data.order.status_label).toBe('待发货')
    expect(createResponse.body.data.order.total_amount).toBe(352)
    expect(createResponse.body.data.order.receiver_name_snapshot).toBe('拾柒')
    expect(createResponse.body.data.order.items).toHaveLength(2)
    expect(createResponse.body.data.order.items.map((item) => item.product_title_snapshot)).toEqual([
      '鲜肉全价猫粮',
      '冻干鸡肉小食'
    ])

    const createdOrder = db
      .prepare(
        `
          SELECT status, status_label, total_amount, receiver_region_snapshot, receiver_address_snapshot
          FROM orders
          WHERE id = ?
        `
      )
      .get(createResponse.body.data.order.id)

    expect(createdOrder).toEqual({
      status: 'pendingShipment',
      status_label: '待发货',
      total_amount: 352,
      receiver_region_snapshot: '上海市 静安区 南京西路街道',
      receiver_address_snapshot: '梅园里小区 12 号 3B 室'
    })

    const orderItems = db
      .prepare(
        `
          SELECT product_id, spec_label_snapshot, unit_price_snapshot, quantity, line_total
          FROM order_items
          WHERE order_id = ?
          ORDER BY id ASC
        `
      )
      .all(createResponse.body.data.order.id)

    expect(orderItems).toEqual([
      {
        product_id: 'p-001',
        spec_label_snapshot: '3kg · 鸡肉',
        unit_price_snapshot: 248,
        quantity: 1,
        line_total: 248
      },
      {
        product_id: 'p-002',
        spec_label_snapshot: '120g',
        unit_price_snapshot: 52,
        quantity: 2,
        line_total: 104
      }
    ])

    expect(db.prepare('SELECT stock FROM products WHERE id = ?').get('p-001').stock).toBe(47)
    expect(db.prepare('SELECT stock FROM products WHERE id = ?').get('p-002').stock).toBe(118)

    const cartRows = db
      .prepare('SELECT id, product_id FROM cart_items WHERE user_id = ? ORDER BY id ASC')
      .all('u_demo_001')

    expect(cartRows).toEqual([{ id: 'ci_002', product_id: 'p-008' }])
  })

  it('lists orders and returns order detail with item snapshots', async () => {
    const { app } = createSeededApp(cleanups)

    const listResponse = await request(app).get('/api/user/orders')

    expect(listResponse.status).toBe(200)
    expect(listResponse.body.data.list).toHaveLength(1)
    expect(listResponse.body.data.list[0]).toMatchObject({
      id: 'order_001',
      order_no: 'PO20260402013',
      status: 'completed',
      status_label: '已完成',
      total_amount: 248,
      item_count: 1
    })
    expect(listResponse.body.data.list[0].items).toHaveLength(1)

    const detailResponse = await request(app).get('/api/user/orders/order_001')

    expect(detailResponse.status).toBe(200)
    expect(detailResponse.body.data.order).toMatchObject({
      id: 'order_001',
      receiver_name_snapshot: '拾柒',
      receiver_phone_snapshot: '13527882788',
      receiver_region_snapshot: '上海市 静安区 南京西路街道',
      receiver_address_snapshot: '梅园里小区 12 号 3B 室',
      remark: '工作日请放前台'
    })
    expect(detailResponse.body.data.order.items).toEqual([
      expect.objectContaining({
        product_id: 'p-001',
        product_title_snapshot: '鲜肉全价猫粮',
        spec_label_snapshot: '3kg · 鸡肉',
        unit_price_snapshot: 248,
        quantity: 1,
        line_total: 248
      })
    ])
  })

  it('returns 409 and leaves data unchanged when selected cart quantity exceeds stock', async () => {
    const { app, db } = createSeededApp(cleanups)

    const updateResponse = await request(app).put('/api/user/cart/items/ci_001').send({
      quantity: 49,
      selected: true
    })

    expect(updateResponse.status).toBe(200)

    const createResponse = await request(app).post('/api/user/orders').send({
      address_id: 'addr_001',
      remark: '库存不足测试'
    })

    expect(createResponse.status).toBe(409)
    expect(createResponse.body.message).toBe('product stock is insufficient')
    expect(db.prepare('SELECT COUNT(*) AS count FROM orders').get().count).toBe(1)
    expect(db.prepare('SELECT stock FROM products WHERE id = ?').get('p-001').stock).toBe(48)
    expect(db.prepare('SELECT quantity FROM cart_items WHERE id = ?').get('ci_001').quantity).toBe(49)
  })

  it('returns 409 when combined selected specs of the same product exceed stock', async () => {
    const { app, db } = createSeededApp(cleanups)

    const updateResponse = await request(app).put('/api/user/cart/items/ci_001').send({
      quantity: 30,
      selected: true
    })

    expect(updateResponse.status).toBe(200)

    await addProductToCart(app, {
      product_id: 'p-001',
      spec_key: '6kg|牛肉',
      spec_label: '6kg · 牛肉',
      quantity: 19
    })

    const createResponse = await request(app).post('/api/user/orders').send({
      address_id: 'addr_001',
      remark: '组合规格库存测试'
    })

    expect(createResponse.status).toBe(409)
    expect(createResponse.body.message).toBe('product stock is insufficient')
    expect(db.prepare('SELECT COUNT(*) AS count FROM orders').get().count).toBe(1)
    expect(db.prepare('SELECT stock FROM products WHERE id = ?').get('p-001').stock).toBe(48)
  })

  it('cancels a pending shipment order and restores product stock', async () => {
    const { app, db } = createSeededApp(cleanups)

    const createResponse = await request(app).post('/api/user/orders').send({
      address_id: 'addr_001',
      remark: '请在周末配送'
    })

    expect(createResponse.status).toBe(201)

    const cancelResponse = await request(app).post(
      `/api/user/orders/${createResponse.body.data.order.id}/cancel`
    )

    expect(cancelResponse.status).toBe(200)
    expect(cancelResponse.body.data.order.status).toBe('cancelled')
    expect(cancelResponse.body.data.order.status_label).toBe('已取消')
    expect(db.prepare('SELECT stock FROM products WHERE id = ?').get('p-001').stock).toBe(48)

    const detailResponse = await request(app).get(
      `/api/user/orders/${createResponse.body.data.order.id}`
    )

    expect(detailResponse.status).toBe(200)
    expect(detailResponse.body.data.order.status).toBe('cancelled')
  })
})
