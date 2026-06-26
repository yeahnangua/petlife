import { randomBytes, randomUUID } from 'node:crypto'

export function createDemoUserAuthHeader(db) {
  const timestamp = '2026-04-21 10:00:00'
  const token = randomBytes(24).toString('base64url')

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
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
  ).run(
    `session_test_${randomUUID().slice(0, 8)}`,
    'u_demo_001',
    token,
    'wechat',
    'demo-wechat-openid',
    '2026-07-21 10:00:00',
    timestamp,
    timestamp
  )

  return { Authorization: `Bearer ${token}` }
}
