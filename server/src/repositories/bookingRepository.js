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
