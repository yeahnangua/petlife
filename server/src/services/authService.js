import { randomBytes, randomUUID } from 'node:crypto'
import { AppError } from '../utils/appError.js'
import { createOAuthState, findOAuthState, markOAuthStateUsed } from '../repositories/oauthStateRepository.js'
import { createSession, deleteSessionByToken, findSessionByToken } from '../repositories/sessionRepository.js'
import {
  createUserIdentity,
  findUserIdentity,
  updateUserIdentitySnapshot
} from '../repositories/userIdentityRepository.js'
import { createUser, findUserById } from '../repositories/userRepository.js'

const DEMO_USER_ID = 'u_demo_001'
const DEMO_WECHAT_SUBJECT = 'demo-wechat-openid'
const SESSION_DAYS = 30
const WECHAT_OFFICIAL_ACCOUNT_PROVIDER = 'wechat_official_account'
const OAUTH_STATE_MINUTES = 10

function now(date = new Date()) {
  return date.toISOString().slice(0, 19).replace('T', ' ')
}

function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function createToken() {
  return randomBytes(32).toString('base64url')
}

function createState() {
  return randomBytes(24).toString('base64url')
}

function mapUser(user) {
  return {
    id: user.id,
    nickname: user.nickname,
    phone: user.phone,
    avatar_url: user.avatar_url,
    member_level: user.member_level,
    points: user.points
  }
}

function normalizeRedirectPath(value) {
  const redirect = typeof value === 'string' ? value.trim() : ''
  if (!redirect.startsWith('/') || redirect.startsWith('//')) {
    return '/'
  }

  return redirect
}

function addMinutes(date, minutes) {
  const next = new Date(date)
  next.setMinutes(next.getMinutes() + minutes)
  return next
}

function parseSqlDate(value) {
  return new Date(`${String(value || '').replace(' ', 'T')}Z`)
}

function requireWechatOAuthConfig(config) {
  if (!config.wechatOfficialAccountAppId || !config.wechatOfficialAccountAppSecret) {
    throw new AppError(500, 50020, 'WeChat OAuth is not configured')
  }
}

function createMobileSession(db, { user, provider, providerSubject }) {
  const currentDate = new Date()
  const timestamp = now(currentDate)
  const token = createToken()

  createSession(db, {
    id: `session_${randomUUID().slice(0, 12)}`,
    user_id: user.id,
    token,
    provider,
    provider_subject: providerSubject,
    expires_at: now(addDays(currentDate, SESSION_DAYS)),
    created_at: timestamp,
    updated_at: timestamp
  })

  return {
    token,
    user: mapUser(user)
  }
}

export function loginWithDemoWechat(db) {
  const user = findUserById(db, DEMO_USER_ID)

  if (!user) {
    throw new AppError(404, 40400, 'demo user not found')
  }

  return createMobileSession(db, {
    user,
    provider: 'wechat',
    providerSubject: DEMO_WECHAT_SUBJECT
  })
}

export function createWechatOfficialAccountOAuthStart(db, config, query = {}) {
  requireWechatOAuthConfig(config)

  const currentDate = new Date()
  const timestamp = now(currentDate)
  const state = createState()
  const redirectPath = normalizeRedirectPath(query.redirect)

  createOAuthState(db, {
    state,
    provider: WECHAT_OFFICIAL_ACCOUNT_PROVIDER,
    redirect_path: redirectPath,
    expires_at: now(addMinutes(currentDate, OAUTH_STATE_MINUTES)),
    used_at: '',
    created_at: timestamp
  })

  const callbackUrl = `${config.baseUrl.replace(/\/$/, '')}/api/auth/wechat-oauth/callback`
  const authUrl = new URL('https://open.weixin.qq.com/connect/oauth2/authorize')
  authUrl.searchParams.set('appid', config.wechatOfficialAccountAppId)
  authUrl.searchParams.set('redirect_uri', callbackUrl)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', config.wechatOfficialAccountScope)
  authUrl.searchParams.set('state', state)
  authUrl.hash = 'wechat_redirect'

  return authUrl.toString()
}

