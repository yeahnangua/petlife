import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { basename, extname, join, relative, sep } from 'node:path'
import { AppError } from '../utils/appError.js'

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const REMOTE_DOWNLOAD_TIMEOUT_MS = 10000

function getNowParts() {
  const date = new Date()
  return {
    year: String(date.getFullYear()),
    month: String(date.getMonth() + 1).padStart(2, '0'),
    timestamp: String(Date.now())
  }
}

function extensionFromMimeType(mimeType) {
  const type = mimeType.split(';')[0].trim().toLowerCase()

  if (type === 'image/jpeg') {
    return '.jpg'
  }

  if (type === 'image/png') {
    return '.png'
  }

  if (type === 'image/webp') {
    return '.webp'
  }

  if (type === 'image/gif') {
    return '.gif'
  }

  if (type === 'image/svg+xml') {
    return '.svg'
  }

  return '.bin'
}

function buildFileResponse(filePath, fileInfo, config) {
  const relativePath = relative(config.uploadDir, filePath).split(sep).join('/')

  return {
    url: `/uploads/${relativePath}`,
    filename: fileInfo.filename,
    original_name: fileInfo.originalName,
    mime_type: fileInfo.mimeType,
    size: fileInfo.size
  }
}

function normalizeRemoteImageUrl(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(400, 40000, 'image url is required')
  }

  let url
  try {
    url = new URL(value.trim())
  } catch (_error) {
    throw new AppError(400, 40000, 'valid image url is required')
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new AppError(400, 40000, 'only http image urls are allowed')
  }

  return url
}

async function saveImageBuffer(buffer, fileInfo, config) {
  if (buffer.byteLength > MAX_IMAGE_SIZE) {
    throw new AppError(400, 40000, 'image file is too large')
  }

  const { year, month, timestamp } = getNowParts()
  const targetDir = join(config.uploadDir, year, month)
  const originalExtension = extname(fileInfo.originalName || '')
  const extension = (originalExtension || extensionFromMimeType(fileInfo.mimeType)).toLowerCase()
  const filename = `${timestamp}-${randomUUID()}${extension}`
  const filePath = join(targetDir, filename)

  mkdirSync(targetDir, { recursive: true })
  await writeFile(filePath, buffer)

  return buildFileResponse(
    filePath,
    {
      filename,
      originalName: fileInfo.originalName,
      mimeType: fileInfo.mimeType,
      size: buffer.byteLength
    },
    config
  )
}

export function getUploadedImage(file, config) {
  if (!file) {
    throw new AppError(400, 40000, 'file is required')
  }

  return buildFileResponse(file.path, {
    filename: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size
  }, config)
}

export async function downloadUploadedImageFromUrl(sourceUrl, config, fetchImpl = globalThis.fetch) {
  const url = normalizeRemoteImageUrl(sourceUrl)

  if (typeof fetchImpl !== 'function') {
    throw new AppError(500, 50000, 'server fetch is unavailable')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REMOTE_DOWNLOAD_TIMEOUT_MS)
  let response

  try {
    response = await fetchImpl(url, {
      redirect: 'follow',
      signal: controller.signal
    })
  } catch (_error) {
    throw new AppError(400, 40000, 'image url download failed')
  } finally {
    clearTimeout(timeout)
  }

  if (!response.ok) {
    throw new AppError(400, 40000, 'image url download failed')
  }

  const mimeType = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() || ''

  if (!mimeType.startsWith('image/')) {
    throw new AppError(400, 40000, 'image url must point to an image')
  }

  const contentLength = Number(response.headers.get('content-length') || 0)
  if (contentLength > MAX_IMAGE_SIZE) {
    throw new AppError(400, 40000, 'image file is too large')
  }

  const arrayBuffer = await response.arrayBuffer()
  const originalName = basename(url.pathname) || `remote-image${extensionFromMimeType(mimeType)}`

  return saveImageBuffer(Buffer.from(arrayBuffer), {
    originalName,
    mimeType
  }, config)
}
