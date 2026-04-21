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

function buildAdminProductFilters(filters = {}) {
  const clauses = ['1 = 1']
  const params = {}

  if (filters.categoryId) {
    clauses.push('p.category_id = @categoryId')
    params.categoryId = filters.categoryId
  }

  if (filters.status) {
    clauses.push('p.status = @status')
    params.status = filters.status
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

export function listAllProducts(db, filters = {}) {
  const { clauses, params } = buildAdminProductFilters(filters)

  return db
    .prepare(
      `
        SELECT
          p.*,
          c.slug AS category_slug
        FROM products p
        JOIN categories c ON c.id = p.category_id
        WHERE ${clauses.join(' AND ')}
        ORDER BY p.created_at DESC, p.id DESC
      `
    )
    .all(params)
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

export function countActiveProductsByCategoryId(db, categoryId) {
  return db
    .prepare(
      `
        SELECT COUNT(*) AS count
        FROM products
        WHERE category_id = ? AND status = 'active'
      `
    )
    .get(categoryId).count
}

export function countProductsByCategoryId(db, categoryId) {
  return db.prepare('SELECT COUNT(*) AS count FROM products WHERE category_id = ?').get(categoryId).count
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

export function createProduct(db, product) {
  db.prepare(
    `
      INSERT INTO products (
        id,
        category_id,
        title,
        subtitle,
        pet_type,
        price,
        member_price,
        original_price,
        stock,
        stock_status,
        badge,
        tags_json,
        specs_json,
        summary_json,
        suitable_text,
        cover_url,
        status,
        rating,
        review_count,
        sold_count,
        created_at,
        updated_at
      ) VALUES (
        @id,
        @category_id,
        @title,
        @subtitle,
        @pet_type,
        @price,
        @member_price,
        @original_price,
        @stock,
        @stock_status,
        @badge,
        @tags_json,
        @specs_json,
        @summary_json,
        @suitable_text,
        @cover_url,
        @status,
        @rating,
        @review_count,
        @sold_count,
        @created_at,
        @updated_at
      )
    `
  ).run(product)
}

export function updateProduct(db, product) {
  db.prepare(
    `
      UPDATE products
      SET
        category_id = @category_id,
        title = @title,
        subtitle = @subtitle,
        pet_type = @pet_type,
        price = @price,
        member_price = @member_price,
        original_price = @original_price,
        stock = @stock,
        stock_status = @stock_status,
        badge = @badge,
        tags_json = @tags_json,
        specs_json = @specs_json,
        summary_json = @summary_json,
        suitable_text = @suitable_text,
        cover_url = @cover_url,
        status = @status,
        updated_at = @updated_at
      WHERE id = @id
    `
  ).run(product)
}

export function updateProductStatus(db, product) {
  db.prepare(
    `
      UPDATE products
      SET
        status = @status,
        updated_at = @updated_at
      WHERE id = @id
    `
  ).run(product)
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

export function replaceProductImages(db, productId, imageUrls) {
  db.prepare('DELETE FROM product_images WHERE product_id = ?').run(productId)

  const statement = db.prepare(
    `
      INSERT INTO product_images (id, product_id, image_url, sort_order)
      VALUES (@id, @product_id, @image_url, @sort_order)
    `
  )

  imageUrls.forEach((imageUrl, index) => {
    statement.run({
      id: `pi_${productId}_${String(index + 1).padStart(2, '0')}`,
      product_id: productId,
      image_url: imageUrl,
      sort_order: index + 1
    })
  })
}

export function deleteProduct(db, productId) {
  db.prepare('DELETE FROM product_images WHERE product_id = ?').run(productId)
  db.prepare('DELETE FROM products WHERE id = ?').run(productId)
}

export function updateProductInventory(db, product) {
  db.prepare(
    `
      UPDATE products
      SET
        stock = @stock,
        stock_status = @stock_status,
        updated_at = @updated_at
      WHERE id = @id
    `
  ).run(product)
}
