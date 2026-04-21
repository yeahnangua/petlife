import { AppError } from '../utils/appError.js'

export function notFound(_req, _res, next) {
  next(new AppError(404, 40400, 'not found'))
}
