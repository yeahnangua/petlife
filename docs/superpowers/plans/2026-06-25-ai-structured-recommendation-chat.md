# AI Structured Recommendation Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade `/ai-consult` so DeepSeek/SiliconFlow can return structured product recommendations, render compact vertical product cards, persist chat locally, and reset chat while preserving product context.

**Architecture:** Keep a single backend AI proxy endpoint. The backend sends recent text history, current product context, and a compact active-product catalog to the model, asks for JSON, validates returned product IDs against SQLite, and returns real product-card data. The frontend stores chat messages in `localStorage`, renders recommendation cards attached to assistant messages, and provides a reset control that clears only the current chat history.

**Tech Stack:** Express, better-sqlite3, SiliconFlow Chat Completions API, Vue 3 `<script setup>`, Vue Router, Pinia, Vitest, Vue Test Utils, Supertest.

---

## File Structure

- Modify: `server/tests/ai-consult-api.test.js`
  Adds backend regression tests for structured model output, product catalog prompt injection, recommendation validation, sold-out filtering, and plain-text fallback.
- Modify: `server/src/repositories/productRepository.js`
  Adds focused product query helpers for AI catalog context and recommendation-card lookup.
- Modify: `server/src/services/aiConsultService.js`
  Builds compact product catalog prompts, requests JSON output, parses model JSON, validates recommendation IDs, and returns real product card data.
- Modify: `src/tests/api-client.test.js`
  Extends public API client coverage for `recommendations`.
- Create: `src/lib/aiConsultHistory.js`
  Owns `localStorage` keys, load/save/clear behavior, message normalization, and message limit.
- Create: `src/tests/ai-consult-history.test.js`
  Tests the local persistence helper with fake storage.
- Modify: `src/tests/ai-consult-view.test.js`
  Covers card rendering, product navigation, localStorage restore, and reset behavior.
- Modify: `src/views/AiConsultView.vue`
  Adds router navigation, persisted message state, reset button, assistant recommendation cards, and compact vertical card styles.

Spec: `docs/superpowers/specs/2026-06-25-ai-structured-recommendation-chat-design.md`

---

### Task 1: Backend Structured Recommendation Response

**Files:**
- Modify: `server/tests/ai-consult-api.test.js`
- Modify: `server/src/repositories/productRepository.js`
- Modify: `server/src/services/aiConsultService.js`

- [ ] **Step 1: Write failing backend tests for structured recommendations**

Append these tests inside `describe('public AI consult api', () => { ... })` in `server/tests/ai-consult-api.test.js`:

```javascript
  it('returns validated product recommendation cards from structured model output', async () => {
    const aiChatClient = vi.fn(async () => ({
      content: JSON.stringify({
        reply: '最推荐这款成猫主粮，鲜肉配方更适合日常长期喂养。',
        hasRecommendation: true,
        recommendedProductIds: ['p-001', 'p-missing', 'p-002'],
        recommendationMode: 'pair'
      }),
      model: 'deepseek-test-model',
      usage: { prompt_tokens: 88, completion_tokens: 32, total_tokens: 120 }
    }))
    const { app } = createSeededApp(cleanups, { aiChatClient })

    const response = await request(app)
      .post('/api/public/ai-consult')
      .send({
        message: '有什么猫粮推荐',
        messages: [{ role: 'user', content: '有什么猫粮推荐' }]
      })

    expect(response.status).toBe(200)
    expect(response.body.data.reply).toBe('最推荐这款成猫主粮，鲜肉配方更适合日常长期喂养。')
    expect(response.body.data.model).toBe('deepseek-test-model')
    expect(response.body.data.usage).toEqual({ prompt_tokens: 88, completion_tokens: 32, total_tokens: 120 })
    expect(response.body.data.recommendations).toEqual([
      expect.objectContaining({
        id: 'p-001',
        title: '鲜肉全价猫粮',
        cover: '/images/products/cat-food.svg',
        memberPrice: 248,
        price: 268,
        stockStatus: 'inStock',
        tagline: '最推荐'
      }),
      expect.objectContaining({
        id: 'p-002',
        title: '冻干鸡肉小食',
        tagline: '可选搭配'
      })
    ])

    const payload = aiChatClient.mock.calls[0][0]
    const promptText = payload.messages.map((item) => item.content).join('\n')
    expect(payload.responseFormat).toEqual({ type: 'json_object' })
    expect(promptText).toContain('店铺商品目录')
    expect(promptText).toContain('p-001')
    expect(promptText).toContain('鲜肉全价猫粮')
    expect(promptText).toContain('p-014')
    expect(promptText).toContain('只能返回商品目录中存在的 id')
  })

  it('filters sold-out and excessive model recommendations', async () => {
    const aiChatClient = vi.fn(async () => ({
      content: JSON.stringify({
        reply: '我给你两个更稳妥的选择。',
        hasRecommendation: true,
        recommendedProductIds: ['p-008', 'p-001', 'p-002', 'p-003'],
        recommendationMode: 'pair'
      })
    }))
    const { app } = createSeededApp(cleanups, { aiChatClient })

    const response = await request(app)
      .post('/api/public/ai-consult')
      .send({ message: '多推荐几款', messages: [{ role: 'user', content: '多推荐几款' }] })

    expect(response.status).toBe(200)
    expect(response.body.data.recommendations.map((item) => item.id)).toEqual(['p-001', 'p-002'])
    expect(response.body.data.recommendations).toHaveLength(2)
  })

  it('falls back to a plain text reply when structured model output is not JSON', async () => {
    const aiChatClient = vi.fn(async () => ({
      content: '可以先告诉我猫咪年龄、体重和预算，我再帮你缩小范围。',
      model: 'deepseek-test-model'
    }))
    const { app } = createSeededApp(cleanups, { aiChatClient })

    const response = await request(app)
      .post('/api/public/ai-consult')
      .send({ message: '怎么选猫粮', messages: [{ role: 'user', content: '怎么选猫粮' }] })

    expect(response.status).toBe(200)
    expect(response.body.data).toEqual({
      reply: '可以先告诉我猫咪年龄、体重和预算，我再帮你缩小范围。',
      recommendations: [],
      model: 'deepseek-test-model',
      usage: null
    })
  })
```

