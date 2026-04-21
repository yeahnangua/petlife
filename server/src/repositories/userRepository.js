export function findUserById(db, userId) {
  return db
    .prepare(
      `
        SELECT id, nickname, phone, avatar_url, member_level, points, created_at, updated_at
        FROM users
        WHERE id = ?
        LIMIT 1
      `
    )
    .get(userId)
}

export function countOrdersByUserId(db, userId) {
  return db.prepare('SELECT COUNT(*) AS count FROM orders WHERE user_id = ?').get(userId).count
}

export function countBookingsByUserId(db, userId) {
  return db
    .prepare('SELECT COUNT(*) AS count FROM bookings WHERE user_id = ?')
    .get(userId).count
}
