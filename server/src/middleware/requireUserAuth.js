import { getUserByToken } from '../services/authService.js'

export function readBearerToken(req) {
  const authorization = req.get('authorization') || ''
  const match = authorization.match(/^Bearer\s+(.+)$/i)
  return match ? match[1].trim() : ''
}

export function requireUserAuth(req, _res, next) {
  try {
    req.user = getUserByToken(req.app.locals.db, readBearerToken(req))
    next()
  } catch (error) {
    next(error)
  }
}