- [ ] **Step 2: Run backend AI test and verify it fails**

Run:

```bash
npm --prefix server run test -- tests/ai-consult-api.test.js
```

Expected: FAIL because `recommendations` is missing, `responseFormat` is not passed to the chat client, and product catalog text is not in the prompt.

- [ ] **Step 3: Add product repository helpers**

Append these exports to `server/src/repositories/productRepository.js` after `listAllProducts`:

```javascript
export function listActiveProductsForAi(db) {
  return db
    .prepare(
      `
        SELECT
          p.*,
          c.slug AS category_slug
        FROM products p
        JOIN categories c ON c.id = p.category_id
        WHERE p.status = 'active'
        ORDER BY p.id ASC
      `
    )
    .all()
}

export function listActiveProductsByIds(db, productIds = []) {
  const uniqueIds = [...new Set(productIds.filter(Boolean))]
  if (uniqueIds.length === 0) {
    return []
  }

  const placeholders = uniqueIds.map(() => '?').join(', ')
  return db
    .prepare(
      `
        SELECT
          p.*,
          c.slug AS category_slug
        FROM products p
        JOIN categories c ON c.id = p.category_id
        WHERE p.status = 'active' AND p.id IN (${placeholders})
      `
    )
    .all(...uniqueIds)
}
```

- [ ] **Step 4: Replace AI consult service with structured recommendation implementation**

Replace the full contents of `server/src/services/aiConsultService.js` with:

