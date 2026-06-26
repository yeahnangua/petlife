# Admin AI Product Detail API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect both admin product form AI helpers to a real authenticated DeepSeek/SiliconFlow-backed draft API.

**Architecture:** Add one admin-only endpoint, `POST /api/admin/products/ai-draft`, that accepts `mode: "intro" | "specs"`, builds a JSON-only model prompt, validates the returned draft shape, and returns only form-writable draft fields. Keep product persistence unchanged. The admin Vue form calls the new endpoint from the existing AI buttons, preserves current overwrite behavior, and shows scoped errors without closing or saving the product form.

**Tech Stack:** Express, Vitest, Supertest, existing SiliconFlow-compatible chat client, Vue 3 `<script setup>`, Vue Test Utils, admin Vite app.

---

## File Structure

- Create: `server/src/services/adminProductAiDraftService.js`
  - Owns prompt construction, request validation, model call, JSON parsing, and draft validation for admin product AI generation.
- Modify: `server/src/controllers/adminProductController.js`
  - Adds async `createProductAiDraft()` controller and returns `{ draft, model, usage }` via existing `success()`.
- Modify: `server/src/routes/admin.js`
  - Registers `POST /products/ai-draft` inside the existing authenticated admin router.
- Create: `server/tests/admin-ai-product-draft.test.js`
  - Covers admin auth, intro generation, specs generation, invalid model output, and invalid requests.
- Modify: `admin/src/api/catalog.js`
  - Adds `generateProductAiDraft(payload)` for the admin form.
- Modify: `admin/src/components/ProductFormDialog.vue`
  - Replaces local mock intro/spec generation with async API calls while preserving current UI placement and field writes.
- Modify: `admin/src/tests/product-form-dialog.test.js`
  - Mocks the new API client and verifies success/error behavior for both AI helpers.

## Task 1: Backend Contract Tests

**Files:**

- Create: `server/tests/admin-ai-product-draft.test.js`

- [ ] **Step 1: Write failing backend tests**

Create `server/tests/admin-ai-product-draft.test.js` with:

```javascript
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
```

- [ ] **Step 2: Verify the backend tests fail for the expected reason**

Run:

```bash
npm --prefix server run test -- tests/admin-ai-product-draft.test.js
```

Expected:

- FAIL.
- The failure is a 404 for `/api/admin/products/ai-draft` or an import/route missing failure.
- The failure is not a syntax error in the test file.

## Task 2: Backend AI Draft Endpoint

**Files:**

- Create: `server/src/services/adminProductAiDraftService.js`
- Modify: `server/src/controllers/adminProductController.js`
- Modify: `server/src/routes/admin.js`
- Test: `server/tests/admin-ai-product-draft.test.js`

- [ ] **Step 1: Create the admin product AI draft service**

Create `server/src/services/adminProductAiDraftService.js` with:

