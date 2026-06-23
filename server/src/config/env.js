import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

dotenv.config()

const serverRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)))

export function loadEnv(overrides = {}) {
  return {
    port: Number(overrides.port ?? process.env.PORT ?? 8787),
    dbPath: resolve(serverRoot, overrides.dbPath ?? process.env.DB_PATH ?? './data/petlife.sqlite'),
    adminKey: overrides.adminKey ?? process.env.ADMIN_KEY ?? 'petlife-admin-demo',
    uploadDir: resolve(serverRoot, overrides.uploadDir ?? process.env.UPLOAD_DIR ?? './uploads'),
    baseUrl: overrides.baseUrl ?? process.env.BASE_URL ?? `http://127.0.0.1:${Number(process.env.PORT ?? 8787)}`
  }
}
