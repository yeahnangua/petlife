import { AppError } from './appError.js'

export function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

export function requireString(value, fieldName) {
  if (!isNonEmptyString(value)) {
    throw new AppError(400, 40000, `${fieldName} is required`)
  }

  return value.trim()
}

export function requireEnum(value, allowedValues, fieldName) {
  if (!allowedValues.includes(value)) {
    throw new AppError(400, 40000, `${fieldName} must be one of: ${allowedValues.join(', ')}`)
  }

  return value
}

export function requireDateString(value, fieldName) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) {
    throw new AppError(400, 40000, `${fieldName} must use YYYY-MM-DD`)
  }

  return value
}

export function requireStringArray(value, fieldName) {
  if (value == null) {
    return []
  }

  if (!Array.isArray(value) || value.some((item) => !isNonEmptyString(item))) {
    throw new AppError(400, 40000, `${fieldName} must be an array of strings`)
  }

  return value.map((item) => item.trim())
}