```javascript
import { AppError } from '../utils/appError.js'
import { requireEnum, requireString } from '../utils/validators.js'

const MAX_PROMPT_LENGTH = 1200
const MAX_CONTEXT_TEXT_LENGTH = 200
const MAX_TAGS = 6
const MAX_SUMMARY_ITEMS = 4
const MAX_SPEC_GROUPS = 8
const MAX_SPEC_OPTIONS = 12

const BASE_SYSTEM_PROMPT = [
  '你是 PetLife 宠物生活馆后台商品资料编辑助手。',
  '你只为后台商品表单生成草稿字段，不要输出 Markdown 或额外解释。',
  '必须输出 JSON 对象。',
  '不要编造医疗功效、库存、优惠、认证、平台承诺或未提供的成分比例。',
  '涉及疾病、处方、治疗、严重异常时，只能使用温和的日常适配描述。'
].join('\n')

const INTRO_OUTPUT_PROMPT = [
  '生成商品介绍草稿。',
  '输出 JSON 格式：',
  '{"tags":["短标签1","短标签2","短标签3"],"summary":["摘要1","摘要2"],"suitable_text":"适用描述"}',
  '字段规则：',
  '- tags 必须是 3-6 个短中文标签。',
  '- summary 必须是 2-4 条中文摘要，每条不超过 40 个中文字符。',
  '- suitable_text 必须是中文字符串，不超过 80 个中文字符。',
  '- 只能基于提供的商品上下文生成。'
].join('\n')

const SPECS_OUTPUT_PROMPT = [
  '生成规格 JSON 草稿。',
  '输出 JSON 格式：',
  '{"specs":[{"group":"规格","options":["选项1","选项2"]}]}',
  '字段规则：',
  '- specs 必须是数组。',
  '- 每项必须包含 group 和 options。',
  '- group 必须是非空中文字符串。',
  '- options 必须是 1-12 个非空字符串。',
  '- 不确定时返回最保守的规格结构，但不能返回坏 JSON。'
].join('\n')

function trimText(value, maxLength = MAX_CONTEXT_TEXT_LENGTH) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim().slice(0, maxLength)
}

function trimStringList(value, maxItems, maxItemLength = 40) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => trimText(item, maxItemLength))
    .filter(Boolean)
    .slice(0, maxItems)
}

function normalizeProductContext(value = {}) {
  return {
    category_id: trimText(value.category_id, 80),
    category_name: trimText(value.category_name, 80),
    pet_type: trimText(value.pet_type, 40),
    pet_type_label: trimText(value.pet_type_label, 40),
    title: trimText(value.title, 120),
    subtitle: trimText(value.subtitle, 160),
    price: Number.isFinite(Number(value.price)) ? Number(value.price) : null,
    member_price: Number.isFinite(Number(value.member_price)) ? Number(value.member_price) : null,
    original_price: Number.isFinite(Number(value.original_price)) ? Number(value.original_price) : null,
    badge: trimText(value.badge, 40),
    tags: trimStringList(value.tags, 8, 30),
    summary: trimStringList(value.summary, 6, 80),
    suitable_text: trimText(value.suitable_text, 120)
  }
}

function requireIntroContext(product) {
  requireString(product.category_name, 'product.category_name')
  requireString(product.pet_type, 'product.pet_type')
  requireString(product.title, 'product.title')
  requireString(product.subtitle, 'product.subtitle')
}

function formatProductContext(product) {
  const lines = [
    `分类：${product.category_name}`,
    `宠物类型：${product.pet_type_label || product.pet_type}`,
    `标题：${product.title}`,
    `副标题：${product.subtitle}`,
    product.price != null ? `价格：${product.price}` : '',
    product.member_price != null ? `会员价：${product.member_price}` : '',
    product.original_price != null ? `原价：${product.original_price}` : '',
    product.badge ? `角标：${product.badge}` : '',
    product.tags.length ? `已有标签：${product.tags.join('、')}` : '',
    product.summary.length ? `已有摘要：${product.summary.join('；')}` : '',
    product.suitable_text ? `已有适用描述：${product.suitable_text}` : ''
  ]

  return lines.filter(Boolean).join('\n')
}

function parseJsonObject(content) {
  const text = trimText(content, 6000)

  if (!text) {
    throw new AppError(502, 50202, 'AI generated invalid draft')
  }

  try {
    const parsed = JSON.parse(text)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('not object')
    }
    return parsed
  } catch {
    throw new AppError(502, 50202, 'AI generated invalid draft')
  }
}

function normalizeBoundedList(value, fieldName, { min, max, itemLength }) {
  const items = trimStringList(value, max, itemLength)

  if (items.length < min) {
    throw new AppError(502, 50202, 'AI generated invalid draft')
  }

  return items
}

function normalizeIntroDraft(parsed) {
  const tags = normalizeBoundedList(parsed.tags, 'tags', {
    min: 3,
    max: MAX_TAGS,
    itemLength: 24
  })
  const summary = normalizeBoundedList(parsed.summary, 'summary', {
    min: 2,
    max: MAX_SUMMARY_ITEMS,
    itemLength: 80
  })
  const suitableText = trimText(parsed.suitable_text, 80)

  if (!suitableText) {
    throw new AppError(502, 50202, 'AI generated invalid draft')
  }

  return {
    tags,
    summary,
    suitable_text: suitableText
  }
}

function normalizeSpecsDraft(parsed) {
  if (!Array.isArray(parsed.specs)) {
    throw new AppError(502, 50202, 'AI generated invalid draft')
  }

  const specs = parsed.specs
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return null
      }

      const group = trimText(item.group, 40)
      const options = trimStringList(item.options, MAX_SPEC_OPTIONS, 40)

      if (!group || options.length === 0) {
        return null
      }

      return { group, options }
    })
    .filter(Boolean)
    .slice(0, MAX_SPEC_GROUPS)

  if (specs.length === 0) {
    throw new AppError(502, 50202, 'AI generated invalid draft')
  }

  return { specs }
}

function buildMessages({ mode, product, prompt }) {
  const messages = [{ role: 'system', content: BASE_SYSTEM_PROMPT }]

  if (mode === 'intro') {
    messages.push({ role: 'system', content: INTRO_OUTPUT_PROMPT })
    messages.push({
      role: 'user',
      content: ['商品上下文：', formatProductContext(product), '请生成商品介绍草稿。'].join('\n')
    })
    return messages
  }

  messages.push({ role: 'system', content: SPECS_OUTPUT_PROMPT })
  messages.push({
    role: 'user',
    content: [
      '商品上下文：',
      formatProductContext(product),
      '规格自然语言描述：',
      prompt,
      '请生成规格 JSON 草稿。'
    ].join('\n')
  })
  return messages
}

export async function createAdminProductAiDraft({ config, chatClient, body = {} }) {
  const mode = requireEnum(body.mode, ['intro', 'specs'], 'mode')
  const product = normalizeProductContext(body.product)
  const prompt = trimText(body.prompt, MAX_PROMPT_LENGTH)

  if (mode === 'intro') {
    requireIntroContext(product)
  }

  if (mode === 'specs' && !prompt) {
    throw new AppError(400, 40000, 'prompt is required')
  }

  const result = await chatClient({
    model: config.aiModel,
    messages: buildMessages({ mode, product, prompt }),
    responseFormat: { type: 'json_object' }
  })
  const parsed = parseJsonObject(result.content)
  const draft = mode === 'intro' ? normalizeIntroDraft(parsed) : normalizeSpecsDraft(parsed)

  return {
    draft,
    model: result.model ?? config.aiModel,
    usage: result.usage ?? null
  }
}
```

