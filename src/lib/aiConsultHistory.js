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