```javascript
import { getProductDetail } from './catalogService.js'
import { listActiveProductsByIds, listActiveProductsForAi } from '../repositories/productRepository.js'
import { AppError } from '../utils/appError.js'

const MAX_HISTORY_MESSAGES = 12
const MAX_MESSAGE_LENGTH = 1200
const MAX_RECOMMENDATIONS = 2

const SYSTEM_PROMPT = [
  '你是 PetLife 宠物生活馆的售前咨询助手。',
  '请用中文回答，语气专业、简洁、可信。',
  '优先围绕宠物类型、年龄、体重、预算、过敏情况、使用场景和商品适配给出建议。',
  '不要编造库存、优惠、医疗诊断或平台未提供的服务承诺。',
  '涉及疾病、严重异常或处方需求时，建议用户咨询兽医。',
  '你必须输出 JSON 对象，不要输出 Markdown 或额外解释。'
].join('\n')

const JSON_OUTPUT_PROMPT = [
  '输出 JSON 格式：',
  '{"reply":"给用户看的中文回复","hasRecommendation":false,"recommendedProductIds":[],"recommendationMode":"none"}',
  '字段规则：',
  '- reply 必须是中文字符串。',
  '- hasRecommendation 只有在用户询问商品推荐、比较、搭配或购买建议时才为 true。',
  '- recommendedProductIds 只能返回商品目录中存在的 id，默认 1 个，最多 2 个。',
  '- recommendationMode 只能是 none、single、pair。'
].join('\n')

function trimText(value, maxLength = MAX_MESSAGE_LENGTH) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim().slice(0, maxLength)
}

function parseJsonArray(value) {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function normalizeMessages(messages, latestMessage) {
  const normalized = Array.isArray(messages)
    ? messages
        .map((item) => ({
          role: item?.role,
          content: trimText(item?.content)
        }))
        .filter((item) => ['user', 'assistant'].includes(item.role) && item.content)
    : []

  const lastMessage = normalized.at(-1)
  if (!lastMessage || lastMessage.role !== 'user' || lastMessage.content !== latestMessage) {
    normalized.push({ role: 'user', content: latestMessage })
  }

  return normalized.slice(-MAX_HISTORY_MESSAGES)
}

function buildProductPrompt(product) {
  if (!product) {
    return ''
  }

  const details = [
    `商品标题：${product.title}`,
    product.subtitle ? `卖点：${product.subtitle}` : '',
    product.pet_type ? `适用宠物：${product.pet_type}` : '',
    product.suitable_text ? `适用说明：${product.suitable_text}` : '',
    product.price ? `售价：${product.price}` : '',
    product.member_price ? `会员价：${product.member_price}` : '',
    Array.isArray(product.tags) && product.tags.length > 0 ? `标签：${product.tags.join('、')}` : '',
    Array.isArray(product.summary) && product.summary.length > 0 ? `摘要：${product.summary.join('；')}` : ''
  ].filter(Boolean)

  return [
    '当前用户正在咨询以下商品。回答时可以引用这些信息，但不要假装知道未提供的信息。',
    ...details
  ].join('\n')
}

function mapCatalogProduct(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category_slug,
    petType: row.pet_type,
    price: row.price,
    memberPrice: row.member_price,
    stockStatus: row.stock_status,
    tags: parseJsonArray(row.tags_json),
    summary: parseJsonArray(row.summary_json),
    suitable: row.suitable_text,
    subtitle: row.subtitle
  }
}

function buildCatalogPrompt(rows = []) {
  const products = rows.map(mapCatalogProduct)
  return [
    '店铺商品目录如下。只能返回商品目录中存在的 id；优先推荐 stockStatus 不是 soldOut 的商品。',
    JSON.stringify(products)
  ].join('\n')
}

function buildChatMessages({ product, productRows, history }) {
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }]
  const productPrompt = buildProductPrompt(product)

  if (productPrompt) {
    messages.push({ role: 'system', content: productPrompt })
  }

  messages.push({ role: 'system', content: buildCatalogPrompt(productRows) })
  messages.push({ role: 'system', content: JSON_OUTPUT_PROMPT })
  messages.push(...history)
  return messages
}

function normalizeBaseUrl(value) {
  return String(value || 'https://api.deepseek.com').replace(/\/+$/, '')
}

async function parseJsonResponse(response) {
  const text = await response.text()
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function parseStructuredContent(content) {
  const text = trimText(content, 4000)
  if (!text) {
    return {
      reply: '',
      hasRecommendation: false,
      recommendedProductIds: [],
      recommendationMode: 'none'
    }
  }

  try {
    const parsed = JSON.parse(text)
    return {
      reply: trimText(parsed.reply, 2000) || text,
      hasRecommendation: parsed.hasRecommendation === true,
      recommendedProductIds: Array.isArray(parsed.recommendedProductIds)
        ? parsed.recommendedProductIds.map((id) => trimText(id, 80)).filter(Boolean)
        : [],
      recommendationMode: ['none', 'single', 'pair'].includes(parsed.recommendationMode)
        ? parsed.recommendationMode
        : 'none'
    }
  } catch {
    return {
      reply: text,
      hasRecommendation: false,
      recommendedProductIds: [],
      recommendationMode: 'none'
    }
  }
}

function mapRecommendation(row, index) {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    cover: row.cover_url,
    price: row.price,
    memberPrice: row.member_price,
    originalPrice: row.original_price,
    stockStatus: row.stock_status,
    badge: row.badge || null,
    tagline: index === 0 ? '最推荐' : '可选搭配'
  }
}

function resolveRecommendations(db, structured) {
  if (!structured.hasRecommendation || structured.recommendedProductIds.length === 0) {
    return []
  }

  const requestedIds = [...new Set(structured.recommendedProductIds)].slice(0, MAX_RECOMMENDATIONS * 3)
  const rowsById = new Map(listActiveProductsByIds(db, requestedIds).map((row) => [row.id, row]))

  return requestedIds
    .map((id) => rowsById.get(id))
    .filter((row) => row && row.stock_status !== 'soldOut')
    .slice(0, MAX_RECOMMENDATIONS)
    .map(mapRecommendation)
}

export function createSiliconFlowChatClient(config) {
  return async function requestChatCompletion(payload) {
    if (!config.aiApiKey) {
      throw new AppError(500, 50010, 'AI service is not configured')
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), config.aiTimeoutMs)

    try {
      const response = await fetch(`${normalizeBaseUrl(config.aiBaseUrl)}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.aiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: payload.model,
          messages: payload.messages,
          stream: false,
          temperature: 0.35,
          max_tokens: 900,
          response_format: payload.responseFormat
        }),
        signal: controller.signal
      })
      const data = await parseJsonResponse(response)

      if (!response.ok) {
        throw new AppError(502, 50200, data?.message || 'AI service request failed')
      }

      const content = data?.choices?.[0]?.message?.content?.trim()
      if (!content) {
        throw new AppError(502, 50201, 'AI service returned empty response')
      }

      return {
        content,
        model: data.model,
        usage: data.usage ?? null
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }

      if (error?.name === 'AbortError') {
        throw new AppError(504, 50400, 'AI service request timed out')
      }

      throw new AppError(502, 50200, 'AI service request failed')
    } finally {
      clearTimeout(timeout)
    }
  }
}

