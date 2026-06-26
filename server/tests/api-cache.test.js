import request from 'supertest'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { createDatabase } from '../src/db/index.js'
import { migrate } from '../src/db/migrate.js'
import { seed } from '../src/db/seed.js'
import { createDemoUserAuthHeader } from './helpers/auth.js'
import { createTestContext } from './helpers/createTestContext.js'

function createSeededApp(cleanups, overrides = {}) {
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
    database: db,
    ...overrides
  })

  return { app, ctx, authHeader: createDemoUserAuthHeader(db) }
}

describe('api cache headers', () => {
  const cleanups = []

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()()
    }
  })

  it('allows CDN caching for stable public catalog GET APIs', async () => {
    const { app } = createSeededApp(cleanups)

    const response = await request(app).get('/api/public/products')

    expect(response.status).toBe(200)
    expect(response.headers['cache-control']).toBe(
      'public, max-age=60, s-maxage=300, stale-while-revalidate=60'
    )
  })

  it('keeps fast-changing public slot availability on a shorter CDN cache', async () => {
    const { app } = createSeededApp(cleanups)

    const response = await request(app).get('/api/public/stores/store-1/slots?date=2026-04-10&serviceId=s-001')

    expect(response.status).toBe(200)
    expect(response.headers['cache-control']).toBe(
      'public, max-age=10, s-maxage=30, stale-while-revalidate=10'
    )
  })

  it('does not cache user, admin, auth, or write APIs', async () => {
    const { app, ctx, authHeader } = createSeededApp(cleanups, {
      aiChatClient: async () => ({
        content: '可以优先看主粮和冻干搭配。',
        model: 'test-model',
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 }
      })
    })

    const userResponse = await request(app).get('/api/user/profile').set(authHeader)
    const adminResponse = await request(app).get('/api/admin/categories').set('x-admin-key', ctx.adminKey)
    const authResponse = await request(app).post('/api/auth/wechat-login').send()
    const writeResponse = await request(app).post('/api/public/ai-consult').send({ message: '推荐猫粮' })

    expect(userResponse.status).toBe(200)
    expect(adminResponse.status).toBe(200)
    expect(authResponse.status).toBe(200)
    expect(writeResponse.status).toBe(200)
    expect(userResponse.headers['cache-control']).toBe('no-store')
    expect(adminResponse.headers['cache-control']).toBe('no-store')
    expect(authResponse.headers['cache-control']).toBe('no-store')
    expect(writeResponse.headers['cache-control']).toBe('no-store')
  })
})
