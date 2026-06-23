import { randomUUID } from 'node:crypto'
import { extname, join } from 'node:path'
import { mkdirSync } from 'node:fs'
import multer from 'multer'
import { AppError } from '../utils/appError.js'
import { MAX_IMAGE_SIZE } from '../services/uploadService.js'

function getNowParts() {
  const date = new Date()
  return {
    year: String(date.getFullYear()),
    month: String(date.getMonth() + 1).padStart(2, '0'),
    timestamp: String(Date.now())
  }
}

const storage = multer.diskStorage({
  destination(req, _file, callback) {
    const { year, month } = getNowParts()
    const uploadDir = join(req.app.locals.config.uploadDir, year, month)
    mkdirSync(uploadDir, { recursive: true })
    callback(null, uploadDir)
  },
  filename(_req, file, callback) {
    const { timestamp } = getNowParts()
    const extension = extname(file.originalname) || '.bin'
    callback(null, `${timestamp}-${randomUUID()}${extension.toLowerCase()}`)
  }
})

const uploader = multer({
  storage,
  limits: {
    fileSize: MAX_IMAGE_SIZE
  },
  fileFilter(_req, file, callback) {
    if (!file.mimetype.startsWith('image/')) {
      callback(new AppError(400, 40000, 'only image uploads are allowed'))
      return
    }

    callback(null, true)
  }
})

export function uploadImage(req, res, next) {
  uploader.single('file')(req, res, (error) => {
    if (!error && !req.file) {
      next(new AppError(400, 40000, 'file is required'))
      return
    }

    if (error instanceof AppError) {
      next(error)
      return
    }

    if (error?.code === 'LIMIT_FILE_SIZE') {
      next(new AppError(400, 40000, 'image file is too large'))
      return
    }

    if (error) {
      next(new AppError(400, 40000, 'image upload failed'))
      return
    }

    next()
  })
}
