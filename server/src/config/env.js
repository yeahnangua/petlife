import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const serverRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)))
const projectRoot = resolve(serverRoot, '..')
const projectEnvPath = resolve(projectRoot, '.env')

dotenv.config()
dotenv.config({ path: projectEnvPath, override: true })

export function mergeEnvSources(startupEnv = {}, projectEnv = {}) {
  return {
    ...startupEnv,
    ...projectEnv
  }
}

function decodeEscapedNewlines(value) {
  return String(value ?? '').replaceAll('\\n', '\n')
}

export function loadEnv(overrides = {}) {
  const env = mergeEnvSources(process.env)

  return {
    port: Number(overrides.port ?? env.PORT ?? 8787),
    dbPath: resolve(serverRoot, overrides.dbPath ?? env.DB_PATH ?? './data/petlife.sqlite'),
    adminKey: overrides.adminKey ?? env.ADMIN_KEY ?? 'petlife-admin-demo',
    uploadDir: resolve(serverRoot, overrides.uploadDir ?? env.UPLOAD_DIR ?? './uploads'),
    baseUrl: overrides.baseUrl ?? env.BASE_URL ?? `http://127.0.0.1:${Number(env.PORT ?? 8787)}`,
    mobileAppUrl: overrides.mobileAppUrl ?? env.MOBILE_APP_URL ?? 'http://127.0.0.1:5173/',
    wechatOfficialAccountAppId:
      overrides.wechatOfficialAccountAppId ??
      env.WECHAT_OFFICIAL_ACCOUNT_APP_ID ??
      env.WECHAT_OA_APP_ID ??
      '',
    wechatOfficialAccountAppSecret:
      overrides.wechatOfficialAccountAppSecret ??
      env.WECHAT_OFFICIAL_ACCOUNT_APP_SECRET ??
      env.WECHAT_OA_APP_SECRET ??
      '',
    wechatOfficialAccountScope:
      overrides.wechatOfficialAccountScope ??
      env.WECHAT_OFFICIAL_ACCOUNT_SCOPE ??
      env.WECHAT_OA_SCOPE ??
      'snsapi_userinfo',
    wechatOfficialAccountToken:
      overrides.wechatOfficialAccountToken ??
      env.WECHAT_OFFICIAL_ACCOUNT_TOKEN ??
      env.WECHAT_OA_TOKEN ??
      '',
    wechatOfficialAccountWelcomeMessage:
      decodeEscapedNewlines(
        overrides.wechatOfficialAccountWelcomeMessage ??
        env.WECHAT_OFFICIAL_ACCOUNT_WELCOME_MESSAGE ??
        env.WECHAT_OA_WELCOME_MESSAGE ??
        '欢迎关注 PetLife，点击菜单可进入商城。'
      ),
    aiApiKey:
      overrides.aiApiKey ??
      env.DEEPSEEK_API_KEY ??
      env.SILICONFLOW_API_KEY ??
      env.OPENAI_API_KEY ??
      env.key ??
      '',
    aiModel:
      overrides.aiModel ??
      env.DEEPSEEK_MODEL ??
      env.SILICONFLOW_MODEL ??
      env.OPENAI_MODEL ??
      env.model ??
      'deepseek-ai/DeepSeek-V4-Flash',
    aiBaseUrl:
      overrides.aiBaseUrl ??
      env.SILICONFLOW_BASE_URL ??
      env.DEEPSEEK_BASE_URL ??
      env.OPENAI_BASE_URL ??
      'https://api.siliconflow.cn/v1',
    aiTimeoutMs: Number(overrides.aiTimeoutMs ?? env.AI_TIMEOUT_MS ?? 30000)
  }
}
