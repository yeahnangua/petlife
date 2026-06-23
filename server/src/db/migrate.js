import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { loadEnv } from '../config/env.js'
import { createDatabase } from './index.js'

const migrationSql = readFileSync(new URL('./migrations/001_initial.sql', import.meta.url), 'utf8')

export function migrate(db) {
  db.exec(migrationSql)
}

function runCli() {
  const config = loadEnv()
  const db = createDatabase(config.dbPath)

  try {
    migrate(db)
    console.log(`Migrated database at ${config.dbPath}`)
  } finally {
    db.close()
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli()
}
