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

describe('user booking apis', () => {
  const cleanups = []

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()()
    }
  })

  it('creates a booking for a valid pet, service, store, slot, and date', async () => {
    const { app, db } = createSeededApp(cleanups)

    const createResponse = await request(app).post('/api/user/bookings').send({
      pet_id: 'pet_001',
      service_id: 's-001',
      store_id: 'store-1',
      time_slot_id: 't-1',
      booking_date: '2026-04-22',
      contact_phone: '13527882788',
      note: '猫咪比较敏感，请轻一点。'
    })

    expect(createResponse.status).toBe(201)
    expect(createResponse.body.data.booking.status).toBe('pendingService')
    expect(createResponse.body.data.booking.status_label).toBe('待服务')
    expect(createResponse.body.data.booking.booking_no).toMatch(/^BK\d+/)
    expect(createResponse.body.data.booking.service_price_snapshot).toBe(108)
    expect(createResponse.body.data.booking.store_name_snapshot).toBe('PetLife 生活馆 · 静安寺店')
    expect(createResponse.body.data.booking.time_slot_label_snapshot).toBe('10:00')

    const createdRow = db
      .prepare(
        `
          SELECT service_title_snapshot, store_name_snapshot, time_slot_label_snapshot, status
          FROM bookings
          WHERE id = ?
        `
      )
      .get(createResponse.body.data.booking.id)

    expect(createdRow).toEqual({
      service_title_snapshot: '基础洗护 · 标准套餐',
      store_name_snapshot: 'PetLife 生活馆 · 静安寺店',
      time_slot_label_snapshot: '10:00',
      status: 'pendingService'
    })
  })

  it('returns 409 when the target slot is already full', async () => {
    const { app, db } = createSeededApp(cleanups)

    const createResponse = await request(app).post('/api/user/bookings').send({
      pet_id: 'pet_002',
      service_id: 's-001',
      store_id: 'store-1',
      time_slot_id: 't-2',
      booking_date: '2026-04-10',
      contact_phone: '13527882788',
      note: '预约满额测试'
    })

    expect(createResponse.status).toBe(409)
    expect(createResponse.body.message).toBe('time slot is full')
    expect(db.prepare('SELECT COUNT(*) AS count FROM bookings').get().count).toBe(1)
  })

  it('lists bookings and returns booking detail snapshots', async () => {
    const { app } = createSeededApp(cleanups)

    const listResponse = await request(app).get('/api/user/bookings')

    expect(listResponse.status).toBe(200)
    expect(listResponse.body.data.list).toHaveLength(1)
    expect(listResponse.body.data.list[0]).toMatchObject({
      id: 'booking_001',
      booking_no: 'BK20260410002',
      pet_name_snapshot: '橘子',
      service_title_snapshot: '基础洗护 · 标准套餐',
      store_name_snapshot: 'PetLife 生活馆 · 静安寺店',
      time_slot_label_snapshot: '11:30',
      booking_date: '2026-04-10',
      status: 'completed',
      status_label: '已完成'
    })

    const detailResponse = await request(app).get('/api/user/bookings/booking_001')

    expect(detailResponse.status).toBe(200)
    expect(detailResponse.body.data.booking).toMatchObject({
      id: 'booking_001',
      pet_id: 'pet_001',
      service_id: 's-001',
      store_id: 'store-1',
      time_slot_id: 't-2',
      contact_phone: '13527882788',
      note: '猫咪胆小，请轻声安抚。'
    })
  })

  it('cancels a pending booking and marks it as cancelled', async () => {
    const { app } = createSeededApp(cleanups)

    const createResponse = await request(app).post('/api/user/bookings').send({
      pet_id: 'pet_001',
      service_id: 's-001',
      store_id: 'store-2',
      time_slot_id: 't-3',
      booking_date: '2026-04-23',
      contact_phone: '13527882788',
      note: '取消预约测试'
    })

    expect(createResponse.status).toBe(201)

    const cancelResponse = await request(app).post(
      `/api/user/bookings/${createResponse.body.data.booking.id}/cancel`
    )

    expect(cancelResponse.status).toBe(200)
    expect(cancelResponse.body.data.booking.status).toBe('cancelled')
    expect(cancelResponse.body.data.booking.status_label).toBe('已取消')

    const detailResponse = await request(app).get(
      `/api/user/bookings/${createResponse.body.data.booking.id}`
    )

    expect(detailResponse.status).toBe(200)
    expect(detailResponse.body.data.booking.status).toBe('cancelled')
  })
})
