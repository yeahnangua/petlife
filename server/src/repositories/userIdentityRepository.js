export function findUserIdentity(db, provider, providerSubject) {
  return db
    .prepare(
      `
        SELECT *
        FROM user_identities
        WHERE provider = ? AND provider_subject = ?
        LIMIT 1
      `
    )
    .get(provider, providerSubject)
}

export function createUserIdentity(db, identity) {
  db.prepare(
    `
      INSERT INTO user_identities (
        id,
        user_id,
        provider,
        provider_subject,
        unionid,
        nickname_snapshot,
        avatar_url_snapshot,
        created_at,
        updated_at
      )
      VALUES (
        @id,
        @user_id,
        @provider,
        @provider_subject,
        @unionid,
        @nickname_snapshot,
        @avatar_url_snapshot,
        @created_at,
        @updated_at
      )
    `
  ).run(identity)
}

export function updateUserIdentitySnapshot(db, identity) {
  db.prepare(
    `
      UPDATE user_identities
      SET unionid = @unionid,
          nickname_snapshot = @nickname_snapshot,
          avatar_url_snapshot = @avatar_url_snapshot,
          updated_at = @updated_at
      WHERE provider = @provider AND provider_subject = @provider_subject
    `
  ).run(identity)
}