- [ ] **Step 2: Wire the controller**

Modify `server/src/controllers/adminProductController.js`.

Change the service import to:

```javascript
import {
  createAdminProduct,
  deleteAdminProduct,
  getAdminProducts,
  updateAdminProduct
} from '../services/adminCatalogService.js'
import { createAdminProductAiDraft } from '../services/adminProductAiDraftService.js'
```

Add this controller after `listAdminProducts()`:

```javascript
export async function createProductAiDraft(req, res, next) {
  try {
    const data = await createAdminProductAiDraft({
      config: req.app.locals.config,
      chatClient: req.app.locals.aiChatClient,
      body: req.body
    })
    res.json(success(data))
  } catch (error) {
    next(error)
  }
}
```

- [ ] **Step 3: Register the admin route**

Modify `server/src/routes/admin.js`.

Change the product controller import to:

```javascript
import {
  createProduct,
  createProductAiDraft,
  deleteProduct,
  listAdminProducts,
  updateProduct
} from '../controllers/adminProductController.js'
```

Add the route with the product routes:

```javascript
router.get('/products', listAdminProducts)
router.post('/products/ai-draft', createProductAiDraft)
router.post('/products', createProduct)
router.put('/products/:id', updateProduct)
router.delete('/products/:id', deleteProduct)
```

- [ ] **Step 4: Verify backend tests pass**

Run:

```bash
npm --prefix server run test -- tests/admin-ai-product-draft.test.js
```

Expected:

- PASS.
- All five tests in `admin-ai-product-draft.test.js` pass.

- [ ] **Step 5: Run focused existing AI tests**

Run:

```bash
npm --prefix server run test -- tests/ai-consult-api.test.js tests/admin-catalog.test.js
```

Expected:

- PASS.
- Existing public AI consult behavior still uses `aiConsultService.js`.
- Existing admin catalog CRUD behavior is unchanged.

- [ ] **Step 6: Commit the backend API**

Run:

```bash
git add server/src/services/adminProductAiDraftService.js server/src/controllers/adminProductController.js server/src/routes/admin.js server/tests/admin-ai-product-draft.test.js
git commit -m "feat: add admin product ai draft api"
```

Expected:

- A commit containing only backend endpoint and backend test changes.

## Task 3: Frontend Contract Tests

**Files:**

- Modify: `admin/src/tests/product-form-dialog.test.js`

- [ ] **Step 1: Replace the component tests with API-backed expectations**

Modify `admin/src/tests/product-form-dialog.test.js` to:

