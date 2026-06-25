import { afterEach, describe, expect, it } from 'vitest'
import { loadEnv } from '../src/config/env.js'

const originalEnv = {
  key: process.env.key,
  model: process.env.model,
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
  DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL,
  SILICONFLOW_API_KEY: process.env.SILICONFLOW_API_KEY,
  SILICONFLOW_MODEL: process.env.SILICONFLOW_MODEL
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
    expect(config.aiBaseUrl).toBe('https://api.siliconflow.cn/v1')
  })
})
