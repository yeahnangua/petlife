import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import Database from 'better-sqlite3'

export function createDatabase(dbPath) {
  const absolutePath = resolve(dbPath)

  mkdirSync(dirname(absolutePath), { recursive: true })

  const db = new Database(absolutePath)
  db.pragma('foreign_keys = ON')

  return db
}
