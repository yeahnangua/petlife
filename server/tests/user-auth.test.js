import request from 'supertest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../src/app.js'
import { createDatabase } from '../src/db/index.js'
import { migrate } from '../src/db/migrate.js'
import { seed } from '../src/db/seed.js'
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

  it('redirects to official account OAuth with a stored state', async () => {
    const { app, db } = createSeededApp(cleanups, {
      baseUrl: 'https://api.example.test',
      wechatOfficialAccountAppId: 'wx_test_appid',
      wechatOfficialAccountAppSecret: 'wx_test_secret',
      mobileAppUrl: 'https://m.example.test'
    })

    const response = await request(app).get('/api/auth/wechat-oauth/start?redirect=/cart')

    expect(response.status).toBe(302)
    const location = new URL(response.headers.location)
    expect(`${location.origin}${location.pathname}`).toBe('https://open.weixin.qq.com/connect/oauth2/authorize')
    expect(location.searchParams.get('appid')).toBe('wx_test_appid')
    expect(location.searchParams.get('redirect_uri')).toBe('https://api.example.test/api/auth/wechat-oauth/callback')
    expect(location.searchParams.get('response_type')).toBe('code')
    expect(location.searchParams.get('scope')).toBe('snsapi_userinfo')
    expect(location.hash).toBe('#wechat_redirect')

    const state = location.searchParams.get('state')
    const stateRow = db.prepare('SELECT redirect_path, used_at FROM wechat_oauth_states WHERE state = ?').get(state)
    expect(stateRow).toEqual({
      redirect_path: '/cart',
      used_at: ''
    })
  })

  it('exchanges official account callback code and creates a mobile session', async () => {
    const wechatOfficialAccountClient = {
      exchangeCode: vi.fn(async () => ({
        access_token: 'wechat-access-token',
        openid: 'openid_real_001',
        unionid: 'union_real_001'
      })),
      fetchUserInfo: vi.fn(async () => ({
        openid: 'openid_real_001',
        unionid: 'union_real_001',
        nickname: '微信测试用户',
        headimgurl: 'https://example.com/wechat-avatar.jpg'
      }))
    }
    const { app, db } = createSeededApp(cleanups, {
      baseUrl: 'https://api.example.test',
      mobileAppUrl: 'https://m.example.test',
      wechatOfficialAccountAppId: 'wx_test_appid',
      wechatOfficialAccountAppSecret: 'wx_test_secret',
      wechatOfficialAccountClient
    })
    const startResponse = await request(app).get('/api/auth/wechat-oauth/start?redirect=/orders')
    const state = new URL(startResponse.headers.location).searchParams.get('state')

    const callbackResponse = await request(app).get(`/api/auth/wechat-oauth/callback?code=wx-code-001&state=${state}`)

    expect(callbackResponse.status).toBe(302)
    const redirect = new URL(callbackResponse.headers.location)
    expect(`${redirect.origin}${redirect.pathname}`).toBe('https://m.example.test/')
    expect(redirect.hash).toMatch(/^#\/login\?/)
    const hashQuery = new URLSearchParams(redirect.hash.split('?')[1])
    expect(hashQuery.get('redirect')).toBe('/orders')
    const token = hashQuery.get('wechat_token')
    expect(token).toEqual(expect.any(String))
    expect(token.length).toBeGreaterThan(20)
    expect(wechatOfficialAccountClient.exchangeCode).toHaveBeenCalledWith({
      appId: 'wx_test_appid',
      appSecret: 'wx_test_secret',
      code: 'wx-code-001'
    })
    expect(wechatOfficialAccountClient.fetchUserInfo).toHaveBeenCalledWith({
      accessToken: 'wechat-access-token',
      openid: 'openid_real_001'
    })

    const session = db
      .prepare('SELECT user_id, provider, provider_subject FROM user_sessions WHERE token = ?')
      .get(token)
    expect(session).toMatchObject({
      provider: 'wechat_official_account',
      provider_subject: 'openid_real_001'
    })

    const identity = db
      .prepare('SELECT user_id, provider, provider_subject, unionid FROM user_identities WHERE provider = ? AND provider_subject = ?')
      .get('wechat_official_account', 'openid_real_001')
    expect(identity).toEqual({
      user_id: session.user_id,
      provider: 'wechat_official_account',
      provider_subject: 'openid_real_001',
      unionid: 'union_real_001'
    })
  })

  it('rejects official account callback with an invalid state', async () => {
    const wechatOfficialAccountClient = {
      exchangeCode: vi.fn(),
      fetchUserInfo: vi.fn()
    }
    const { app } = createSeededApp(cleanups, {
      wechatOfficialAccountAppId: 'wx_test_appid',
      wechatOfficialAccountAppSecret: 'wx_test_secret',
      wechatOfficialAccountClient
    })

    const response = await request(app).get('/api/auth/wechat-oauth/callback?code=wx-code-001&state=bad-state')

    expect(response.status).toBe(400)
    expect(response.body.message).toBe('invalid oauth state')
    expect(wechatOfficialAccountClient.exchangeCode).not.toHaveBeenCalled()
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
