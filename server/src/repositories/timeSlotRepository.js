export function listEnabledTimeSlots(db) {
  return db
    .prepare(
      `
        SELECT id, label, start_time, end_time, capacity, sort_order
        FROM time_slots
        WHERE is_enabled = 1
        ORDER BY sort_order ASC, id ASC
      `
    )
    .all()
}
