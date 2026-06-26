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

function normalizeBoundedList(value, { min, max, itemLength }) {
  const items = trimStringList(value, max, itemLength)

  if (items.length < min) {
    throw new AppError(502, 50202, 'AI generated invalid draft')
  }

  return items
}

function normalizeIntroDraft(parsed) {
  const tags = normalizeBoundedList(parsed.tags, {
    min: 3,
    max: MAX_TAGS,
    itemLength: 24
  })
  const summary = normalizeBoundedList(parsed.summary, {
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
