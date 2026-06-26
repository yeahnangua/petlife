export function listUserCoupons(db, userId) {
  return db
    .prepare(
      `
        SELECT
          uc.id,
          uc.campaign_id,
          uc.user_id,
          uc.status,
          uc.issued_at,
          uc.used_at,
          uc.used_order_id,
          uc.created_at,
          uc.updated_at,
          cc.name,
          cc.description,
          cc.discount_amount,
          cc.min_order_amount,
          cc.target_type,
          cc.total_limit,
          cc.issued_count,
          cc.status AS campaign_status,
          cc.valid_from,
          cc.valid_to
        FROM user_coupons uc
        JOIN coupon_campaigns cc ON cc.id = uc.campaign_id
        WHERE uc.user_id = ?
        ORDER BY uc.issued_at DESC, uc.id DESC
      `
    )
    .all(userId)
}

export function findUserCouponById(db, userId, couponId) {
  return db
    .prepare(
      `
        SELECT
          uc.id,
          uc.campaign_id,
          uc.user_id,
          uc.status,
          uc.issued_at,
          uc.used_at,
          uc.used_order_id,
          uc.created_at,
          uc.updated_at,
          cc.name,
          cc.description,
          cc.discount_amount,
          cc.min_order_amount,
          cc.target_type,
          cc.total_limit,
          cc.issued_count,
          cc.status AS campaign_status,
          cc.valid_from,
          cc.valid_to
        FROM user_coupons uc
        JOIN coupon_campaigns cc ON cc.id = uc.campaign_id
        WHERE uc.user_id = ? AND uc.id = ?
        LIMIT 1
      `
    )
    .get(userId, couponId)
}

export function countAvailableUserCoupons(db, userId, timestamp) {
  return db
    .prepare(
      `
        SELECT COUNT(*) AS count
        FROM user_coupons uc
        JOIN coupon_campaigns cc ON cc.id = uc.campaign_id
        WHERE uc.user_id = ?
          AND uc.status = 'available'
          AND cc.status = 'active'
          AND cc.valid_from <= ?
          AND cc.valid_to >= ?
      `
    )
    .get(userId, timestamp, timestamp).count
}

export function listCouponCampaigns(db) {
  return db
    .prepare(
      `
        SELECT *
        FROM coupon_campaigns
        ORDER BY created_at DESC, id DESC
      `
    )
    .all()
}

export function findCouponCampaignById(db, campaignId) {
  return db
    .prepare('SELECT * FROM coupon_campaigns WHERE id = ? LIMIT 1')
    .get(campaignId)
}

export function createCouponCampaign(db, campaign) {
  db.prepare(
    `
      INSERT INTO coupon_campaigns (
        id,
        name,
        description,
        discount_amount,
        min_order_amount,
        total_limit,
        target_type,
        issued_count,
        status,
        valid_from,
        valid_to,
        created_at,
        updated_at
      )
      VALUES (
        @id,
        @name,
        @description,
        @discount_amount,
        @min_order_amount,
        @total_limit,
        @target_type,
        @issued_count,
        @status,
        @valid_from,
        @valid_to,
        @created_at,
        @updated_at
      )
    `
  ).run(campaign)
}

export function updateCouponCampaign(db, campaign) {
  db.prepare(
    `
      UPDATE coupon_campaigns
      SET name = @name,
          description = @description,
          discount_amount = @discount_amount,
          min_order_amount = @min_order_amount,
          total_limit = @total_limit,
          target_type = @target_type,
          status = @status,
          valid_from = @valid_from,
          valid_to = @valid_to,
          updated_at = @updated_at
      WHERE id = @id
    `
  ).run(campaign)
}

export function incrementCampaignIssuedCount(db, campaignId, timestamp) {
  db.prepare(
    `
      UPDATE coupon_campaigns
      SET issued_count = issued_count + 1,
          updated_at = ?
      WHERE id = ?
    `
  ).run(timestamp, campaignId)
}

export function createUserCoupon(db, coupon) {
  db.prepare(
    `
      INSERT INTO user_coupons (
        id,
        campaign_id,
        user_id,
        status,
        issued_at,
        used_at,
        used_order_id,
        created_at,
        updated_at
      )
      VALUES (
        @id,
        @campaign_id,
        @user_id,
        @status,
        @issued_at,
        @used_at,
        @used_order_id,
        @created_at,
        @updated_at
      )
    `
  ).run(coupon)
}

export function listIssuedCoupons(db, filters = {}) {
  const clauses = ['1 = 1']
  const params = {}

  if (filters.user_id) {
    clauses.push('uc.user_id = @user_id')
    params.user_id = filters.user_id
  }

  return db
    .prepare(
      `
        SELECT
          uc.*,
          cc.name,
          cc.description,
          cc.discount_amount,
          cc.min_order_amount,
          cc.target_type,
          cc.status AS campaign_status,
          cc.valid_from,
          cc.valid_to
        FROM user_coupons uc
        JOIN coupon_campaigns cc ON cc.id = uc.campaign_id
        WHERE ${clauses.join(' AND ')}
        ORDER BY uc.issued_at DESC, uc.id DESC
      `
    )
    .all(params)
}

export function findIssuedCouponById(db, couponId) {
  return db
    .prepare(
      `
        SELECT
          uc.*,
          cc.name,
          cc.description,
          cc.discount_amount,
          cc.min_order_amount,
          cc.target_type,
          cc.status AS campaign_status,
          cc.valid_from,
          cc.valid_to
        FROM user_coupons uc
        JOIN coupon_campaigns cc ON cc.id = uc.campaign_id
        WHERE uc.id = ?
        LIMIT 1
      `
    )
    .get(couponId)
}

export function updateUserCouponStatus(db, coupon) {
  db.prepare(
    `
      UPDATE user_coupons
      SET status = @status,
          used_at = @used_at,
          used_order_id = @used_order_id,
          updated_at = @updated_at
      WHERE id = @id
    `
  ).run(coupon)
}
