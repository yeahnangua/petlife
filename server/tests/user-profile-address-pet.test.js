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

  return { app, db, authHeader: createDemoUserAuthHeader(db) }
}

describe('user profile, address, and pet apis', () => {
  const cleanups = []

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()()
    }
  })

  it('returns the fixed demo user profile', async () => {
    const { app, authHeader } = createSeededApp(cleanups)

    const response = await request(app).get('/api/user/profile').set(authHeader)

    expect(response.status).toBe(200)
    expect(response.body.data.profile.id).toBe('u_demo_001')
    expect(response.body.data.profile.nickname).toBe('拾柒')
  })

  it('clears the previous default address when creating a new default one', async () => {
    const { app, authHeader } = createSeededApp(cleanups)

    const createResponse = await request(app).post('/api/user/addresses').set(authHeader).send({
      receiver_name: '拾柒',
      receiver_phone: '13527882788',
      region: '上海市 徐汇区 龙华街道',
      detail_address: '龙华中路 298 号某写字楼 18F',
      tag: '公司',
      is_default: true
    })

    expect(createResponse.status).toBe(201)

    const listResponse = await request(app).get('/api/user/addresses').set(authHeader)
    const defaultAddresses = listResponse.body.data.list.filter((item) => item.is_default)

    expect(defaultAddresses).toHaveLength(1)
    expect(defaultAddresses[0].detail_address).toContain('龙华中路 298 号某写字楼 18F')
  })

  it('switches the default address when updating an existing record', async () => {
    const { app, authHeader } = createSeededApp(cleanups)

    const createResponse = await request(app).post('/api/user/addresses').set(authHeader).send({
      receiver_name: '拾柒',
      receiver_phone: '13527882788',
      region: '上海市 徐汇区 龙华街道',
      detail_address: '龙华中路 298 号某写字楼 18F',
      tag: '公司',
      is_default: false
    })

    const addressId = createResponse.body.data.item.id

    const updateResponse = await request(app).put(`/api/user/addresses/${addressId}`).set(authHeader).send({
      receiver_name: '拾柒',
      receiver_phone: '13527882788',
      region: '上海市 徐汇区 龙华街道',
      detail_address: '龙华中路 298 号某写字楼 18F',
      tag: '公司',
      is_default: true
    })

    expect(updateResponse.status).toBe(200)

    const listResponse = await request(app).get('/api/user/addresses').set(authHeader)
    const defaultAddresses = listResponse.body.data.list.filter((item) => item.is_default)

    expect(defaultAddresses).toHaveLength(1)
    expect(defaultAddresses[0].id).toBe(addressId)
  })

  it('creates, updates, and deletes pets with array fields preserved', async () => {
    const { app, authHeader } = createSeededApp(cleanups)

    const createResponse = await request(app).post('/api/user/pets').set(authHeader).send({
      name: 'Mocha',
      type: 'dog',
      breed: '比熊犬',
      gender: 'male',
      birthday: '2022-02-14',
      weight: 6.5,
      neutered: false,
      allergies: ['鸡肉', '谷物'],
      preferences: ['精致美容', '短期寄养'],
      avatar_url: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=240&q=70',
      color: '#B58463'
    })

    expect(createResponse.status).toBe(201)
    expect(createResponse.body.data.item.allergies).toEqual(['鸡肉', '谷物'])

    const petId = createResponse.body.data.item.id

    const updateResponse = await request(app).put(`/api/user/pets/${petId}`).set(authHeader).send({
      name: 'Mocha',
      type: 'dog',
      breed: '比熊犬',
      gender: 'male',
      birthday: '2022-02-14',
      weight: 6.8,
      neutered: true,
      allergies: [],
      preferences: ['短期寄养'],
      avatar_url: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=240&q=70',
      color: '#B58463'
    })

    expect(updateResponse.status).toBe(200)
    expect(updateResponse.body.data.item.neutered).toBe(true)
    expect(updateResponse.body.data.item.preferences).toEqual(['短期寄养'])

    const deleteResponse = await request(app).delete(`/api/user/pets/${petId}`).set(authHeader)
    expect(deleteResponse.status).toBe(200)

    const listResponse = await request(app).get('/api/user/pets').set(authHeader)
    expect(listResponse.body.data.list.map((item) => item.id)).not.toContain(petId)
  })
})
