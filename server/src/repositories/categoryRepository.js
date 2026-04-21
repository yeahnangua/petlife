export function listEnabledCategories(db) {
  return db
    .prepare(
      `
        SELECT id, name, slug, pet_type, sort_order, cover_url
        FROM categories
        WHERE is_enabled = 1
        ORDER BY sort_order ASC, id ASC
      `
    )
    .all()
}
