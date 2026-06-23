import request from 'supertest'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { createTestContext } from './helpers/createTestContext.js'

describe('backend app shell', () => {
  const cleanups = []

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()()
    }
  })

  it('returns a unified success envelope from public categories', async () => {
    const ctx = createTestContext()
    cleanups.push(() => ctx.cleanup())

    const app = createApp({
      adminKey: ctx.adminKey,
      dbPath: ctx.dbPath,
      uploadDir: ctx.uploadDir
    })

    const response = await request(app).get('/api/public/categories')

    expect(response.status).toBe(200)
    expect(response.body.code).toBe(0)
    expect(response.body.message).toBe('ok')
    expect(Array.isArray(response.body.data.list)).toBe(true)
  })

  it('rejects admin categories access without x-admin-key', async () => {
    const ctx = createTestContext()
    cleanups.push(() => ctx.cleanup())

    const app = createApp({
      adminKey: ctx.adminKey,
      dbPath: ctx.dbPath,
      uploadDir: ctx.uploadDir
    })

    const response = await request(app).get('/api/admin/categories')

    expect(response.status).toBe(401)
    expect(response.body).toEqual({
      code: 40100,
      message: 'unauthorized',
      data: null
    })
  })
})
