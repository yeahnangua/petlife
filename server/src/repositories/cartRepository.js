export function listCartItemsByUserId(db, userId) {
  return db
    .prepare(
      `
        SELECT *
        FROM cart_items
        WHERE user_id = ?
        ORDER BY created_at DESC, id DESC
      `
    )
    .all(userId)
}

export function findCartItemById(db, userId, itemId) {
  return db
    .prepare(
      `
        SELECT *
        FROM cart_items
        WHERE user_id = ? AND id = ?
        LIMIT 1
      `
    )
    .get(userId, itemId)
}

export function findCartItemByProductAndSpec(db, userId, productId, specKey) {
  return db
    .prepare(
      `
        SELECT *
        FROM cart_items
        WHERE user_id = ? AND product_id = ? AND spec_key = ?
        LIMIT 1
      `
    )
    .get(userId, productId, specKey)
}

export function createCartItem(db, item) {
  db.prepare(
    `
      INSERT INTO cart_items (
        id,
        user_id,
        product_id,
        spec_key,
        spec_label,
        quantity,
        selected,
        created_at,
        updated_at
      ) VALUES (
        @id,
        @user_id,
        @product_id,
        @spec_key,
        @spec_label,
        @quantity,
        @selected,
        @created_at,
        @updated_at
      )
    `
  ).run(item)
}

export function updateCartItem(db, item) {
  db.prepare(
    `
      UPDATE cart_items
      SET
        quantity = @quantity,
        selected = @selected,
        updated_at = @updated_at
      WHERE id = @id AND user_id = @user_id
    `
  ).run(item)
}

export function deleteCartItem(db, userId, itemId) {
  db.prepare('DELETE FROM cart_items WHERE user_id = ? AND id = ?').run(userId, itemId)
}

export function deleteCartItemsByIds(db, userId, itemIds) {
  const statement = db.prepare('DELETE FROM cart_items WHERE user_id = ? AND id = ?')

  for (const itemId of itemIds) {
    statement.run(userId, itemId)
  }
}
