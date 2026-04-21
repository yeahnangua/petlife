import { relative, sep } from 'node:path'
import { AppError } from '../utils/appError.js'

export function getUploadedImage(file, config) {

  if (!file) {
    throw new AppError(400, 40000, 'file is required')
  }

  const relativePath = relative(config.uploadDir, file.path).split(sep).join('/')

  return {
    url: `/uploads/${relativePath}`,
    filename: file.filename,
    original_name: file.originalname,
    mime_type: file.mimetype,
    size: file.size
  }
}
