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
  ensureOrderPricingColumns(db)
  ensureCouponCampaignTargetColumns(db)
  ensureBookingPricingColumns(db)
}

function columnExists(db, tableName, columnName) {
  return db.prepare(`PRAGMA table_info(${tableName})`).all().some((column) => column.name === columnName)
}

function addColumnIfMissing(db, tableName, columnName, definition) {
  if (columnExists(db, tableName, columnName)) {
    return
  }

  db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`)
}

function ensureOrderPricingColumns(db) {
  addColumnIfMissing(db, 'orders', 'subtotal_amount', 'INTEGER NOT NULL DEFAULT 0')
  addColumnIfMissing(db, 'orders', 'shipping_fee', 'INTEGER NOT NULL DEFAULT 0')
  addColumnIfMissing(db, 'orders', 'discount_amount', 'INTEGER NOT NULL DEFAULT 0')
  addColumnIfMissing(db, 'orders', 'payable_amount', 'INTEGER NOT NULL DEFAULT 0')
  addColumnIfMissing(db, 'orders', 'coupon_id', "TEXT NOT NULL DEFAULT ''")
  addColumnIfMissing(db, 'orders', 'coupon_name_snapshot', "TEXT NOT NULL DEFAULT ''")
}

function ensureCouponCampaignTargetColumns(db) {
  addColumnIfMissing(db, 'coupon_campaigns', 'target_type', "TEXT NOT NULL DEFAULT 'product'")
}

function ensureBookingPricingColumns(db) {
  addColumnIfMissing(db, 'bookings', 'subtotal_amount', 'INTEGER NOT NULL DEFAULT 0')
  addColumnIfMissing(db, 'bookings', 'discount_amount', 'INTEGER NOT NULL DEFAULT 0')
  addColumnIfMissing(db, 'bookings', 'payable_amount', 'INTEGER NOT NULL DEFAULT 0')
  addColumnIfMissing(db, 'bookings', 'coupon_id', "TEXT NOT NULL DEFAULT ''")
  addColumnIfMissing(db, 'bookings', 'coupon_name_snapshot', "TEXT NOT NULL DEFAULT ''")
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
