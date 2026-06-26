import { randomBytes, randomUUID } from 'node:crypto'
import { AppError } from '../utils/appError.js'
import { findUserById } from '../repositories/userRepository.js'
import { createSession, deleteSessionByToken, findSessionByToken } from '../repositories/sessionRepository.js'

const DEMO_USER_ID = 'u_demo_001'
const DEMO_WECHAT_SUBJECT = 'demo-wechat-openid'
const SESSION_DAYS = 30

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

export function loginWithDemoWechat(db) {
  const user = findUserById(db, DEMO_USER_ID)

  if (!user) {
    throw new AppError(404, 40400, 'demo user not found')
  }

  const currentDate = new Date()
  const timestamp = now(currentDate)
  const token = createToken()

  createSession(db, {
    id: `session_${randomUUID().slice(0, 12)}`,
    user_id: user.id,
    token,
    provider: 'wechat',
    provider_subject: DEMO_WECHAT_SUBJECT,
    expires_at: now(addDays(currentDate, SESSION_DAYS)),
    created_at: timestamp,
    updated_at: timestamp
  })

  return {
    token,
    user: mapUser(user)
  }
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
