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

export function listTimeSlots(db) {
  return db
    .prepare(
      `
        SELECT *
        FROM time_slots
        ORDER BY sort_order ASC, id ASC
      `
    )
    .all()
}

export function findEnabledTimeSlotById(db, slotId) {
  return db
    .prepare(
      `
        SELECT id, label, start_time, end_time, capacity, sort_order
        FROM time_slots
        WHERE id = ? AND is_enabled = 1
        LIMIT 1
      `
    )
    .get(slotId)
}

export function findTimeSlotById(db, slotId) {
  return db
    .prepare(
      `
        SELECT *
        FROM time_slots
        WHERE id = ?
        LIMIT 1
      `
    )
    .get(slotId)
}

export function createTimeSlot(db, slot) {
  db.prepare(
    `
      INSERT INTO time_slots (
        id,
        label,
        start_time,
        end_time,
        capacity,
        sort_order,
        is_enabled,
        created_at,
        updated_at
      ) VALUES (
        @id,
        @label,
        @start_time,
        @end_time,
        @capacity,
        @sort_order,
        @is_enabled,
        @created_at,
        @updated_at
      )
    `
  ).run(slot)
}

export function updateTimeSlot(db, slot) {
  db.prepare(
    `
      UPDATE time_slots
      SET
        label = @label,
        start_time = @start_time,
        end_time = @end_time,
        capacity = @capacity,
        sort_order = @sort_order,
        is_enabled = @is_enabled,
        updated_at = @updated_at
      WHERE id = @id
    `
  ).run(slot)
}

export function updateTimeSlotEnabled(db, slot) {
  db.prepare(
    `
      UPDATE time_slots
      SET
        is_enabled = @is_enabled,
        updated_at = @updated_at
      WHERE id = @id
    `
  ).run(slot)
}

export function deleteTimeSlot(db, slotId) {
  db.prepare('DELETE FROM time_slots WHERE id = ?').run(slotId)
}
