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

async function loginAsDemoUser(app) {
  const response = await request(app).post('/api/auth/wechat-login').send()
  expect(response.status).toBe(200)
  return response.body.data.token
}

describe('mobile user auth', () => {
  const cleanups = []

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()()
    }
  })

  it('rejects user APIs without a bearer token', async () => {
    const { app } = createSeededApp(cleanups)

    const response = await request(app).get('/api/user/profile')

    expect(response.status).toBe(401)
    expect(response.body).toEqual({
      code: 40100,
      message: 'unauthorized',
      data: null
    })
  })

  it('logs in through simulated WeChat SSO and stores the session in the database', async () => {
    const { app, db } = createSeededApp(cleanups)

    const response = await request(app).post('/api/auth/wechat-login').send()

    expect(response.status).toBe(200)
    expect(response.body.data.user.id).toBe('u_demo_001')
    expect(response.body.data.token).toEqual(expect.any(String))
    expect(response.body.data.token.length).toBeGreaterThan(20)

    const session = db
      .prepare('SELECT user_id, provider, provider_subject FROM user_sessions WHERE token = ?')
      .get(response.body.data.token)

    expect(session).toEqual({
      user_id: 'u_demo_001',
      provider: 'wechat',
      provider_subject: 'demo-wechat-openid'
    })
  })

  it('authorizes user APIs and returns the current session user with a valid token', async () => {
    const { app } = createSeededApp(cleanups)
    const token = await loginAsDemoUser(app)

    const profileResponse = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${token}`)

    expect(profileResponse.status).toBe(200)
    expect(profileResponse.body.data.profile.id).toBe('u_demo_001')

    const sessionResponse = await request(app)
      .get('/api/auth/session')
      .set('Authorization', `Bearer ${token}`)

    expect(sessionResponse.status).toBe(200)
    expect(sessionResponse.body.data.user.id).toBe('u_demo_001')
  })

  it('deletes the current session on logout', async () => {
    const { app, db } = createSeededApp(cleanups)
    const token = await loginAsDemoUser(app)

    const logoutResponse = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .send()

    expect(logoutResponse.status).toBe(200)
    expect(db.prepare('SELECT COUNT(*) AS count FROM user_sessions WHERE token = ?').get(token).count).toBe(0)

    const profileResponse = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${token}`)

    expect(profileResponse.status).toBe(401)
  })
})
