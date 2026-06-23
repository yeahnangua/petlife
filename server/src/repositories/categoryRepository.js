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

export function listCategories(db) {
  return db
    .prepare(
      `
        SELECT *
        FROM categories
        ORDER BY sort_order ASC, id ASC
      `
    )
    .all()
}

export function findCategoryById(db, categoryId) {
  return db
    .prepare(
      `
        SELECT *
        FROM categories
        WHERE id = ?
        LIMIT 1
      `
    )
    .get(categoryId)
}

export function createCategory(db, category) {
  db.prepare(
    `
      INSERT INTO categories (
        id,
        name,
        slug,
        pet_type,
        sort_order,
        cover_url,
        is_enabled,
        created_at,
        updated_at
      ) VALUES (
        @id,
        @name,
        @slug,
        @pet_type,
        @sort_order,
        @cover_url,
        @is_enabled,
        @created_at,
        @updated_at
      )
    `
  ).run(category)
}

export function updateCategory(db, category) {
  db.prepare(
    `
      UPDATE categories
      SET
        name = @name,
        slug = @slug,
        pet_type = @pet_type,
        sort_order = @sort_order,
        cover_url = @cover_url,
        is_enabled = @is_enabled,
        updated_at = @updated_at
      WHERE id = @id
    `
  ).run(category)
}

export function deleteCategory(db, categoryId) {
  db.prepare('DELETE FROM categories WHERE id = ?').run(categoryId)
}
