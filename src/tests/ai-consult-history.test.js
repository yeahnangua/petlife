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
