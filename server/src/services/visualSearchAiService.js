import { AppError } from '../utils/appError.js'

const MAX_LABELS = 12
const MAX_PRODUCTS = 120
const MAX_TEXT_LENGTH = 240
const MAX_REASON_LENGTH = 160

const categoryLabelMap = {
  food: '主粮',
  snack: '零食',
  litter: '猫砂',
  toy: '玩具',
  clean: '洗护',
  travel: '出行',
  care: '保健',
  home: '居家'
}

const petTypeLabelMap = {
  cat: '猫咪',
  dog: '狗狗',
  all: '猫犬通用'
}

const SYSTEM_PROMPT = [
  '你是 PetLife 宠物商城的以图搜商品相似度评估器。',
  '根据图片识别标签和商品目录，判断每个商品与查询图片的语义相似度。',
  '重点比较商品标题、副标题、后台标签、分类和适用宠物，不要只做字面匹配。',
  '必须用中文输出展示标签和原因。',
  '不要在输出中保留英文识别标签、英文关键词或内部枚举值，需要先翻译成中文。',
  '你必须输出 JSON 对象，不要输出 Markdown 或额外解释。'
].join('\n')

const OUTPUT_PROMPT = [
  '输出 JSON 格式：',
  '{"labels":["给用户看的中文识别标签"],"items":[{"id":"商品id","aiSimilarity":0,"reason":"中文原因"}]}',
  '字段规则：',
  '- labels 必须是中文，最多 5 个，用于替代模型原始英文标签展示。',
  '- items 必须覆盖输入商品列表里的商品 id。',
  '- aiSimilarity 是 0-100 的整数，100 表示最相似。',
  '- reason 用中文简短说明语义相似或不相似的原因。'
].join('\n')

function trimText(value, maxLength = MAX_TEXT_LENGTH) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim().slice(0, maxLength)
}

function normalizeStringArray(value, { maxItems = MAX_LABELS, maxLength = 80 } = {}) {
  if (!Array.isArray(value)) {
    return []
  }

  return [
    ...new Set(
      value
        .map((item) => trimText(item, maxLength))
        .filter(Boolean)
    )
  ].slice(0, maxItems)
}

function clampScore(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return null
  return Math.max(0, Math.min(100, Math.round(number)))
}

function translateCategory(value) {
  const category = trimText(value, 80)
  return categoryLabelMap[category] || category
}

function translatePetType(value) {
  const petType = trimText(value, 40)
  return petTypeLabelMap[petType] || petType
}

function normalizeRecognition(value = {}) {
  return {
    labels: normalizeStringArray(value.labels),
    keywords: normalizeStringArray(value.keywords),
    categoryHints: normalizeStringArray(value.categoryHints)
  }
}

function normalizeProduct(value = {}) {
  const id = trimText(value.id, 80)
  if (!id) {
    return null
  }

  return {
    id,
    title: trimText(value.title),
    subtitle: trimText(value.subtitle),
    tags: normalizeStringArray(value.tags, { maxItems: 16, maxLength: 80 }),
    category: trimText(value.category, 80),
    petType: trimText(value.petType, 40)
  }
}

function normalizeProducts(value) {
  if (!Array.isArray(value)) {
    return []
  }

  const productsById = new Map()
  value.forEach((item) => {
    const product = normalizeProduct(item)
    if (product && !productsById.has(product.id)) {
      productsById.set(product.id, product)
    }
  })

  return [...productsById.values()].slice(0, MAX_PRODUCTS)
}

function toPromptRecognition(recognition) {
  return {
    ...recognition,
    categoryHints: recognition.categoryHints.map(translateCategory)
  }
}

function toPromptProduct(product) {
  return {
    ...product,
    category: translateCategory(product.category),
    petType: translatePetType(product.petType)
  }
}

function buildMessages({ recognition, products }) {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'system',
      content: [
        '图片识别结果如下：',
        JSON.stringify(toPromptRecognition(recognition)),
        '候选商品目录如下：',
        JSON.stringify(products.map(toPromptProduct))
      ].join('\n')
    },
    { role: 'system', content: OUTPUT_PROMPT }
  ]
}

function parseStructuredContent(content, products) {
  let parsed = null

  try {
    parsed = JSON.parse(trimText(content, 8000))
  } catch {
    parsed = null
  }

  const productIds = new Set(products.map((product) => product.id))
  const aiSimilarities = {}
  const reasons = {}

  if (Array.isArray(parsed?.items)) {
    parsed.items.forEach((item) => {
      const id = trimText(item?.id, 80)
      const score = clampScore(item?.aiSimilarity ?? item?.similarity ?? item?.score)

      if (!productIds.has(id) || score === null) {
        return
      }

      aiSimilarities[id] = score
      const reason = trimText(item?.reason, MAX_REASON_LENGTH)
      if (reason) {
        reasons[id] = reason
      }
    })
  }

  return {
    aiSimilarities,
    reasons,
    labels: normalizeStringArray(parsed?.labels, { maxItems: 5, maxLength: 40 })
  }
}

export async function scoreVisualSearchSimilarity({ config, chatClient, body = {} }) {
  const recognition = normalizeRecognition(body.recognition)
  const products = normalizeProducts(body.products)

  if (products.length === 0) {
    throw new AppError(400, 40000, 'products are required')
  }

  const result = await chatClient({
    model: config.aiModel,
    messages: buildMessages({ recognition, products }),
    responseFormat: { type: 'json_object' }
  })
  const structured = parseStructuredContent(result.content, products)

  return {
    ...structured,
    model: result.model ?? config.aiModel,
    usage: result.usage ?? null
  }
}
