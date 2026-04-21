import { mkdirSync } from 'node:fs'
import express from 'express'
import { loadEnv } from './config/env.js'
import { errorHandler } from './middleware/errorHandler.js'
import { notFound } from './middleware/notFound.js'
import { createAdminRouter } from './routes/admin.js'
import { createPublicRouter } from './routes/public.js'
import { createUserRouter } from './routes/user.js'

export function createApp(overrides = {}) {
  const config = loadEnv(overrides)

  mkdirSync(config.uploadDir, { recursive: true })

  const app = express()
  app.locals.config = config

  app.use(express.json())
  app.use('/uploads', express.static(config.uploadDir))
  app.use('/api/public', createPublicRouter())
  app.use('/api/user', createUserRouter())
  app.use('/api/admin', createAdminRouter())
  app.use(notFound)
  app.use(errorHandler)

  return app
}