export async function createAiConsultReply({ db, config, chatClient, body = {} }) {
  const latestMessage = trimText(body.message)
  if (!latestMessage) {
    throw new AppError(400, 40000, 'message is required')
  }

  const productId = trimText(body.productId, 80)
  const product = productId ? getProductDetail(db, productId) : null
  const history = normalizeMessages(body.messages, latestMessage)
  const productRows = listActiveProductsForAi(db)
  const result = await chatClient({
    model: config.aiModel,
    messages: buildChatMessages({ product, productRows, history }),
    responseFormat: { type: 'json_object' }
  })
  const structured = parseStructuredContent(result.content)
  const recommendations = resolveRecommendations(db, structured)

  return {
    reply: structured.reply,
    recommendations,
    model: result.model ?? config.aiModel,
    usage: result.usage ?? null
  }
}
```

- [ ] **Step 5: Run backend AI test and verify it passes**

Run:

```bash
npm --prefix server run test -- tests/ai-consult-api.test.js
```

Expected: PASS with all AI consult API tests green.

- [ ] **Step 6: Inspect backend structured recommendation changes without committing**

Run:

```bash
git diff -- server/tests/ai-consult-api.test.js server/src/repositories/productRepository.js server/src/services/aiConsultService.js
```

Expected: Review the diff for only the backend structured recommendation changes. Do not commit for this task.

---

### Task 2: Frontend API Contract And Local History Helper

**Files:**
- Modify: `src/tests/api-client.test.js`
- Create: `src/tests/ai-consult-history.test.js`
- Create: `src/lib/aiConsultHistory.js`

- [ ] **Step 1: Update API client test for recommendation payloads**

In `src/tests/api-client.test.js`, update the `sends AI consultation messages to the public backend proxy` test response body and expected result:

```javascript
    fetchMock.mockResolvedValueOnce(createJsonResponse({
      code: 0,
      message: 'ok',
      data: {
        reply: '建议先看幼猫配方。',
        recommendations: [
          {
            id: 'p-001',
            title: '鲜肉全价猫粮',
            cover: '/images/products/cat-food.svg',
            memberPrice: 248,
            price: 268,
            tagline: '最推荐'
          }
        ],
        model: 'deepseek-test-model'
      }
    }))

    await expect(sendAiConsultMessage(payload)).resolves.toEqual({
      reply: '建议先看幼猫配方。',
      recommendations: [
        {
          id: 'p-001',
          title: '鲜肉全价猫粮',
          cover: '/images/products/cat-food.svg',
          memberPrice: 248,
          price: 268,
          tagline: '最推荐'
        }
      ],
      model: 'deepseek-test-model'
    })
```

- [ ] **Step 2: Write failing local history helper tests**

Create `src/tests/ai-consult-history.test.js`:

```javascript
import { describe, expect, it } from 'vitest'
import {
  AI_CONSULT_HISTORY_LIMIT,
  clearAiConsultHistory,
  getAiConsultStorageKey,
  loadAiConsultHistory,
  saveAiConsultHistory
} from '@/lib/aiConsultHistory'

function createMemoryStorage(seed = {}) {
  const store = new Map(Object.entries(seed))

  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null
    },
    setItem(key, value) {
      store.set(key, String(value))
    },
    removeItem(key) {
      store.delete(key)
    }
  }
}

