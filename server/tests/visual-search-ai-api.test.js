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
    imageSearchApiKey: 'test-image-search-key',
    imageSearchModel: 'image-search-test-model',
    imageSearchBaseUrl: 'https://image-search.example.test/v1',
    ...overrides
  })

  return { app, ctx, db }
}

describe('public visual search AI similarity api', () => {
  const cleanups = []

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()()
    }
  })

  it('asks the configured chat model to score product similarity from recognition labels and product text', async () => {
    const aiChatClient = vi.fn()
    const visualSearchAiChatClient = vi.fn(async () => ({
      content: JSON.stringify({
        labels: ['主粮包装'],
        items: [
          { id: 'p-001', aiSimilarity: 92 },
          { id: 'p-004', aiSimilarity: 24 }
        ]
      }),
      model: 'deepseek-test-model',
      usage: { prompt_tokens: 120, completion_tokens: 32, total_tokens: 152 }
    }))
    const { app } = createSeededApp(cleanups, { aiChatClient, visualSearchAiChatClient })

    const response = await request(app)
      .post('/api/public/visual-search/similarity')
      .send({
        recognition: {
          labels: ['tabby cat', 'packet package'],
          keywords: ['tabby', 'cat', 'packet', 'package'],
          categoryHints: ['food', 'clean']
        },
        products: [
          {
            id: 'p-001',
            title: '鲜肉全价猫粮',
            subtitle: '低敏冷鲜配方',
            tags: ['猫粮', '主粮'],
            petType: 'cat',
            category: 'food'
          },
          {
            id: 'p-004',
            title: '羽毛逗猫棒套装',
            subtitle: '互动消耗',
            tags: ['玩具', '逗猫']
          }
        ]
      })

    expect(response.status).toBe(200)
    expect(response.body.data).toEqual({
      aiSimilarities: {
        'p-001': 92,
        'p-004': 24
      },
      labels: ['主粮包装'],
      model: 'deepseek-test-model',
      usage: { prompt_tokens: 120, completion_tokens: 32, total_tokens: 152 }
    })

    expect(aiChatClient).not.toHaveBeenCalled()
    expect(visualSearchAiChatClient).toHaveBeenCalledOnce()
    const payload = visualSearchAiChatClient.mock.calls[0][0]
    const promptText = payload.messages.map((item) => item.content).join('\n')

    expect(payload.model).toBe('image-search-test-model')
    expect(payload.responseFormat).toEqual({ type: 'json_object' })
    expect(payload.thinking).toEqual({ type: 'disabled' })
    expect(promptText).toContain('tabby cat')
    expect(promptText).toContain('packet package')
    expect(promptText).toContain('鲜肉全价猫粮')
    expect(promptText).toContain('低敏冷鲜配方')
    expect(promptText).toContain('猫粮')
    expect(promptText).toContain('主粮')
    expect(promptText).toContain('"categoryHints":["主粮","洗护"]')
    expect(promptText).toContain('"category":"主粮"')
    expect(promptText).not.toContain('"categoryHints":["food","clean"]')
    expect(promptText).not.toContain('"category":"food"')
    expect(promptText).not.toContain('reason')
    expect(promptText).not.toContain('原因')
  })
})
