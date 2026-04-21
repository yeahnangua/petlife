function buildServiceFilters(filters = {}) {
  const clauses = [`status = 'active'`]
  const params = {}

  if (filters.petType) {
    clauses.push("(pet_type = @petType OR pet_type = 'all')")
    params.petType = filters.petType
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
