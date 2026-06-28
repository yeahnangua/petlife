import { getProductDetail } from './catalogService.js'
import { listActiveProductsByIds, listActiveProductsForAi } from '../repositories/productRepository.js'
import { AppError } from '../utils/appError.js'

const MAX_HISTORY_MESSAGES = 12
const MAX_MESSAGE_LENGTH = 1200
const MAX_RECOMMENDATIONS = 2
const MAX_AI_REQUEST_ATTEMPTS = 2

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
  return String(value || 'https://api.siliconflow.cn/v1').replace(/\/+$/, '')
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

function isRetriableAiError(error) {
  return error instanceof AppError && [50200, 50201, 50400].includes(error.code)
}

async function requestChatCompletionOnce(config, payload) {
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

export function createSiliconFlowChatClient(config) {
  return async function requestChatCompletion(payload) {
    if (!config.aiApiKey) {
      throw new AppError(500, 50010, 'AI service is not configured')
    }

    let lastError = null
    for (let attempt = 1; attempt <= MAX_AI_REQUEST_ATTEMPTS; attempt += 1) {
      try {
        return await requestChatCompletionOnce(config, payload)
      } catch (error) {
        lastError = error
        if (attempt === MAX_AI_REQUEST_ATTEMPTS || !isRetriableAiError(error)) {
          throw error
        }
      }
    }

    throw lastError
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
