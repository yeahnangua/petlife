import { mkdirSync } from 'node:fs'
import express from 'express'
import { loadEnv } from './config/env.js'
import { createDatabase } from './db/index.js'
import { migrate } from './db/migrate.js'
import { ensureDemoCoupons, seed } from './db/seed.js'
import { apiCache } from './middleware/apiCache.js'
import { errorHandler } from './middleware/errorHandler.js'
import { notFound } from './middleware/notFound.js'
import { createAuthRouter } from './routes/auth.js'
import { createAdminRouter } from './routes/admin.js'
import { createPublicRouter } from './routes/public.js'
import { createUserRouter } from './routes/user.js'
import { createWechatRouter } from './routes/wechat.js'
import { createSiliconFlowChatClient } from './services/aiConsultService.js'
import { createWechatOfficialAccountClient } from './services/wechatOfficialAccountClient.js'

function initializeDatabase(config, existingDatabase) {
  if (existingDatabase) {
    return existingDatabase
  }

  const db = createDatabase(config.dbPath)
  migrate(db)

  const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count
  if (userCount === 0) {
    seed(db)
  }
  ensureDemoCoupons(db)

  return db
}

function createImageSearchAiConfig(config) {
  return {
    ...config,
    aiApiKey: config.imageSearchApiKey,
    aiBaseUrl: config.imageSearchBaseUrl,
    aiTimeoutMs: config.imageSearchTimeoutMs
  }
}

export function createApp(overrides = {}) {
  const config = loadEnv(overrides)
  const db = initializeDatabase(config, overrides.database)

  mkdirSync(config.uploadDir, { recursive: true })

  const app = express()
  app.locals.config = config
  app.locals.db = db
  app.locals.aiChatClient = overrides.aiChatClient ?? createSiliconFlowChatClient(config)
  app.locals.visualSearchAiChatClient =
    overrides.visualSearchAiChatClient ?? createSiliconFlowChatClient(createImageSearchAiConfig(config))
  app.locals.wechatOfficialAccountClient =
    overrides.wechatOfficialAccountClient ?? createWechatOfficialAccountClient(config)

  app.use(express.json())
  app.use(apiCache)
  app.use('/uploads', express.static(config.uploadDir))
  app.use('/api/public', createPublicRouter())
  app.use('/api/auth', createAuthRouter())
  app.use('/api/user', createUserRouter())
  app.use('/api/admin', createAdminRouter())
  app.use('/api/wechat', createWechatRouter())
  app.use(notFound)
  app.use(errorHandler)

  return app
}