describe('ai consult history storage', () => {
  it('uses separate keys for generic and product-context chats', () => {
    expect(getAiConsultStorageKey()).toBe('petlifeAiConsult:general')
    expect(getAiConsultStorageKey('p-001')).toBe('petlifeAiConsult:product:p-001')
  })

  it('saves and restores bounded messages with recommendations', () => {
    const storage = createMemoryStorage()
    const messages = Array.from({ length: AI_CONSULT_HISTORY_LIMIT + 2 }, (_, index) => ({
      id: `m-${index}`,
      role: index % 2 === 0 ? 'user' : 'assistant',
      content: `message ${index}`,
      recommendations: index === AI_CONSULT_HISTORY_LIMIT + 1
        ? [{ id: 'p-001', title: '鲜肉全价猫粮', cover: '/images/products/cat-food.svg', memberPrice: 248 }]
        : []
    }))

    saveAiConsultHistory({ productId: 'p-001', messages }, storage)
    const restored = loadAiConsultHistory('p-001', storage)

    expect(restored.productId).toBe('p-001')
    expect(restored.messages).toHaveLength(AI_CONSULT_HISTORY_LIMIT)
    expect(restored.messages[0].id).toBe('m-2')
    expect(restored.messages.at(-1).recommendations[0].id).toBe('p-001')
  })

  it('returns empty history for malformed storage data', () => {
    const storage = createMemoryStorage({
      'petlifeAiConsult:general': '{not-json'
    })

    expect(loadAiConsultHistory('', storage)).toEqual({
      version: 1,
      productId: '',
      messages: []
    })
  })

  it('clears only the selected context key', () => {
    const storage = createMemoryStorage()
    saveAiConsultHistory({ productId: '', messages: [{ id: 'g', role: 'user', content: '通用' }] }, storage)
    saveAiConsultHistory({ productId: 'p-001', messages: [{ id: 'p', role: 'user', content: '商品' }] }, storage)

    clearAiConsultHistory('p-001', storage)

    expect(loadAiConsultHistory('p-001', storage).messages).toEqual([])
    expect(loadAiConsultHistory('', storage).messages[0].id).toBe('g')
  })
})
```

- [ ] **Step 3: Run frontend helper/API tests and verify they fail**

Run:

```bash
npm run test:client -- src/tests/api-client.test.js src/tests/ai-consult-history.test.js
```

Expected: FAIL because `@/lib/aiConsultHistory` does not exist.

- [ ] **Step 4: Create local history helper**

Create `src/lib/aiConsultHistory.js`:

```javascript
export const AI_CONSULT_HISTORY_VERSION = 1
export const AI_CONSULT_HISTORY_LIMIT = 30

function normalizeProductId(productId = '') {
  return String(productId || '').trim()
}

function normalizeRecommendation(item = {}) {
  return {
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    cover: item.cover,
    price: item.price,
    memberPrice: item.memberPrice,
    originalPrice: item.originalPrice,
    stockStatus: item.stockStatus,
    badge: item.badge,
    tagline: item.tagline
  }
}

function normalizeMessage(message = {}) {
  const role = message.role === 'assistant' ? 'assistant' : 'user'
  const content = typeof message.content === 'string' ? message.content : ''

  return {
    id: message.id || `${role}-${Date.now()}`,
    role,
    content,
    recommendations: Array.isArray(message.recommendations)
      ? message.recommendations.map(normalizeRecommendation).filter((item) => item.id)
      : []
  }
}

function emptyHistory(productId = '') {
  return {
    version: AI_CONSULT_HISTORY_VERSION,
    productId: normalizeProductId(productId),
    messages: []
  }
}

export function getAiConsultStorageKey(productId = '') {
  const normalizedProductId = normalizeProductId(productId)
  return normalizedProductId
    ? `petlifeAiConsult:product:${normalizedProductId}`
    : 'petlifeAiConsult:general'
}

export function loadAiConsultHistory(productId = '', storage = globalThis.localStorage) {
  if (!storage) {
    return emptyHistory(productId)
  }

  try {
    const parsed = JSON.parse(storage.getItem(getAiConsultStorageKey(productId)) || 'null')
    if (!parsed || parsed.version !== AI_CONSULT_HISTORY_VERSION || !Array.isArray(parsed.messages)) {
      return emptyHistory(productId)
    }

    return {
      version: AI_CONSULT_HISTORY_VERSION,
      productId: normalizeProductId(productId),
      messages: parsed.messages.map(normalizeMessage).filter((message) => message.content)
    }
  } catch {
    return emptyHistory(productId)
  }
}

export function saveAiConsultHistory({ productId = '', messages = [] } = {}, storage = globalThis.localStorage) {
  const normalizedProductId = normalizeProductId(productId)
  const normalizedMessages = Array.isArray(messages)
    ? messages.map(normalizeMessage).filter((message) => message.content).slice(-AI_CONSULT_HISTORY_LIMIT)
    : []
  const history = {
    version: AI_CONSULT_HISTORY_VERSION,
    productId: normalizedProductId,
    messages: normalizedMessages,
    updatedAt: new Date().toISOString()
  }

  if (!storage) {
    return history
  }

  try {
    storage.setItem(getAiConsultStorageKey(normalizedProductId), JSON.stringify(history))
  } catch {
    return history
  }

  return history
}