```javascript
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { generateProductAiDraft } from '@/api/catalog'
import ProductFormDialog from '@/components/ProductFormDialog.vue'

vi.mock('@/api/catalog', () => ({
  generateProductAiDraft: vi.fn()
}))

const categories = [
  {
    id: 'cat-food',
    name: '主粮'
  }
]

function mountDialog(initialValue = {}) {
  return mount(ProductFormDialog, {
    props: {
      modelValue: true,
      categories,
      initialValue: {
        id: 'p_001',
        category_id: 'cat-food',
        title: '鲜肉全价猫粮',
        subtitle: '低敏冷鲜配方 · 成猫通用',
        pet_type: 'cat',
        price: 268,
        member_price: 248,
        original_price: 298,
        stock: 42,
        stock_status: 'inStock',
        badge: '热卖',
        tags: ['旧标签'],
        specs: [{ group: '旧规格', options: ['旧选项'] }],
        summary: ['旧摘要'],
        suitable_text: '旧适用描述',
        cover_url: '/uploads/product.jpg',
        status: 'active',
        image_urls: [],
        ...initialValue
      }
    },
    global: {
      stubs: {
        UploadImageField: {
          props: ['modelValue', 'label', 'multiple'],
          template: '<div class="upload-image-field-stub">{{ label }}</div>'
        }
      }
    }
  })
}

describe('ProductFormDialog AI helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('overwrites tags summary and suitable text from the AI intro draft api', async () => {
    generateProductAiDraft.mockResolvedValue({
      draft: {
        tags: ['低敏', '成猫', '鲜肉配方'],
        summary: ['鲜肉配方，适合作为成猫日常主粮', '颗粒适口，兼顾营养和消化负担'],
        suitable_text: '适合 1-8 岁成猫日常喂养'
      }
    })
    const wrapper = mountDialog()

    await wrapper.get('[data-test="generate-intro"]').trigger('click')
    await flushPromises()

    const tags = wrapper.get('[data-test="product-tags"]').element
    const summary = wrapper.get('[data-test="product-summary"]').element
    const suitable = wrapper.get('[data-test="product-suitable"]').element

    expect(generateProductAiDraft).toHaveBeenCalledWith({
      mode: 'intro',
      product: expect.objectContaining({
        category_id: 'cat-food',
        category_name: '主粮',
        pet_type: 'cat',
        pet_type_label: '猫',
        title: '鲜肉全价猫粮',
        subtitle: '低敏冷鲜配方 · 成猫通用',
        tags: ['旧标签'],
        summary: ['旧摘要'],
        suitable_text: '旧适用描述'
      })
    })
    expect(tags.value).toBe('低敏, 成猫, 鲜肉配方')
    expect(summary.value).toBe('鲜肉配方，适合作为成猫日常主粮\n颗粒适口，兼顾营养和消化负担')
    expect(suitable.value).toBe('适合 1-8 岁成猫日常喂养')
  })

  it('keeps intro fields unchanged and shows an error when intro generation fails', async () => {
    generateProductAiDraft.mockRejectedValue(new Error('AI service request failed'))
    const wrapper = mountDialog()

    await wrapper.get('[data-test="generate-intro"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('AI service request failed')
    expect(wrapper.get('[data-test="product-tags"]').element.value).toBe('旧标签')
    expect(wrapper.get('[data-test="product-summary"]').element.value).toBe('旧摘要')
    expect(wrapper.get('[data-test="product-suitable"]').element.value).toBe('旧适用描述')
  })

  it('writes formatted specs JSON from the AI specs draft api', async () => {
    const specs = [
      { group: '规格', options: ['1.5kg', '3kg', '6kg'] },
      { group: '口味', options: ['鸡肉', '三文鱼', '牛肉'] }
    ]
    generateProductAiDraft.mockResolvedValue({
      draft: { specs }
    })
    const wrapper = mountDialog()

    await wrapper.get('[data-test="open-specs-ai"]').trigger('click')
    await wrapper
      .get('[data-test="specs-ai-prompt"]')
      .setValue('规格有 1.5kg 3kg 和 6kg ，口味有鸡肉 三文鱼 和牛肉')
    await wrapper.get('[data-test="generate-specs-json"]').trigger('click')
    await flushPromises()

    const specsField = wrapper.get('[data-test="product-specs"]').element
    const expectedText = JSON.stringify(specs, null, 2)

    expect(generateProductAiDraft).toHaveBeenCalledWith({
      mode: 'specs',
      prompt: '规格有 1.5kg 3kg 和 6kg ，口味有鸡肉 三文鱼 和牛肉',
      product: expect.objectContaining({
        category_name: '主粮',
        pet_type: 'cat',
        title: '鲜肉全价猫粮',
        subtitle: '低敏冷鲜配方 · 成猫通用'
      })
    })
    expect(specsField.value).toBe(expectedText)
    expect(wrapper.get('.ai-modal__preview').text()).toBe(expectedText)
  })

  it('does not call the AI draft api when the specs prompt is empty', async () => {
    const wrapper = mountDialog()

    await wrapper.get('[data-test="open-specs-ai"]').trigger('click')
    await wrapper.get('[data-test="generate-specs-json"]').trigger('click')

    expect(generateProductAiDraft).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('请输入规格描述')
  })

  it('keeps specs JSON unchanged and shows an error when specs generation fails', async () => {
    generateProductAiDraft.mockRejectedValue(new Error('AI generated invalid draft'))
    const wrapper = mountDialog()
    const originalSpecsText = JSON.stringify([{ group: '旧规格', options: ['旧选项'] }], null, 2)

    await wrapper.get('[data-test="open-specs-ai"]').trigger('click')
    await wrapper.get('[data-test="specs-ai-prompt"]').setValue('规格有 1.5kg')
    await wrapper.get('[data-test="generate-specs-json"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('AI generated invalid draft')
    expect(wrapper.get('[data-test="product-specs"]').element.value).toBe(originalSpecsText)
  })

  it('dims the product form background while the specs AI dialog is open', async () => {
    const wrapper = mountDialog()

    expect(wrapper.find('[data-test="specs-ai-backdrop"]').exists()).toBe(false)

    await wrapper.get('[data-test="open-specs-ai"]').trigger('click')

    expect(wrapper.get('[data-test="specs-ai-backdrop"]').classes()).toContain('ai-modal-backdrop')
  })
})
```

