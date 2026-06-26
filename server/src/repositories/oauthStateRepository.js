export function createOAuthState(db, state) {
  db.prepare(
    `
      INSERT INTO wechat_oauth_states (
        state,
        provider,
        redirect_path,
        expires_at,
        used_at,
        created_at
      )
      VALUES (
        @state,
        @provider,
        @redirect_path,
        @expires_at,
        @used_at,
        @created_at
      )
    `
  ).run(state)
}

export function findOAuthState(db, state) {
  return db
    .prepare(
      `
        SELECT *
        FROM wechat_oauth_states
        WHERE state = ?
        LIMIT 1
      `
    )
    .get(state)
}

export function markOAuthStateUsed(db, state, usedAt) {
  db.prepare(
    `
      UPDATE wechat_oauth_states
      SET used_at = ?
      WHERE state = ?
    `
  ).run(usedAt, state)
}