export function clearAiConsultHistory(productId = '', storage = globalThis.localStorage) {
  if (!storage) return

  try {
    storage.removeItem(getAiConsultStorageKey(productId))
  } catch {
    return
  }
}
```

- [ ] **Step 5: Run frontend helper/API tests and verify they pass**

Run:

```bash
npm run test:client -- src/tests/api-client.test.js src/tests/ai-consult-history.test.js
```

Expected: PASS.

- [ ] **Step 6: Inspect API contract and local history helper changes without committing**

Run:

```bash
git diff -- src/tests/api-client.test.js src/tests/ai-consult-history.test.js src/lib/aiConsultHistory.js
```

Expected: Review the diff for only the API contract and local history helper changes. Do not commit for this task.

---

### Task 3: AI Consult View Recommendation Cards And Reset

**Files:**
- Modify: `src/tests/ai-consult-view.test.js`
- Modify: `src/views/AiConsultView.vue`

- [ ] **Step 1: Update AI consult view tests for recommendations, navigation, persistence, and reset**

In `src/tests/ai-consult-view.test.js`, make these changes.

Update imports:

```javascript
import { beforeEach, describe, expect, it, vi } from 'vitest'
```

Keep the existing `sendAiConsultMessage` mock. Replace the router setup in `mountAiConsult` with:

```javascript
  const router = createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/ai-consult', name: 'ai-consult', component: AiConsultView },
      { path: '/product/:id', name: 'product-detail', component: { template: '<div />' } }
    ]
  })
```

Update `beforeEach` to clear browser storage and return recommendations from the mocked API:

```javascript
  beforeEach(() => {
    document.body.innerHTML = ''
    window.localStorage.clear()
    sendAiConsultMessage.mockReset()
    sendAiConsultMessage.mockResolvedValue({
      reply: '真实模型回复：建议先确认年龄、体重和预算。',
      recommendations: [
        {
          id: 'p-001',
          title: '鲜肉全价猫粮',
          subtitle: '低敏冷鲜配方',
          cover: '/images/products/cat-food.svg',
          memberPrice: 248,
          price: 268,
          tagline: '最推荐'
        }
      ],
      model: 'deepseek-test-model'
    })
  })