- [ ] **Step 2: Verify the frontend tests fail for the expected reason**

Run:

```bash
npm --prefix admin run test -- src/tests/product-form-dialog.test.js
```

Expected:

- FAIL.
- The failure shows `generateProductAiDraft` is not exported from `@/api/catalog`, or the component still writes the old mock values.
- The failure is not a syntax error in the test file.

## Task 4: Frontend API Integration

**Files:**

- Modify: `admin/src/api/catalog.js`
- Modify: `admin/src/components/ProductFormDialog.vue`
- Test: `admin/src/tests/product-form-dialog.test.js`

- [ ] **Step 1: Add the admin API client function**

Add this function to `admin/src/api/catalog.js` after `deleteProduct()`:

```javascript
export function generateProductAiDraft(payload) {
  return request('/api/admin/products/ai-draft', {
    method: 'POST',
    body: payload
  })
}
```

- [ ] **Step 2: Import the API client and add generation state**

Modify `admin/src/components/ProductFormDialog.vue`.

Add the API import after the Vue import:

```javascript
import { generateProductAiDraft } from '@/api/catalog'
```

Add these refs near the existing AI refs:

```javascript
const introAiError = ref('')
const specsGenerating = ref(false)
```

Update `syncForm()` to clear AI request state:

```javascript
introAiError.value = ''
specsAiOpen.value = false
specsAiPrompt.value = ''
specsAiError.value = ''
specsAiPreview.value = ''
specsGenerating.value = false
```

- [ ] **Step 3: Add a product context builder**

Add this function before `generateIntro()`:

```javascript
function buildProductAiContext() {
  return {
    category_id: form.category_id,
    category_name: selectedCategory.value?.name || '',
    pet_type: form.pet_type,
    pet_type_label: getPetTypeLabel(form.pet_type) || form.pet_type,
    title: form.title.trim(),
    subtitle: form.subtitle.trim(),
    price: Number(form.price),
    member_price: Number(form.member_price),
    original_price: Number(form.original_price),
    badge: form.badge.trim(),
    tags: splitValues(form.tags_text),
    summary: splitValues(form.summary_text),
    suitable_text: form.suitable_text.trim()
  }
}
```

- [ ] **Step 4: Replace local intro mock generation with the API call**

Delete `generateIntroDraft()`.

Replace `generateIntro()` with:

```javascript
async function generateIntro() {
  if (!introContextReady.value || introGenerating.value) {
    return
  }

  introGenerating.value = true
  introAiError.value = ''

  try {
    const data = await generateProductAiDraft({
      mode: 'intro',
      product: buildProductAiContext()
    })
    const draft = data.draft || {}
    form.tags_text = Array.isArray(draft.tags) ? draft.tags.join(', ') : ''
    form.summary_text = Array.isArray(draft.summary) ? listToText(draft.summary) : ''
    form.suitable_text = draft.suitable_text || ''
  } catch (requestError) {
    introAiError.value = requestError instanceof Error ? requestError.message : 'AI 介绍生成失败'
  } finally {
    introGenerating.value = false
  }
}
```

