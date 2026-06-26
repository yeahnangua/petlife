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
    aiApiKey: 'test-api-key',
    aiModel: 'deepseek-test-model',
    ...overrides
  })

  return { app, ctx }
}

function withAdminKey(ctx, builder) {
  return builder.set('x-admin-key', ctx.adminKey)
}

function makeServiceContext(overrides = {}) {
  return {
    title: '基础洗护 · 标准套餐',
    subtitle: '适合日常清洁与毛发护理',
    pet_type: 'cat',
    pet_type_label: '猫咪',
    price: 128,
    member_price: 108,
    duration_minutes: 60,
    badge: '热门',
    highlights: ['旧亮点'],
    summary: ['旧摘要'],
    notice: ['旧注意事项'],
    ...overrides
  }
}

describe('admin service AI draft api', () => {
  const cleanups = []

  afterEach(() => {
    vi.restoreAllMocks()
    while (cleanups.length > 0) {
      cleanups.pop()()
    }
  })

  it('requires the admin key', async () => {
    const aiChatClient = vi.fn()
    const { app } = createSeededApp(cleanups, { aiChatClient })

    const response = await request(app)
      .post('/api/admin/services/ai-draft')
      .send({
        service: makeServiceContext()
      })

    expect(response.status).toBe(401)
    expect(response.body.message).toBe('unauthorized')
    expect(aiChatClient).not.toHaveBeenCalled()
  })

  it('generates validated service draft fields from the service context', async () => {
    const aiChatClient = vi.fn(async () => ({
      content: JSON.stringify({
        highlights: ['基础清洁', '毛发梳理', '耳爪护理'],
        summary: ['日常洗护清洁', '流程温和安心'],
        notice: ['到店前确认健康', '敏感体质先告知']
      }),
      model: 'deepseek-test-model',
      usage: { prompt_tokens: 40, completion_tokens: 24, total_tokens: 64 }
    }))
    const { app, ctx } = createSeededApp(cleanups, { aiChatClient })

    const response = await withAdminKey(
      ctx,
      request(app)
        .post('/api/admin/services/ai-draft')
        .send({
          service: makeServiceContext()
        })
    )

    expect(response.status).toBe(200)
    expect(response.body.data).toEqual({
      draft: {
        highlights: ['基础清洁', '毛发梳理', '耳爪护理'],
        summary: ['日常洗护清洁', '流程温和安心'],
        notice: ['到店前确认健康', '敏感体质先告知']
      },
      model: 'deepseek-test-model',
      usage: { prompt_tokens: 40, completion_tokens: 24, total_tokens: 64 }
    })

    expect(aiChatClient).toHaveBeenCalledOnce()
    const payload = aiChatClient.mock.calls[0][0]
    const promptText = payload.messages.map((item) => item.content).join('\n')

    expect(payload.model).toBe('deepseek-test-model')
    expect(payload.responseFormat).toEqual({ type: 'json_object' })
    expect(promptText).toContain('服务资料草稿')
    expect(promptText).toContain('基础洗护 · 标准套餐')
    expect(promptText).toContain('旧亮点')
    expect(promptText).toContain('一行一条')
    expect(promptText).toContain('亮点不超过 10 个汉字')
    expect(promptText).toContain('摘要和注意事项每条不超过 20 个汉字')
    expect(promptText).toContain('末尾不要有句号')
    expect(promptText).toContain('不要编造医疗功效')
  })

  it('normalizes service draft text to the configured short line limits', async () => {
    const aiChatClient = vi.fn(async () => ({
      content: JSON.stringify({
        highlights: ['基础清洁洗护护理超过十字', '毛发梳理护理服务', '耳爪护理'],
        summary: ['适合日常洗护需求覆盖清洁梳理基础护理。', '流程温和安心。'],
        notice: ['到店前请确认宠物健康状态并提前说明异常。', '敏感体质先告知。']
      }),
      model: 'deepseek-test-model',
      usage: null
    }))
    const { app, ctx } = createSeededApp(cleanups, { aiChatClient })

    const response = await withAdminKey(
      ctx,
      request(app)
        .post('/api/admin/services/ai-draft')
        .send({
          service: makeServiceContext()
        })
    )

    expect(response.status).toBe(200)
    expect(response.body.data.draft).toEqual({
      highlights: ['基础清洁洗护护理超过', '毛发梳理护理服务', '耳爪护理'],
      summary: ['适合日常洗护需求覆盖清洁梳理基础护理', '流程温和安心'],
      notice: ['到店前请确认宠物健康状态并提前说明异常', '敏感体质先告知']
    })
  })

  it('validates required service context before calling the model', async () => {
    const aiChatClient = vi.fn()
    const { app, ctx } = createSeededApp(cleanups, { aiChatClient })

    const missingTitle = await withAdminKey(
      ctx,
      request(app)
        .post('/api/admin/services/ai-draft')
        .send({
          service: makeServiceContext({ title: '' })
        })
    )
    const missingSubtitle = await withAdminKey(
      ctx,
      request(app)
        .post('/api/admin/services/ai-draft')
        .send({
          service: makeServiceContext({ subtitle: '' })
        })
    )
    const missingPetType = await withAdminKey(
      ctx,
      request(app)
        .post('/api/admin/services/ai-draft')
        .send({
          service: makeServiceContext({ pet_type: '' })
        })
    )

    expect(missingTitle.status).toBe(400)
    expect(missingTitle.body.message).toBe('service.title is required')
    expect(missingSubtitle.status).toBe(400)
    expect(missingSubtitle.body.message).toBe('service.subtitle is required')
    expect(missingPetType.status).toBe(400)
    expect(missingPetType.body.message).toBe('service.pet_type is required')
    expect(aiChatClient).not.toHaveBeenCalled()
  })

  it('rejects invalid model JSON instead of returning unsafe draft data', async () => {
    const aiChatClient = vi.fn(async () => ({
      content: JSON.stringify({
        highlights: ['只有亮点']
      }),
      model: 'deepseek-test-model',
      usage: null
    }))
    const { app, ctx } = createSeededApp(cleanups, { aiChatClient })

    const response = await withAdminKey(
      ctx,
      request(app)
        .post('/api/admin/services/ai-draft')
        .send({
          service: makeServiceContext()
        })
    )

    expect(response.status).toBe(502)
    expect(response.body.message).toBe('AI generated invalid draft')
  })
})
