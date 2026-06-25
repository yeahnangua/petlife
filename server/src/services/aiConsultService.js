import { getProductDetail } from './catalogService.js'
import { AppError } from '../utils/appError.js'

const MAX_HISTORY_MESSAGES = 12
const MAX_MESSAGE_LENGTH = 1200

const SYSTEM_PROMPT = [
  '你是 PetLife 宠物生活馆的售前咨询助手。',
  '请用中文回答，语气专业、简洁、可信。',
  '优先围绕宠物类型、年龄、体重、预算、过敏情况、使用场景和商品适配给出建议。',
  '不要编造库存、优惠、医疗诊断或平台未提供的服务承诺。',
  '涉及疾病、严重异常或处方需求时，建议用户咨询兽医。'
].join('\n')

function trimText(value, maxLength = MAX_MESSAGE_LENGTH) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim().slice(0, maxLength)
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

function buildChatMessages({ product, history }) {
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }]
  const productPrompt = buildProductPrompt(product)

  if (productPrompt) {
    messages.push({ role: 'system', content: productPrompt })
  }

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
          temperature: 0.45,
          max_tokens: 800
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
  const result = await chatClient({
    model: config.aiModel,
    messages: buildChatMessages({ product, history })
  })

  return {
    reply: result.content,
    model: result.model ?? config.aiModel,
    usage: result.usage ?? null
  }
}
