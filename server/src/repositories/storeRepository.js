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

export function listStores(db) {
  return db
    .prepare(
      `
        SELECT *
        FROM stores
        ORDER BY created_at DESC, id DESC
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

export function findStoreById(db, storeId) {
  return db
    .prepare(
      `
        SELECT *
        FROM stores
        WHERE id = ?
        LIMIT 1
      `
    )
    .get(storeId)
}

export function createStore(db, store) {
  db.prepare(
    `
      INSERT INTO stores (
        id,
        name,
        phone,
        address,
        business_hours,
        cover_url,
        status,
        created_at,
        updated_at
      ) VALUES (
        @id,
        @name,
        @phone,
        @address,
        @business_hours,
        @cover_url,
        @status,
        @created_at,
        @updated_at
      )
    `
  ).run(store)
}

export function updateStore(db, store) {
  db.prepare(
    `
      UPDATE stores
      SET
        name = @name,
        phone = @phone,
        address = @address,
        business_hours = @business_hours,
        cover_url = @cover_url,
        status = @status,
        updated_at = @updated_at
      WHERE id = @id
    `
  ).run(store)
}

export function updateStoreStatus(db, store) {
  db.prepare(
    `
      UPDATE stores
      SET
        status = @status,
        updated_at = @updated_at
      WHERE id = @id
    `
  ).run(store)
}

export function deleteStore(db, storeId) {
  db.prepare('DELETE FROM stores WHERE id = ?').run(storeId)
}
