function buildServiceFilters(filters = {}) {
  const clauses = [`status = 'active'`]
  const params = {}

  if (filters.petType) {
    clauses.push("(pet_type = @petType OR pet_type = 'all')")
    params.petType = filters.petType
  }

  return { clauses, params }
}

function buildAdminServiceFilters(filters = {}) {
  const clauses = ['1 = 1']
  const params = {}

  if (filters.status) {
    clauses.push('status = @status')
    params.status = filters.status
  }

  return { clauses, params }
}

export function listServices(db, filters = {}, pagination = {}) {
  const { clauses, params } = buildServiceFilters(filters)

  return db
    .prepare(
      `
        SELECT *
        FROM services
        WHERE ${clauses.join(' AND ')}
        ORDER BY id ASC
        LIMIT @limit OFFSET @offset
      `
    )
    .all({
      ...params,
      limit: pagination.limit,
      offset: pagination.offset
    })
}

export function listAllServices(db, filters = {}) {
  const { clauses, params } = buildAdminServiceFilters(filters)

  return db
    .prepare(
      `
        SELECT *
        FROM services
        WHERE ${clauses.join(' AND ')}
        ORDER BY created_at DESC, id DESC
      `
    )
    .all(params)
}

export function countServices(db, filters = {}) {
  const { clauses, params } = buildServiceFilters(filters)

  return db
    .prepare(
      `
        SELECT COUNT(*) AS count
        FROM services
        WHERE ${clauses.join(' AND ')}
      `
    )
    .get(params).count
}

export function findActiveServiceById(db, serviceId) {
  return db
    .prepare(
      `
        SELECT *
        FROM services
        WHERE id = ? AND status = 'active'
        LIMIT 1
      `
    )
    .get(serviceId)
}

export function findServiceById(db, serviceId) {
  return db
    .prepare(
      `
        SELECT *
        FROM services
        WHERE id = ?
        LIMIT 1
      `
    )
    .get(serviceId)
}

export function createService(db, service) {
  db.prepare(
    `
      INSERT INTO services (
        id,
        title,
        subtitle,
        pet_type,
        price,
        member_price,
        original_price,
        duration_minutes,
        badge,
        highlights_json,
        summary_json,
        notice_json,
        cover_url,
        status,
        rating,
        review_count,
        created_at,
        updated_at
      ) VALUES (
        @id,
        @title,
        @subtitle,
        @pet_type,
        @price,
        @member_price,
        @original_price,
        @duration_minutes,
        @badge,
        @highlights_json,
        @summary_json,
        @notice_json,
        @cover_url,
        @status,
        @rating,
        @review_count,
        @created_at,
        @updated_at
      )
    `
  ).run(service)
}

export function updateService(db, service) {
  db.prepare(
    `
      UPDATE services
      SET
        title = @title,
        subtitle = @subtitle,
        pet_type = @pet_type,
        price = @price,
        member_price = @member_price,
        original_price = @original_price,
        duration_minutes = @duration_minutes,
        badge = @badge,
        highlights_json = @highlights_json,
        summary_json = @summary_json,
        notice_json = @notice_json,
        cover_url = @cover_url,
        status = @status,
        updated_at = @updated_at
      WHERE id = @id
    `
  ).run(service)
}

export function updateServiceStatus(db, service) {
  db.prepare(
    `
      UPDATE services
      SET
        status = @status,
        updated_at = @updated_at
      WHERE id = @id
    `
  ).run(service)
}

export function listServiceImages(db, serviceId) {
  return db
    .prepare(
      `
        SELECT id, image_url, sort_order
        FROM service_images
        WHERE service_id = ?
        ORDER BY sort_order ASC, id ASC
      `
    )
    .all(serviceId)
}

export function replaceServiceImages(db, serviceId, imageUrls) {
  db.prepare('DELETE FROM service_images WHERE service_id = ?').run(serviceId)

  const statement = db.prepare(
    `
      INSERT INTO service_images (id, service_id, image_url, sort_order)
      VALUES (@id, @service_id, @image_url, @sort_order)
    `
  )

  imageUrls.forEach((imageUrl, index) => {
    statement.run({
      id: `si_${serviceId}_${String(index + 1).padStart(2, '0')}`,
      service_id: serviceId,
      image_url: imageUrl,
      sort_order: index + 1
    })
  })
}

export function deleteService(db, serviceId) {
  db.prepare('DELETE FROM service_images WHERE service_id = ?').run(serviceId)
  db.prepare('DELETE FROM services WHERE id = ?').run(serviceId)
}
