import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSiliconFlowChatClient } from '../src/services/aiConsultService.js'

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'Content-Type': 'application/json' }
  })
}

describe('SiliconFlow chat client', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('retries once when the AI service returns an empty message', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({
        model: 'deepseek-test-model',
        choices: [{ message: { content: '' }, finish_reason: 'stop' }]
      }))
      .mockResolvedValueOnce(jsonResponse({
        model: 'deepseek-test-model',
        choices: [{ message: { content: '{"ok":true}' }, finish_reason: 'stop' }],
        usage: { total_tokens: 12 }
      }))
    vi.stubGlobal('fetch', fetchMock)

    const client = createSiliconFlowChatClient({
      aiApiKey: 'test-api-key',
      aiBaseUrl: 'https://ai.example.test/v1',
      aiTimeoutMs: 1000
    })

    const result = await client({
      model: 'deepseek-test-model',
      messages: [{ role: 'system', content: '只输出 JSON' }],
      responseFormat: { type: 'json_object' }
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(result).toEqual({
      content: '{"ok":true}',
      model: 'deepseek-test-model',
      usage: { total_tokens: 12 }
    })
  })
})
