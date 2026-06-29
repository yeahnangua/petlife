import { afterEach, describe, expect, it } from 'vitest'
import { loadEnv, mergeEnvSources } from '../src/config/env.js'

const originalEnv = {
  key: process.env.key,
  model: process.env.model,
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
  DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL,
  SILICONFLOW_API_KEY: process.env.SILICONFLOW_API_KEY,
  SILICONFLOW_MODEL: process.env.SILICONFLOW_MODEL,
  AI_TIMEOUT_MS: process.env.AI_TIMEOUT_MS,
  imagesearch_key: process.env.imagesearch_key,
  imagesearch_model: process.env.imagesearch_model,
  imagesearch_baseurl: process.env.imagesearch_baseurl
}

function restoreEnvValue(name, value) {
  if (value === undefined) {
    delete process.env[name]
    return
  }

  process.env[name] = value
}

describe('environment config', () => {
  afterEach(() => {
    Object.entries(originalEnv).forEach(([name, value]) => {
      restoreEnvValue(name, value)
    })
  })

  it('loads AI config from the current lowercase .env names', () => {
    delete process.env.DEEPSEEK_API_KEY
    delete process.env.DEEPSEEK_MODEL
    delete process.env.SILICONFLOW_API_KEY
    delete process.env.SILICONFLOW_MODEL
    process.env.key = 'test-lowercase-key'
    process.env.model = 'deepseek-lowercase-model'

    const config = loadEnv()

    expect(config.aiApiKey).toBe('test-lowercase-key')
    expect(config.aiModel).toBe('deepseek-lowercase-model')
    expect(config.aiBaseUrl).toBe('https://api.deepseek.com')
  })

  it('uses a 60 second AI timeout by default', () => {
    delete process.env.AI_TIMEOUT_MS

    const config = loadEnv()

    expect(config.aiTimeoutMs).toBe(60000)
  })

  it('loads dedicated image search AI config from lowercase .env names', () => {
    process.env.imagesearch_key = 'test-image-search-key'
    process.env.imagesearch_model = 'test-image-search-model'
    process.env.imagesearch_baseurl = 'https://image-search.example.test/v1'

    const config = loadEnv()

    expect(config.imageSearchApiKey).toBe('test-image-search-key')
    expect(config.imageSearchModel).toBe('test-image-search-model')
    expect(config.imageSearchBaseUrl).toBe('https://image-search.example.test/v1')
    expect(config.imageSearchTimeoutMs).toBe(config.aiTimeoutMs)
  })

  it('lets the project .env override stale startup environment values', () => {
    const env = mergeEnvSources(
      {
        BASE_URL: 'http://127.0.0.1:8787',
        WECHAT_OFFICIAL_ACCOUNT_APP_ID: 'old-app-id'
      },
      {
        BASE_URL: 'https://api.petlife.example.test',
        WECHAT_OFFICIAL_ACCOUNT_APP_ID: 'wx-from-dotenv'
      }
    )

    expect(env.BASE_URL).toBe('https://api.petlife.example.test')
    expect(env.WECHAT_OFFICIAL_ACCOUNT_APP_ID).toBe('wx-from-dotenv')
  })
})
