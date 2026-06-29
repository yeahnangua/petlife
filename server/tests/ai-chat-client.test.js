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
    vi.restoreAllMocks()
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

  it('forwards per-request thinking mode options to the AI service', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      model: 'deepseek-test-model',
      choices: [{ message: { content: '{"ok":true}' }, finish_reason: 'stop' }]
    }))
    vi.stubGlobal('fetch', fetchMock)

    const client = createSiliconFlowChatClient({
      aiApiKey: 'test-api-key',
      aiBaseUrl: 'https://ai.example.test/v1',
      aiTimeoutMs: 1000
    })

    await client({
      model: 'deepseek-test-model',
      messages: [{ role: 'system', content: '只输出 JSON' }],
      responseFormat: { type: 'json_object' },
      thinking: { type: 'disabled' }
    })

    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(requestBody.thinking).toEqual({ type: 'disabled' })
  })

  it('logs upstream authentication details when the AI service rejects the key', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      error: {
        message: 'Authentication Fails, Your api key: ****pami is invalid',
        type: 'authentication_error',
        code: 'invalid_request_error'
      }
    }, { status: 401 }))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal('fetch', fetchMock)

    const client = createSiliconFlowChatClient({
      aiApiKey: 'test-api-key',
      aiBaseUrl: 'https://api.deepseek.com',
      aiTimeoutMs: 1000
    })

    await expect(client({
      model: 'deepseek-v4-flash',
      messages: [{ role: 'user', content: 'hello' }]
    })).rejects.toMatchObject({
      statusCode: 502,
      code: 50210,
      message: 'AI service authentication failed'
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(errorSpy).toHaveBeenCalledWith('[AI] Upstream request failed', {
      upstreamStatus: 401,
      upstreamCode: 'invalid_request_error',
      upstreamType: 'authentication_error',
      upstreamMessage: 'Authentication Fails, Your api key: ****pami is invalid',
      baseUrl: 'https://api.deepseek.com',
      model: 'deepseek-v4-flash'
    })
  })
})
