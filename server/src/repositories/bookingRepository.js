export function listSlotUsageByStoreAndDate(db, storeId, bookingDate) {
  return db
    .prepare(
      `
        SELECT time_slot_id, COUNT(*) AS used
        FROM bookings
        WHERE store_id = @storeId
          AND booking_date = @bookingDate
          AND status != 'cancelled'
        GROUP BY time_slot_id
      `
    )
    .all({
      storeId,
      bookingDate
    })
}

export function createBooking(db, booking) {
  db.prepare(
    `
      INSERT INTO bookings (
        id,
        booking_no,
        user_id,
        pet_id,
        pet_name_snapshot,
        pet_type_snapshot,
        service_id,
        service_title_snapshot,
        service_cover_snapshot,
        service_price_snapshot,
        store_id,
        store_name_snapshot,
        time_slot_id,
        time_slot_label_snapshot,
        booking_date,
        status,
        status_label,
        contact_phone,
        note,
        created_at,
        updated_at
      ) VALUES (
        @id,
        @booking_no,
        @user_id,
        @pet_id,
        @pet_name_snapshot,
        @pet_type_snapshot,
        @service_id,
        @service_title_snapshot,
        @service_cover_snapshot,
        @service_price_snapshot,
        @store_id,
        @store_name_snapshot,
        @time_slot_id,
        @time_slot_label_snapshot,
        @booking_date,
        @status,
        @status_label,
        @contact_phone,
        @note,
        @created_at,
        @updated_at
      )
    `
  ).run(booking)
}

export function listBookingsByUserId(db, userId) {
  return db
    .prepare(
      `
        SELECT *
        FROM bookings
        WHERE user_id = ?
        ORDER BY created_at DESC, id DESC
      `
    )
    .all(userId)
}

export function findBookingById(db, userId, bookingId) {
  return db
    .prepare(
      `
        SELECT *
        FROM bookings
        WHERE user_id = ? AND id = ?
        LIMIT 1
      `
    )
    .get(userId, bookingId)
}

export function updateBookingStatus(db, booking) {
  db.prepare(
    `
      UPDATE bookings
      SET
        status = @status,
        status_label = @status_label,
        updated_at = @updated_at
      WHERE id = @id AND user_id = @user_id
    `
  ).run(booking)
}
