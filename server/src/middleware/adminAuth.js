import { AppError } from '../utils/appError.js'

export function adminAuth(req, _res, next) {
  const expectedKey = req.app.locals.config.adminKey
  const providedKey = req.get('x-admin-key')

  if (providedKey !== expectedKey) {
    next(new AppError(401, 40100, 'unauthorized'))
    return
  }

  next()
}
