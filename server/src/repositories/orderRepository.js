export function createOrder(db, order) {
  db.prepare(
    `
      INSERT INTO orders (
        id,
        order_no,
        user_id,
        status,
        status_label,
        total_amount,
        remark,
        receiver_name_snapshot,
        receiver_phone_snapshot,
        receiver_region_snapshot,
        receiver_address_snapshot,
        created_at,
        updated_at
      ) VALUES (
        @id,
        @order_no,
        @user_id,
        @status,
        @status_label,
        @total_amount,
        @remark,
        @receiver_name_snapshot,
        @receiver_phone_snapshot,
        @receiver_region_snapshot,
        @receiver_address_snapshot,
        @created_at,
        @updated_at
      )
    `
  ).run(order)
}

export function createOrderItem(db, item) {
  db.prepare(
    `
      INSERT INTO order_items (
        id,
        order_id,
        product_id,
        product_title_snapshot,
        product_cover_snapshot,
        spec_label_snapshot,
        unit_price_snapshot,
        quantity,
        line_total
      ) VALUES (
        @id,
        @order_id,
        @product_id,
        @product_title_snapshot,
        @product_cover_snapshot,
        @spec_label_snapshot,
        @unit_price_snapshot,
        @quantity,
        @line_total
      )
    `
  ).run(item)
}

export function listOrdersByUserId(db, userId) {
  return db
    .prepare(
      `
        SELECT *
        FROM orders
        WHERE user_id = ?
        ORDER BY created_at DESC, id DESC
      `
    )
    .all(userId)
}

export function findOrderById(db, userId, orderId) {
  return db
    .prepare(
      `
        SELECT *
        FROM orders
        WHERE user_id = ? AND id = ?
        LIMIT 1
      `
    )
    .get(userId, orderId)
}

export function listOrderItemsByOrderId(db, orderId) {
  return db
    .prepare(
      `
        SELECT *
        FROM order_items
        WHERE order_id = ?
        ORDER BY id ASC
      `
    )
    .all(orderId)
}

export function updateOrderStatus(db, order) {
  db.prepare(
    `
      UPDATE orders
      SET
        status = @status,
        status_label = @status_label,
        updated_at = @updated_at
      WHERE id = @id AND user_id = @user_id
    `
  ).run(order)
}

export function countOrderItemsByProductId(db, productId) {
  return db
    .prepare('SELECT COUNT(*) AS count FROM order_items WHERE product_id = ?')
    .get(productId).count
}