function loadValidOAuthState(db, state) {
  const row = findOAuthState(db, state)

  if (
    !row ||
    row.provider !== WECHAT_OFFICIAL_ACCOUNT_PROVIDER ||
    row.used_at ||
    parseSqlDate(row.expires_at).getTime() <= Date.now()
  ) {
    throw new AppError(400, 40020, 'invalid oauth state')
  }

  return row
}

function buildUserFromWechatInfo(userInfo, timestamp) {
  return {
    id: `u_wx_${randomUUID().slice(0, 10)}`,
    nickname: userInfo.nickname || '微信用户',
    phone: '',
    avatar_url: userInfo.headimgurl || '',
    member_level: 'PetLife · 微信会员',
    points: 0,
    created_at: timestamp,
    updated_at: timestamp
  }
}

function findOrCreateWechatUser(db, { openid, unionid, userInfo }) {
  const timestamp = now()
  const identity = findUserIdentity(db, WECHAT_OFFICIAL_ACCOUNT_PROVIDER, openid)

  if (identity) {
    updateUserIdentitySnapshot(db, {
      provider: WECHAT_OFFICIAL_ACCOUNT_PROVIDER,
      provider_subject: openid,
      unionid: unionid || '',
      nickname_snapshot: userInfo.nickname || '',
      avatar_url_snapshot: userInfo.headimgurl || '',
      updated_at: timestamp
    })
    return findUserById(db, identity.user_id)
  }

  const user = buildUserFromWechatInfo(userInfo, timestamp)
  const transaction = db.transaction(() => {
    createUser(db, user)
    createUserIdentity(db, {
      id: `identity_${randomUUID().slice(0, 12)}`,
      user_id: user.id,
      provider: WECHAT_OFFICIAL_ACCOUNT_PROVIDER,
      provider_subject: openid,
      unionid: unionid || '',
      nickname_snapshot: userInfo.nickname || '',
      avatar_url_snapshot: userInfo.headimgurl || '',
      created_at: timestamp,
      updated_at: timestamp
    })
  })

  transaction()
  return user
}

export async function handleWechatOfficialAccountOAuthCallback(db, config, client, query = {}) {
  requireWechatOAuthConfig(config)

  const code = typeof query.code === 'string' ? query.code.trim() : ''
  const state = typeof query.state === 'string' ? query.state.trim() : ''
  if (!code) {
    throw new AppError(400, 40000, 'code is required')
  }

  const stateRow = loadValidOAuthState(db, state)
  markOAuthStateUsed(db, state, now())

  const tokenData = await client.exchangeCode({
    appId: config.wechatOfficialAccountAppId,
    appSecret: config.wechatOfficialAccountAppSecret,
    code
  })
  const openid = tokenData.openid
  if (!openid) {
    throw new AppError(502, 50221, 'WeChat OAuth returned invalid openid')
  }

  const userInfo =
    config.wechatOfficialAccountScope === 'snsapi_userinfo'
      ? await client.fetchUserInfo({
        accessToken: tokenData.access_token,
        openid
      })
      : {}
  const unionid = userInfo.unionid || tokenData.unionid || ''
  const user = findOrCreateWechatUser(db, {
    openid,
    unionid,
    userInfo
  })

  const session = createMobileSession(db, {
    user,
    provider: WECHAT_OFFICIAL_ACCOUNT_PROVIDER,
    providerSubject: openid
  })

  const redirectUrl = new URL(config.mobileAppUrl)
  redirectUrl.hash = `/login?wechat_token=${encodeURIComponent(session.token)}&redirect=${encodeURIComponent(stateRow.redirect_path)}`
  return redirectUrl.toString()
}

export function getUserByToken(db, token) {
  if (!token) {
    throw new AppError(401, 40100, 'unauthorized')
  }

  const session = findSessionByToken(db, token)

  if (!session) {
    throw new AppError(401, 40100, 'unauthorized')
  }

  if (new Date(`${session.expires_at.replace(' ', 'T')}Z`).getTime() <= Date.now()) {
    deleteSessionByToken(db, token)
    throw new AppError(401, 40101, 'session expired')
  }

  const user = findUserById(db, session.user_id)

  if (!user) {
    deleteSessionByToken(db, token)
    throw new AppError(401, 40100, 'unauthorized')
  }

  return mapUser(user)
}

export function logoutByToken(db, token) {
  if (token) {
    deleteSessionByToken(db, token)
  }
}
