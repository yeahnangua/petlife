import { existsSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { loadEnv } from '../src/config/env.js'
import { createDatabase } from '../src/db/index.js'
import { migrate } from '../src/db/migrate.js'
import { seed } from '../src/db/seed.js'
import { createTestContext } from './helpers/createTestContext.js'

const expectedTables = [
  'addresses',
  'bookings',
  'cart_items',
  'categories',
  'order_items',
  'orders',
  'pets',
  'product_images',
  'products',
  'service_images',
  'services',
  'stores',
  'time_slots',
  'users'
]

function getTableNames(db) {
  return db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    .all()
    .map((row) => row.name)
}

function getSeedSnapshot(db) {
  return {
    userIds: db.prepare('SELECT id FROM users ORDER BY id').all().map((row) => row.id),
    addressIds: db.prepare('SELECT id FROM addresses ORDER BY id').all().map((row) => row.id),
    petIds: db.prepare('SELECT id FROM pets ORDER BY id').all().map((row) => row.id),
    categoryCount: db.prepare('SELECT COUNT(*) AS count FROM categories').get().count,
    productIds: db.prepare('SELECT id FROM products ORDER BY id').all().map((row) => row.id),
    serviceIds: db.prepare('SELECT id FROM services ORDER BY id').all().map((row) => row.id),
    storeIds: db.prepare('SELECT id FROM stores ORDER BY id').all().map((row) => row.id),
    slotIds: db.prepare('SELECT id FROM time_slots ORDER BY id').all().map((row) => row.id),
    cartItemCount: db.prepare('SELECT COUNT(*) AS count FROM cart_items').get().count,
    orderIds: db.prepare('SELECT id FROM orders ORDER BY id').all().map((row) => row.id),
    bookingIds: db.prepare('SELECT id FROM bookings ORDER BY id').all().map((row) => row.id)
  }
}

describe('database bootstrap', () => {
  const cleanups = []

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()()
    }
  })

  it('creates all core tables with foreign keys enabled', () => {
    const ctx = createTestContext()
    cleanups.push(() => ctx.cleanup())

    const db = createDatabase(ctx.dbPath)
    cleanups.push(() => db.close())

    migrate(db)

    expect(existsSync(ctx.dbPath)).toBe(true)
    expect(ctx.dbPath).not.toBe(loadEnv().dbPath)
    expect(db.pragma('foreign_keys', { simple: true })).toBe(1)
    expect(getTableNames(db)).toEqual(expectedTables)
  })

  it('seeds deterministic demo entities for all major business domains', () => {
    const ctx = createTestContext()
    cleanups.push(() => ctx.cleanup())

    const db = createDatabase(ctx.dbPath)
    cleanups.push(() => db.close())

    migrate(db)
    seed(db)

    expect(getSeedSnapshot(db)).toEqual({
      userIds: ['u_demo_001'],
      addressIds: ['addr_001'],
      petIds: ['pet_001', 'pet_002'],
      categoryCount: 8,
      productIds: [
        'p-001',
        'p-002',
        'p-003',
        'p-004',
        'p-005',
        'p-006',
        'p-007',
        'p-008',
        'p-009',
        'p-010',
        'p-011',
        'p-012',
        'p-013',
        'p-014'
      ],
      serviceIds: ['s-001', 's-002'],
      storeIds: ['store-1', 'store-2'],
      slotIds: ['t-1', 't-2', 't-3'],
      cartItemCount: 2,
      orderIds: ['order_001'],
      bookingIds: ['booking_001']
    })
  })

  it('keeps the seeded dataset stable across repeated runs', () => {
    const ctx = createTestContext()
    cleanups.push(() => ctx.cleanup())

    const db = createDatabase(ctx.dbPath)
    cleanups.push(() => db.close())

    migrate(db)
    seed(db)
    const first = getSeedSnapshot(db)

    seed(db)
    const second = getSeedSnapshot(db)

    expect(second).toEqual(first)
  })
})
