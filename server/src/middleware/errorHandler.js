import { failure } from '../utils/apiResponse.js'
import { AppError } from '../utils/appError.js'

export function errorHandler(error, _req, res, _next) {
  if (error instanceof AppError) {
    res.status(error.statusCode).json(failure(error.code, error.message, error.data))
    return
  }

  console.error(error)
  res.status(500).json(failure(50000, 'internal server error'))
}
