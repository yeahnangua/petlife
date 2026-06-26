CREATE TABLE IF NOT EXISTS user_identities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_subject TEXT NOT NULL,
  unionid TEXT NOT NULL DEFAULT '',
  nickname_snapshot TEXT NOT NULL DEFAULT '',
  avatar_url_snapshot TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(provider, provider_subject),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_identities_user_id ON user_identities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_identities_unionid ON user_identities(unionid);

CREATE TABLE IF NOT EXISTS wechat_oauth_states (
  state TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  redirect_path TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