- [ ] **Step 5: Replace local specs mock generation with the API call**

Delete `extractOptionsAfterKeyword()` and `generateSpecsDraft()`.

Update `closeSpecsAiDialog()`:

```javascript
function closeSpecsAiDialog() {
  if (specsGenerating.value) {
    return
  }

  specsAiOpen.value = false
  specsAiError.value = ''
}
```

Replace `generateSpecsJson()` with:

```javascript
async function generateSpecsJson() {
  const prompt = specsAiPrompt.value.trim()

  if (!prompt) {
    specsAiError.value = '请输入规格描述'
    specsAiPreview.value = ''
    return
  }

  if (specsGenerating.value) {
    return
  }

  specsGenerating.value = true
  specsAiError.value = ''
  specsAiPreview.value = ''

  try {
    const data = await generateProductAiDraft({
      mode: 'specs',
      prompt,
      product: buildProductAiContext()
    })
    const specs = Array.isArray(data.draft?.specs) ? data.draft.specs : []
    const text = JSON.stringify(specs, null, 2)
    form.specs_text = text
    specsAiPreview.value = text
  } catch (requestError) {
    specsAiError.value = requestError instanceof Error ? requestError.message : 'AI 规格生成失败'
  } finally {
    specsGenerating.value = false
  }
}
```

- [ ] **Step 6: Render scoped errors and loading state**

In the `AI 介绍生成` helper block, add the error paragraph inside the left `<div>` after `<small>`:

```vue
<p v-if="introAiError" class="dialog-card__error">{{ introAiError }}</p>
```

In the specs modal generate button, add disabled state and loading text:

```vue
<button
  type="button"
  class="button-primary"
  data-test="generate-specs-json"
  :disabled="specsGenerating"
  @click="generateSpecsJson"
>
  {{ specsGenerating ? '生成中...' : '生成 JSON' }}
</button>
```

- [ ] **Step 7: Verify focused frontend tests pass**

Run:

```bash
npm --prefix admin run test -- src/tests/product-form-dialog.test.js
```

Expected:

- PASS.
- All ProductFormDialog AI helper tests pass.

- [ ] **Step 8: Run admin test suite**

Run:

```bash
npm --prefix admin run test
```

Expected:

- PASS.
- Existing admin session, upload, and catalog tests are not broken.

- [ ] **Step 9: Commit the frontend integration**

Run:

```bash
git add admin/src/api/catalog.js admin/src/components/ProductFormDialog.vue admin/src/tests/product-form-dialog.test.js
git commit -m "feat: connect admin product ai draft ui"
```

Expected:

- A commit containing only admin frontend API integration and component test changes.

## Task 5: Full Verification

**Files:**

- No new source files. This task only verifies the completed branch.

- [ ] **Step 1: Run server tests**

Run:

```bash
npm --prefix server run test
```

Expected:

- PASS.
- Existing public AI consult tests and new admin AI draft tests pass together.

- [ ] **Step 2: Run admin tests**

Run:

```bash
npm --prefix admin run test
```

Expected:

- PASS.
- Product form dialog tests pass with the mocked API client.

- [ ] **Step 3: Build the admin app**

Run:

```bash
npm --prefix admin run build
```

Expected:

- PASS.
- Vite completes the admin production build.

- [ ] **Step 4: Inspect git status**

Run:

```bash
git status --short --branch
```

Expected:

- Only the pre-existing untracked `docs/superpowers/plans/2026-06-25-ai-structured-recommendation-chat.md` may remain.
- No uncommitted source or test changes from this feature remain.

- [ ] **Step 5: Report completion**

In the final response, include:

```text
Implemented the authenticated admin AI product draft API and connected both ProductFormDialog AI helpers to it.
Verified with:
- npm --prefix server run test
- npm --prefix admin run test
- npm --prefix admin run build
Commits:
- feat: add admin product ai draft api
- feat: connect admin product ai draft ui
```

## Self-Review Notes

- Spec coverage: The plan covers the single admin endpoint, both `intro` and `specs` modes, admin auth, model JSON response format, backend validation, frontend scoped loading/errors, no auto-save, no DB changes, and verification commands.
- Scope: The plan does not touch product persistence or user-facing product detail display.
- Type consistency: The endpoint returns `{ draft, model, usage }`; frontend reads `data.draft.tags`, `data.draft.summary`, `data.draft.suitable_text`, and `data.draft.specs`.
