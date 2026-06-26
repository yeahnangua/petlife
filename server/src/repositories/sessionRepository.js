export function createSession(db, session) {
  db.prepare(
    `
      INSERT INTO user_sessions (
        id,
        user_id,
        token,
        provider,
        provider_subject,
        expires_at,
        created_at,
        updated_at
      )
      VALUES (
        @id,
        @user_id,
        @token,
        @provider,
        @provider_subject,
        @expires_at,
        @created_at,
        @updated_at
      )
    `
  ).run(session)
}

export function findSessionByToken(db, token) {
  return db
    .prepare(
      `
        SELECT id, user_id, token, provider, provider_subject, expires_at, created_at, updated_at
        FROM user_sessions
        WHERE token = ?
        LIMIT 1
      `
    )
    .get(token)
}

export function deleteSessionByToken(db, token) {
  return db.prepare('DELETE FROM user_sessions WHERE token = ?').run(token)
}
