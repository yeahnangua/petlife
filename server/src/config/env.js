import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const serverRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)))
const projectRoot = resolve(serverRoot, '..')

dotenv.config()
dotenv.config({ path: resolve(projectRoot, '.env') })

export function loadEnv(overrides = {}) {
  return {
    port: Number(overrides.port ?? process.env.PORT ?? 8787),
    dbPath: resolve(serverRoot, overrides.dbPath ?? process.env.DB_PATH ?? './data/petlife.sqlite'),
    adminKey: overrides.adminKey ?? process.env.ADMIN_KEY ?? 'petlife-admin-demo',
    uploadDir: resolve(serverRoot, overrides.uploadDir ?? process.env.UPLOAD_DIR ?? './uploads'),
    baseUrl: overrides.baseUrl ?? process.env.BASE_URL ?? `http://127.0.0.1:${Number(process.env.PORT ?? 8787)}`,
    mobileAppUrl: overrides.mobileAppUrl ?? process.env.MOBILE_APP_URL ?? 'http://127.0.0.1:5173/',
    wechatOfficialAccountAppId:
      overrides.wechatOfficialAccountAppId ??
      process.env.WECHAT_OFFICIAL_ACCOUNT_APP_ID ??
      process.env.WECHAT_OA_APP_ID ??
      '',
    wechatOfficialAccountAppSecret:
      overrides.wechatOfficialAccountAppSecret ??
      process.env.WECHAT_OFFICIAL_ACCOUNT_APP_SECRET ??
      process.env.WECHAT_OA_APP_SECRET ??
      '',
    wechatOfficialAccountScope:
      overrides.wechatOfficialAccountScope ??
      process.env.WECHAT_OFFICIAL_ACCOUNT_SCOPE ??
      process.env.WECHAT_OA_SCOPE ??
      'snsapi_userinfo',
    aiApiKey:
      overrides.aiApiKey ??
      process.env.DEEPSEEK_API_KEY ??
      process.env.SILICONFLOW_API_KEY ??
      process.env.OPENAI_API_KEY ??
      process.env.key ??
      '',
    aiModel:
      overrides.aiModel ??
      process.env.DEEPSEEK_MODEL ??
      process.env.SILICONFLOW_MODEL ??
      process.env.OPENAI_MODEL ??
      process.env.model ??
      'deepseek-ai/DeepSeek-V4-Flash',
    aiBaseUrl:
      overrides.aiBaseUrl ??
      process.env.SILICONFLOW_BASE_URL ??
      process.env.DEEPSEEK_BASE_URL ??
      process.env.OPENAI_BASE_URL ??
      'https://api.siliconflow.cn/v1',
    aiTimeoutMs: Number(overrides.aiTimeoutMs ?? process.env.AI_TIMEOUT_MS ?? 30000)
  }
}
