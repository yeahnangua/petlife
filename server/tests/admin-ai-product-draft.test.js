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

function makeProductContext(overrides = {}) {
  return {
    category_id: 'cat-food',
    category_name: '主粮',
    pet_type: 'cat',
    pet_type_label: '猫',
    title: '鲜肉全价猫粮',
    subtitle: '低敏冷鲜配方 · 成猫通用',
    price: 268,
    member_price: 248,
    original_price: 298,
    badge: '热卖',
    tags: ['旧标签'],
    summary: ['旧摘要'],
    suitable_text: '旧适用描述',
    ...overrides
  }
}

describe('admin product AI draft api', () => {
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
      .post('/api/admin/products/ai-draft')
      .send({
        mode: 'intro',
        product: makeProductContext()
      })

    expect(response.status).toBe(401)
    expect(response.body.message).toBe('unauthorized')
    expect(aiChatClient).not.toHaveBeenCalled()
  })

  it('generates a validated intro draft from the product context', async () => {
    const aiChatClient = vi.fn(async () => ({
      content: JSON.stringify({
        tags: ['低敏', '成猫', '鲜肉配方'],
        summary: ['鲜肉配方，适合作为成猫日常主粮', '颗粒适口，兼顾营养和消化负担'],
        suitable_text: '适合 1-8 岁成猫日常喂养'
      }),
      model: 'deepseek-test-model',
      usage: { prompt_tokens: 42, completion_tokens: 18, total_tokens: 60 }
    }))
    const { app, ctx } = createSeededApp(cleanups, { aiChatClient })

    const response = await withAdminKey(
      ctx,
      request(app)
        .post('/api/admin/products/ai-draft')
        .send({
          mode: 'intro',
          product: makeProductContext()
        })
    )

    expect(response.status).toBe(200)
    expect(response.body.data).toEqual({
      draft: {
        tags: ['低敏', '成猫', '鲜肉配方'],
        summary: ['鲜肉配方，适合作为成猫日常主粮', '颗粒适口，兼顾营养和消化负担'],
        suitable_text: '适合 1-8 岁成猫日常喂养'
      },
      model: 'deepseek-test-model',
      usage: { prompt_tokens: 42, completion_tokens: 18, total_tokens: 60 }
    })

    expect(aiChatClient).toHaveBeenCalledOnce()
    const payload = aiChatClient.mock.calls[0][0]
    const promptText = payload.messages.map((item) => item.content).join('\n')

    expect(payload.model).toBe('deepseek-test-model')
    expect(payload.responseFormat).toEqual({ type: 'json_object' })
    expect(promptText).toContain('商品介绍草稿')
    expect(promptText).toContain('鲜肉全价猫粮')
    expect(promptText).toContain('旧标签')
    expect(promptText).toContain('不要编造医疗功效')
  })

  it('generates validated specs JSON from the natural language prompt', async () => {
    const aiChatClient = vi.fn(async () => ({
      content: JSON.stringify({
        specs: [
          { group: '规格', options: ['1.5kg', '3kg', '6kg'] },
          { group: '口味', options: ['鸡肉', '三文鱼', '牛肉'] }
        ]
      }),
      model: 'deepseek-test-model',
      usage: null
    }))
    const { app, ctx } = createSeededApp(cleanups, { aiChatClient })

    const response = await withAdminKey(
      ctx,
      request(app)
        .post('/api/admin/products/ai-draft')
        .send({
          mode: 'specs',
          prompt: '规格有 1.5kg 3kg 和 6kg，口味有鸡肉 三文鱼 和牛肉',
          product: makeProductContext()
        })
    )

    expect(response.status).toBe(200)
    expect(response.body.data).toEqual({
      draft: {
        specs: [
          { group: '规格', options: ['1.5kg', '3kg', '6kg'] },
          { group: '口味', options: ['鸡肉', '三文鱼', '牛肉'] }
        ]
      },
      model: 'deepseek-test-model',
      usage: null
    })

    const payload = aiChatClient.mock.calls[0][0]
    const promptText = payload.messages.map((item) => item.content).join('\n')

    expect(payload.responseFormat).toEqual({ type: 'json_object' })
    expect(promptText).toContain('规格 JSON 草稿')
    expect(promptText).toContain('规格有 1.5kg 3kg 和 6kg')
    expect(promptText).toContain('鲜肉全价猫粮')
  })

  it('rejects invalid model JSON instead of returning unsafe draft data', async () => {
    const aiChatClient = vi.fn(async () => ({
      content: '这不是 JSON',
      model: 'deepseek-test-model',
      usage: null
    }))
    const { app, ctx } = createSeededApp(cleanups, { aiChatClient })

    const response = await withAdminKey(
      ctx,
      request(app)
        .post('/api/admin/products/ai-draft')
        .send({
          mode: 'intro',
          product: makeProductContext()
        })
    )

    expect(response.status).toBe(502)
    expect(response.body.message).toBe('AI generated invalid draft')
  })

  it('validates request input before calling the model', async () => {
    const aiChatClient = vi.fn()
    const { app, ctx } = createSeededApp(cleanups, { aiChatClient })

    const missingPrompt = await withAdminKey(
      ctx,
      request(app)
        .post('/api/admin/products/ai-draft')
        .send({
          mode: 'specs',
          prompt: '',
          product: makeProductContext()
        })
    )
    const missingIntroContext = await withAdminKey(
      ctx,
      request(app)
        .post('/api/admin/products/ai-draft')
        .send({
          mode: 'intro',
          product: makeProductContext({ title: '' })
        })
    )
    const invalidMode = await withAdminKey(
      ctx,
      request(app)
        .post('/api/admin/products/ai-draft')
        .send({
          mode: 'title',
          product: makeProductContext()
        })
    )

    expect(missingPrompt.status).toBe(400)
    expect(missingPrompt.body.message).toBe('prompt is required')
    expect(missingIntroContext.status).toBe(400)
    expect(missingIntroContext.body.message).toBe('product.title is required')
    expect(invalidMode.status).toBe(400)
    expect(invalidMode.body.message).toContain('mode must be one of')
    expect(aiChatClient).not.toHaveBeenCalled()
  })
})
