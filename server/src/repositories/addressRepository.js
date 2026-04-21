export function listAddressesByUserId(db, userId) {
  return db
    .prepare(
      `
        SELECT *
        FROM addresses
        WHERE user_id = ?
        ORDER BY is_default DESC, created_at DESC, id DESC
      `
    )
    .all(userId)
}

export function findAddressById(db, userId, addressId) {
  return db
    .prepare(
      `
        SELECT *
        FROM addresses
        WHERE user_id = ? AND id = ?
        LIMIT 1
      `
    )
    .get(userId, addressId)
}

export function clearDefaultAddresses(db, userId, excludeId = null) {
  if (excludeId) {
    db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ? AND id != ?').run(userId, excludeId)
    return
  }

  db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(userId)
}

export function createAddress(db, address) {
  db.prepare(
    `
      INSERT INTO addresses (
        id,
        user_id,
        receiver_name,
        receiver_phone,
        region,
        detail_address,
        tag,
        is_default,
        created_at,
        updated_at
      ) VALUES (
        @id,
        @user_id,
        @receiver_name,
        @receiver_phone,
        @region,
        @detail_address,
        @tag,
        @is_default,
        @created_at,
        @updated_at
      )
    `
  ).run(address)
}

export function updateAddress(db, address) {
  db.prepare(
    `
      UPDATE addresses
      SET
        receiver_name = @receiver_name,
        receiver_phone = @receiver_phone,
        region = @region,
        detail_address = @detail_address,
        tag = @tag,
        is_default = @is_default,
        updated_at = @updated_at
      WHERE id = @id AND user_id = @user_id
    `
  ).run(address)
}

export function deleteAddress(db, userId, addressId) {
  db.prepare('DELETE FROM addresses WHERE user_id = ? AND id = ?').run(userId, addressId)
}
