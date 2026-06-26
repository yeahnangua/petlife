import { createHash } from 'node:crypto'
import request from 'supertest'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { createDatabase } from '../src/db/index.js'
import { migrate } from '../src/db/migrate.js'
import { seed } from '../src/db/seed.js'
import { createTestContext } from './helpers/createTestContext.js'

function sign({ token, timestamp, nonce }) {
  return createHash('sha1')
    .update([token, timestamp, nonce].sort().join(''))
    .digest('hex')
}

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
    wechatOfficialAccountToken: 'wechat-event-token',
    wechatOfficialAccountWelcomeMessage: '欢迎关注 PetLife，点击菜单可进入商城。',
    ...overrides
  })

  return { app }
}

describe('WeChat official account event callback', () => {
  const cleanups = []

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()()
    }
  })

  it('verifies the callback URL with the configured token', async () => {
    const { app } = createSeededApp(cleanups)
    const timestamp = '1780000000'
    const nonce = 'nonce-001'
    const signature = sign({ token: 'wechat-event-token', timestamp, nonce })

    const response = await request(app)
      .get('/api/wechat/events')
      .query({ signature, timestamp, nonce, echostr: 'wechat-echo-ok' })

    expect(response.status).toBe(200)
    expect(response.text).toBe('wechat-echo-ok')
    expect(response.headers['cache-control']).toBe('no-store')
  })

  it('replies to subscribe events with a passive text message', async () => {
    const { app } = createSeededApp(cleanups)
    const timestamp = '1780000001'
    const nonce = 'nonce-002'
    const signature = sign({ token: 'wechat-event-token', timestamp, nonce })
    const eventXml = `
      <xml>
        <ToUserName><![CDATA[gh_petlife_test]]></ToUserName>
        <FromUserName><![CDATA[openid_user_001]]></FromUserName>
        <CreateTime>1780000001</CreateTime>
        <MsgType><![CDATA[event]]></MsgType>
        <Event><![CDATA[subscribe]]></Event>
      </xml>
    `

    const response = await request(app)
      .post('/api/wechat/events')
      .query({ signature, timestamp, nonce })
      .set('Content-Type', 'text/xml')
      .send(eventXml)

    expect(response.status).toBe(200)
    expect(response.headers['content-type']).toContain('application/xml')
    expect(response.text).toContain('<ToUserName><![CDATA[openid_user_001]]></ToUserName>')
    expect(response.text).toContain('<FromUserName><![CDATA[gh_petlife_test]]></FromUserName>')
    expect(response.text).toContain('<MsgType><![CDATA[text]]></MsgType>')
    expect(response.text).toContain('<Content><![CDATA[欢迎关注 PetLife，点击菜单可进入商城。]]></Content>')
  })

  it('rejects callbacks with an invalid signature', async () => {
    const { app } = createSeededApp(cleanups)

    const response = await request(app)
      .get('/api/wechat/events')
      .query({
        signature: 'bad-signature',
        timestamp: '1780000000',
        nonce: 'nonce-001',
        echostr: 'wechat-echo-ok'
      })

    expect(response.status).toBe(403)
    expect(response.body.message).toBe('invalid WeChat callback signature')
  })
})
