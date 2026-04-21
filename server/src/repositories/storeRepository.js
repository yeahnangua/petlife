export function listActiveStores(db) {
  return db
    .prepare(
      `
        SELECT id, name, phone, address, business_hours, cover_url, status
        FROM stores
        WHERE status = 'active'
        ORDER BY id ASC
      `
    )
    .all()
}

export function findActiveStoreById(db, storeId) {
  return db
    .prepare(
      `
        SELECT id, name, phone, address, business_hours, cover_url, status
        FROM stores
        WHERE id = ? AND status = 'active'
        LIMIT 1
      `
    )
    .get(storeId)
}