```

Replace the current `adds user messages and AI replies from the backend API` test with:

```javascript
  it('adds assistant replies with compact recommendation cards', async () => {
    const { wrapper } = await mountAiConsult('/ai-consult?productId=p-001')

    await wrapper.get('[data-test="quick-question-0"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('适合我家宠物吗')
    expect(wrapper.text()).toContain('真实模型回复：建议先确认年龄、体重和预算。')
    expect(wrapper.get('[data-test="consult-recommendation-card"]').text()).toContain('鲜肉全价猫粮')
    expect(wrapper.get('[data-test="consult-recommendation-card"]').text()).toContain('¥248')
    expect(sendAiConsultMessage).toHaveBeenCalledWith({
      message: '适合我家宠物吗',
      messages: [{ role: 'user', content: '适合我家宠物吗' }],
      productId: 'p-001'
    })
  })
```

Append these tests before the failure fallback test:

```javascript
  it('opens product detail when a recommendation card is clicked', async () => {
    const { wrapper } = await mountAiConsult()

    await wrapper.get('[data-test="consult-input"]').setValue('有什么猫粮推荐')
    await wrapper.get('[data-test="consult-send"]').trigger('click')
    await flushPromises()

    await wrapper.get('[data-test="consult-recommendation-card"]').trigger('click')
    await flushPromises()

    expect(wrapper.vm.$router.currentRoute.value.path).toBe('/product/p-001')
  })

  it('restores persisted messages and recommendation cards for the current product context', async () => {
    window.localStorage.setItem('petlifeAiConsult:product:p-001', JSON.stringify({
      version: 1,
      productId: 'p-001',
      messages: [
        { id: 'user-saved', role: 'user', content: '保存的问题', recommendations: [] },
        {
          id: 'ai-saved',
          role: 'assistant',
          content: '保存的回复',
          recommendations: [
            {
              id: 'p-001',
              title: '鲜肉全价猫粮',
              cover: '/images/products/cat-food.svg',
              memberPrice: 248,
              price: 268,
              tagline: '最推荐'
            }
          ]
        }
      ]
    }))

    const { wrapper } = await mountAiConsult('/ai-consult?productId=p-001')

    expect(wrapper.text()).toContain('保存的问题')
    expect(wrapper.text()).toContain('保存的回复')
    expect(wrapper.get('[data-test="consult-recommendation-card"]').text()).toContain('鲜肉全价猫粮')
  })

  it('resets chat messages while preserving product context', async () => {
    const { wrapper, catalogStore } = await mountAiConsult('/ai-consult?productId=p-001')

    await wrapper.get('[data-test="consult-input"]').setValue('预算 200 怎么选')
    await wrapper.get('[data-test="consult-send"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('预算 200 怎么选')

    await wrapper.get('[data-test="consult-reset"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).not.toContain('预算 200 怎么选')
    expect(wrapper.get('[data-test="consult-product-card"]').text()).toContain('鲜肉全价猫粮')
    expect(catalogStore.fetchProductDetail).toHaveBeenCalledWith('p-001')
    expect(window.localStorage.getItem('petlifeAiConsult:product:p-001')).toBeNull()
  })
```

- [ ] **Step 2: Run AI consult view test and verify it fails**

Run:

```bash
npm run test:client -- src/tests/ai-consult-view.test.js
```

Expected: FAIL because recommendation card markup, reset button, and localStorage restore are not implemented.

- [ ] **Step 3: Update AI consult view script**

In `src/views/AiConsultView.vue`, update imports:

```javascript
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { sendAiConsultMessage } from '@/api/public'
import IconSvg from '@/components/IconSvg.vue'
import PriceText from '@/components/PriceText.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import {
  clearAiConsultHistory,
  loadAiConsultHistory,
  saveAiConsultHistory
} from '@/lib/aiConsultHistory'
import { useCatalogStore } from '@/stores/catalog'
```

Add router and history helpers near the top of the script:

```javascript
const router = useRouter()
```

Replace the existing `watch(productId, ...)` block with:

```javascript
function restoreMessages(id = productId.value) {
  messages.value = loadAiConsultHistory(id).messages
}

function persistMessages() {
  saveAiConsultHistory({
    productId: productId.value,
    messages: messages.value
  })
}

function resetChat() {
  clearAiConsultHistory(productId.value)
  messages.value = []
  scrollMessages()
}

function openRecommendation(product) {
  if (!product?.id) return
  router.push({ name: 'product-detail', params: { id: product.id } })
}

function messageHistoryPayload() {
  return messages.value.map((message) => ({
    role: message.role,
    content: message.content
  }))
}

watch(
  productId,
  (id) => {
    restoreMessages(id)

    if (id) {
      catalogStore.fetchProductDetail(id)
    }
  },
  { immediate: true }
)
```

Replace the `try` block in `sendMessage` with:

```javascript
  try {
    const response = await sendAiConsultMessage({
      message: content,
      messages: messageHistoryPayload(),
      productId: productId.value || undefined
    })

    messages.value.push({
      id: `ai-${Date.now()}-${messages.value.length}`,
      role: 'assistant',
      content: response.reply,
      recommendations: response.recommendations || []
    })
    persistMessages()
  } catch {
    messages.value.push({
      id: `ai-${Date.now()}-${messages.value.length}`,
      role: 'assistant',
      content: 'AI 服务暂时不可用，请稍后再试。你也可以先补充宠物年龄、体重、预算和过敏情况。',
      recommendations: []
    })
    persistMessages()
  } finally {
    sending.value = false
    scrollMessages()
  }
```

Immediately after pushing the user message in `sendMessage`, persist that optimistic state:

```javascript
  messages.value.push({ id: `user-${Date.now()}-${messages.value.length}`, role: 'user', content, recommendations: [] })
  inputText.value = ''
  sending.value = true
  persistMessages()
  scrollMessages()
```

- [ ] **Step 4: Update AI consult view template**

In the quick-question section header, replace:

```vue
        <p class="consult__section-label">快捷问题</p>
```

with:

```vue
        <div class="consult__quick-head">
          <p class="consult__section-label">快捷问题</p>
          <button
            v-if="messages.length"
            type="button"
            class="consult__reset"
            data-test="consult-reset"
            @click="resetChat"
          >
            重置聊天
          </button>
        </div>
```

Inside the message loop, replace:

```vue
          <p>{{ message.content }}</p>
```

with:

```vue
          <div class="consult__message-content">
            <p>{{ message.content }}</p>
            <div
              v-if="message.role === 'assistant' && message.recommendations?.length"
              class="consult__recommendations"
            >
              <button
                v-for="item in message.recommendations"
                :key="item.id"
                type="button"
                class="consult__recommendation-card"
                data-test="consult-recommendation-card"
                @click="openRecommendation(item)"
              >
                <img :src="item.cover" :alt="item.title" />
                <span class="consult__recommendation-body">
                  <strong>{{ item.title }}</strong>
                  <span class="consult__recommendation-meta">
                    <PriceText :value="item.memberPrice ?? item.price" size="sm" />
                    <em>{{ item.tagline || '推荐' }}</em>
                  </span>
                </span>
              </button>
            </div>
          </div>
```

- [ ] **Step 5: Update AI consult view styles**

In `src/views/AiConsultView.vue`, add these styles near the existing quick/message styles:

```css
.consult__quick-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.consult__reset {
  min-height: 28px;
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  color: var(--color-text-mute);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
}

.consult__message-content {
  display: grid;
  gap: var(--space-2);
  max-width: min(78%, 300px);
}
```

Replace the existing `.consult__message p` width rule:

```css
.consult__message p {
  max-width: min(78%, 300px);
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}
```

with:

```css
.consult__message p {
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}
```

Add recommendation card styles:

```css
.consult__recommendations {
  display: grid;
  gap: var(--space-2);
  justify-items: start;
}

.consult__recommendation-card {
  display: grid;
  width: 190px;
  overflow: hidden;
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  text-align: left;
  box-shadow: var(--shadow-sm);
}

.consult__recommendation-card img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  background: var(--color-surface-warm);
}

.consult__recommendation-body {
  display: grid;
  gap: 5px;
  padding: var(--space-2) var(--space-3);
}

.consult__recommendation-body strong {
  overflow: hidden;
  color: var(--color-text);
  font-size: var(--text-sm);
  font-weight: var(--weight-bold);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.consult__recommendation-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.consult__recommendation-meta em {
  color: var(--color-primary);
  font-size: var(--text-2xs);
  font-style: normal;
  font-weight: var(--weight-bold);
  white-space: nowrap;
}
```

- [ ] **Step 6: Run AI consult view test and verify it passes**

Run:

```bash
npm run test:client -- src/tests/ai-consult-view.test.js
```

Expected: PASS.

- [ ] **Step 7: Inspect AI consult view UI and persistence integration without committing**

Run:

```bash
git diff -- src/tests/ai-consult-view.test.js src/views/AiConsultView.vue
```

Expected: Review the diff for only the AI consult view UI and persistence integration changes. Do not commit for this task.

---

### Task 4: Full Verification And Browser Check

**Files:**
- No source edits expected unless verification reveals a defect.

- [ ] **Step 1: Run focused backend tests**

Run:

```bash
npm --prefix server run test -- tests/ai-consult-api.test.js
```

Expected: PASS.

- [ ] **Step 2: Run focused frontend tests**

Run:

```bash
npm run test:client -- src/tests/api-client.test.js src/tests/ai-consult-history.test.js src/tests/ai-consult-view.test.js
```

Expected: PASS.

- [ ] **Step 3: Run full test suites**

Run:

```bash
npm --prefix server run test
npm run test:client
```

Expected: PASS. Existing non-fatal Vue Router warnings in `router-shell.test.js` may still print; the exit code must be 0.

- [ ] **Step 4: Run production build**

Run:

```bash
npm run build
```

Expected: PASS. Existing chunk-size warnings may still print; the exit code must be 0.

- [ ] **Step 5: Start local servers if they are not already running**

Check ports:

```bash
lsof -iTCP:8787 -sTCP:LISTEN -n -P
lsof -iTCP:5173 -sTCP:LISTEN -n -P
```

If backend is not running:

```bash
npm --prefix server run dev
```

If frontend is not running:

```bash
npm run dev
```

Expected frontend URL: `http://localhost:5173/`. Expected backend URL: `http://127.0.0.1:8787`.

- [ ] **Step 6: Browser-verify the user workflow**

Use browser automation to verify:

1. Navigate to `http://localhost:5173/#/ai-consult`.
2. Type `有什么适合成猫的猫粮推荐？`.
3. Send the message.
4. Confirm the assistant reply appears.
5. Confirm 1 compact vertical recommendation card appears under the assistant reply.
6. Click the recommendation card.
7. Confirm the browser navigates to `/product/<id>`.
8. Navigate back to `/ai-consult`.
9. Confirm messages and recommendation card restore from `localStorage`.
10. Click `重置聊天`.
11. Confirm messages disappear.

- [ ] **Step 7: Browser-verify product context reset behavior**

Use browser automation to verify:

1. Navigate to `http://localhost:5173/#/ai-consult?productId=p-001`.
2. Confirm the product context card shows `鲜肉全价猫粮`.
3. Send `这款适合成猫吗？`.
4. Confirm assistant reply appears.
5. Click `重置聊天`.
6. Confirm messages disappear.
7. Confirm the product context card still shows `鲜肉全价猫粮`.

- [ ] **Step 8: Inspect git status**

Run:

```bash
git status --short
```

Expected: clean tracked worktree. Ignored files such as `.env`, `.superpowers/`, `dist/`, `node_modules/`, and server data remain ignored and are not committed.
