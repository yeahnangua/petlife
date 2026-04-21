function buildProductFilters(filters = {}) {
  const clauses = [`p.status = 'active'`]
  const params = {}

  if (filters.categoryId) {
    clauses.push('p.category_id = @categoryId')
    params.categoryId = filters.categoryId
  }

  if (filters.keyword) {
    clauses.push('(p.title LIKE @keyword OR p.subtitle LIKE @keyword)')
    params.keyword = `%${filters.keyword}%`
  }

  if (filters.petType) {
    clauses.push("(p.pet_type = @petType OR p.pet_type = 'all')")
    params.petType = filters.petType
  }

  return { clauses, params }
}

export function listProducts(db, filters = {}, pagination = {}) {
  const { clauses, params } = buildProductFilters(filters)

  return db
    .prepare(
      `
        SELECT
          p.*,
          c.slug AS category_slug
        FROM products p
        JOIN categories c ON c.id = p.category_id
        WHERE ${clauses.join(' AND ')}
        ORDER BY p.id ASC
        LIMIT @limit OFFSET @offset
      `
    )
    .all({
      ...params,
      limit: pagination.limit,
      offset: pagination.offset
    })
}

export function countProducts(db, filters = {}) {
  const { clauses, params } = buildProductFilters(filters)

  return db
    .prepare(
      `
        SELECT COUNT(*) AS count
        FROM products p
        JOIN categories c ON c.id = p.category_id
        WHERE ${clauses.join(' AND ')}
      `
    )
    .get(params).count
}

export function findProductById(db, productId) {
  return db
    .prepare(
      `
        SELECT
          p.*,
          c.slug AS category_slug
        FROM products p
        JOIN categories c ON c.id = p.category_id
        WHERE p.id = ? AND p.status = 'active'
        LIMIT 1
      `
    )
    .get(productId)
}

export function findAnyProductById(db, productId) {
  return db
    .prepare(
      `
        SELECT
          p.*,
          c.slug AS category_slug
        FROM products p
        JOIN categories c ON c.id = p.category_id
        WHERE p.id = ?
        LIMIT 1
      `
    )
    .get(productId)
}

export function listProductImages(db, productId) {
  return db
    .prepare(
      `
        SELECT id, image_url, sort_order
        FROM product_images
        WHERE product_id = ?
        ORDER BY sort_order ASC, id ASC
      `
    )
    .all(productId)
}
