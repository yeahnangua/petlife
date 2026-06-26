import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { loadEnv } from '../config/env.js'
import { createDatabase } from './index.js'

function loadMigrationSql() {
  const migrationDir = new URL('./migrations/', import.meta.url)
  return readdirSync(migrationDir)
    .filter((file) => file.endsWith('.sql'))
    .sort((left, right) => left.localeCompare(right))
    .map((file) => readFileSync(new URL(file, migrationDir), 'utf8'))
    .join('\n')
}

export function migrate(db) {
  db.exec(loadMigrationSql())
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
