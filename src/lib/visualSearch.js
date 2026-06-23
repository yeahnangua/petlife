/**
 * 视觉搜索工具函数
 * 提供商品相似度排序和图搜历史管理。
 */

const HISTORY_LIMIT = 20
const DEFAULT_SIMILARITY_WEIGHTS = {
  image: 0.6,
  tag: 0.4
}

const categoryLabelMap = {
  food: '主粮',
  snack: '零食',
  litter: '猫砂',
  toy: '玩具',
  clean: '洗护',
  travel: '出行',
  care: '保健',
  home: '居家'
}

const categoryKeywordMap = {
  food: ['food', '粮', '猫粮', '狗粮', '包装', 'package'],
  snack: ['snack', '零食', '冻干', 'treat'],
  litter: ['litter', '猫砂', '豆腐砂'],
  toy: ['toy', '玩具', '逗猫', '洁齿'],
  clean: ['clean', '洗护', '沐浴', 'shampoo'],
  travel: ['travel', '外出', '背包', 'bag', 'harness', 'carrier'],
  care: ['care', 'health', 'supplement', '益生菌', '营养膏', '保健'],
  home: ['home', 'fountain', 'water', '饮水机', '居家']
}

function productPetLabel(product) {
  if (product?.petType === 'dog') return '狗狗'
  if (product?.petType === 'all') return '猫犬通用'
  return '猫咪'
}

function normalizeTokens(value = '') {
  return String(value).toLowerCase().split(/[\s._-]+/).filter(Boolean)
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function resolveRecognitionTokens(recognition = {}) {
  return unique([
    ...(recognition.keywords || []),
    ...(recognition.labels || []).flatMap((label) => normalizeTokens(label))
  ].map((token) => String(token).toLowerCase()))
}

function resolveWeights(weights = {}) {
  const image = Number.isFinite(Number(weights.image)) ? Number(weights.image) : DEFAULT_SIMILARITY_WEIGHTS.image
  const tag = Number.isFinite(Number(weights.tag)) ? Number(weights.tag) : DEFAULT_SIMILARITY_WEIGHTS.tag
  const total = image + tag

  if (total <= 0) return DEFAULT_SIMILARITY_WEIGHTS

  return {
    image: image / total,
    tag: tag / total
  }
}

function resolveImageSimilarity(imageSimilarities = {}, productId) {
  const value = imageSimilarities[productId]
  if (!Number.isFinite(Number(value))) return null
  return Math.max(0, Math.min(100, Number(value)))
}

function scoreProduct(product, { petType, imageName, recognition }) {
  const tokens = normalizeTokens(imageName)
  const recognitionTokens = resolveRecognitionTokens(recognition)
  const categoryHints = recognition?.categoryHints || []
  const searchable = [
    product.title,
    product.subtitle,
    product.category,
    ...(product.tags || []),
    ...(categoryKeywordMap[product.category] || [])
  ]
    .join(' ')
    .toLowerCase()

  let score = product.petType === petType ? 34 : 18

  tokens.forEach((token) => {
    if (searchable.includes(token)) score += 12
  })

  recognitionTokens.forEach((token) => {
    if (searchable.includes(token)) score += 10
  })

  if (categoryHints.includes(product.category)) score += 24

  if (petType === 'cat' && /cat|猫/.test(imageName)) score += product.petType === 'cat' ? 10 : 0
  if (petType === 'dog' && /dog|犬|狗/.test(imageName)) score += product.petType === 'dog' ? 10 : 0
  if (/food|粮|package|包装/.test(imageName) && product.category === 'food') score += 16
  if (/toy|玩具/.test(imageName) && product.category === 'toy') score += 14
  if (/clean|洗护|shampoo/.test(imageName) && product.category === 'clean') score += 14
  if (/care|health|supplement|益生菌|营养/.test(imageName) && product.category === 'care') score += 14
  if (/home|fountain|water|饮水/.test(imageName) && product.category === 'home') score += 14
  if (recognitionTokens.includes('cat')) score += product.petType === 'cat' ? 8 : 0
  if (recognitionTokens.includes('dog')) score += product.petType === 'dog' ? 8 : 0

  score += Math.min(Number(product.rating || 4.5) * 2, 10)
  score += Math.min(Number(product.sold || 0) / 3000, 8)

  return Math.round(Math.min(score, 96))
}

export function rankVisualSearchMatches({
  products = [],
  petType = 'cat',
  imageName = '',
  recognition = {},
  imageSimilarities = {},
  weights = DEFAULT_SIMILARITY_WEIGHTS,
  limit = 6
} = {}) {
  const activePetType = recognition.petType || petType
  const recognitionLabels = recognition.labels || []
  const resolvedWeights = resolveWeights(weights)

  return products
    .filter((product) => product.stockStatus !== 'soldOut')
    .filter((product) => product.petType === activePetType || product.petType === 'all')
    .map((product) => {
      const tagSimilarity = scoreProduct(product, { petType: activePetType, imageName, recognition })
      const imageSimilarity = resolveImageSimilarity(imageSimilarities, product.id)
      const similarity = imageSimilarity === null
        ? tagSimilarity
        : Math.round((imageSimilarity * resolvedWeights.image) + (tagSimilarity * resolvedWeights.tag))
      const label = categoryLabelMap[product.category] || '商品'
      const labels = unique([productPetLabel(product), label, ...recognitionLabels]).slice(0, 5)
      const reasonPrefix = recognitionLabels.length ? 'AI识别' : productPetLabel(product)
      const scoreReason = imageSimilarity === null
        ? `标签 ${tagSimilarity}%`
        : `图片 ${imageSimilarity}% · 标签 ${tagSimilarity}%`

      return {
        product,
        similarity,
        imageSimilarity,
        tagSimilarity,
        labels,
        reason: `${reasonPrefix} · ${scoreReason} · ${label}特征匹配 · 相似度 ${similarity}%`
      }
    })
    .sort((left, right) => right.similarity - left.similarity)
    .slice(0, limit)
}

function resolveHistoryProduct(match) {
  return match?.product || match
}

export function createVisualSearchRecord({
  id = `vs-${Date.now()}`,
  imageUrl = '',
  labels = [],
  matches = [],
  searchedAt = new Date().toISOString(),
  favorite = false
} = {}) {
  const firstProduct = resolveHistoryProduct(matches[0])

  return {
    id,
    thumbUrl: imageUrl,
    labels,
    searchedAt,
    resultCount: matches.length,
    topProductId: firstProduct?.id || '',
    topProductTitle: firstProduct?.title || firstProduct?.name || '',
    favorite
  }
}

export function upsertVisualSearchHistory(history = [], payload = {}, limit = HISTORY_LIMIT) {
  const record = createVisualSearchRecord(payload)
  const withoutDuplicate = history.filter((item) => item.id !== record.id)

  return [record, ...withoutDuplicate].slice(0, limit)
}

export function toggleVisualSearchFavorite(history = [], id) {
  return history.map((item) => (
    item.id === id
      ? { ...item, favorite: !item.favorite }
      : item
  ))
}

export function removeVisualSearchRecord(history = [], id) {
  return history.filter((item) => item.id !== id)
}

export function loadVisualSearchHistory(storage = globalThis.localStorage, key = 'petlifeVisualSearchHistory') {
  if (!storage) return []

  try {
    const parsed = JSON.parse(storage.getItem(key) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveVisualSearchHistory(history = [], storage = globalThis.localStorage, key = 'petlifeVisualSearchHistory') {
  if (!storage) return history
  storage.setItem(key, JSON.stringify(history.slice(0, HISTORY_LIMIT)))
  return history
}

/**
 * 压缩图片
 * @param {File} file - 原始图片文件
 * @param {number} maxSize - 最大文件大小（字节）
 * @param {number} quality - 压缩质量 0-1
 * @returns {Promise<Blob>} 压缩后的图片
 */
export async function compressImage(file, maxSize = 2 * 1024 * 1024, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target.result
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // 如果图片尺寸过大，等比例缩小
        const maxDimension = 1920
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension
            width = maxDimension
          } else {
            width = (width / height) * maxDimension
            height = maxDimension
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob.size <= maxSize) {
              resolve(blob)
            } else {
              // 如果还是太大，降低质量
              const newQuality = Math.max(0.1, quality - 0.1)
              compressImage(file, maxSize, newQuality).then(resolve).catch(reject)
            }
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = reject
    }
    reader.onerror = reject
  })
}

/**
 * 获取图片主色调
 * @param {string} imageUrl - 图片 URL
 * @returns {Promise<string>} RGB 颜色值
 */
export async function getImageDominantColor(imageUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.src = imageUrl

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      // 缩小图片尺寸以提高性能
      const size = 50
      canvas.width = size
      canvas.height = size

      ctx.drawImage(img, 0, 0, size, size)
      const imageData = ctx.getImageData(0, 0, size, size).data

      let r = 0,
        g = 0,
        b = 0
      const pixelCount = imageData.length / 4

      for (let i = 0; i < imageData.length; i += 4) {
        r += imageData[i]
        g += imageData[i + 1]
        b += imageData[i + 2]
      }

      r = Math.round(r / pixelCount)
      g = Math.round(g / pixelCount)
      b = Math.round(b / pixelCount)

      resolve(`rgb(${r}, ${g}, ${b})`)
    }

    img.onerror = reject
  })
}

/**
 * 检测图片是否模糊
 * @param {string} imageUrl - 图片 URL
 * @returns {Promise<boolean>} 是否模糊
 */
export async function detectImageBlur(imageUrl) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.src = imageUrl

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      const size = 100
      canvas.width = size
      canvas.height = size

      ctx.drawImage(img, 0, 0, size, size)
      const imageData = ctx.getImageData(0, 0, size, size).data

      // 简单的模糊检测：计算相邻像素的差异
      let edgeCount = 0
      const threshold = 30

      for (let i = 0; i < imageData.length - 4; i += 4) {
        const diff = Math.abs(imageData[i] - imageData[i + 4])
        if (diff > threshold) {
          edgeCount++
        }
      }

      // 边缘数量少说明图片可能模糊
      const isBlur = edgeCount < size * size * 0.1
      resolve(isBlur)
    }

    img.onerror = () => resolve(false)
  })
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的大小
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * 验证图片文件
 * @param {File} file - 图片文件
 * @param {Object} options - 验证选项
 * @returns {Object} 验证结果
 */
export function validateImageFile(file, options = {}) {
  const {
    maxSize = 5 * 1024 * 1024, // 默认 5MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
    minWidth = 100,
    minHeight = 100
  } = options

  // 检查文件类型
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: '不支持的图片格式，请选择 JPG、PNG 或 WebP 格式'
    }
  }

  // 检查文件大小
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `图片大小不能超过 ${formatFileSize(maxSize)}`
    }
  }

  // 检查图片尺寸（需要异步）
  return new Promise((resolve) => {
    const img = new Image()
    img.src = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(img.src)

      if (img.width < minWidth || img.height < minHeight) {
        resolve({
          valid: false,
          error: `图片尺寸至少为 ${minWidth}x${minHeight}px`
        })
      } else {
        resolve({
          valid: true,
          width: img.width,
          height: img.height
        })
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      resolve({
        valid: false,
        error: '图片加载失败，请重新选择'
      })
    }
  })
}

/**
 * Base64 转 Blob
 * @param {string} base64 - Base64 字符串
 * @returns {Blob} Blob 对象
 */
export function base64ToBlob(base64) {
  const parts = base64.split(';base64,')
  const contentType = parts[0].split(':')[1]
  const raw = window.atob(parts[1])
  const rawLength = raw.length
  const uInt8Array = new Uint8Array(rawLength)

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i)
  }

  return new Blob([uInt8Array], { type: contentType })
}

/**
 * 图片 URL 转 File
 * @param {string} url - 图片 URL
 * @param {string} filename - 文件名
 * @returns {Promise<File>} File 对象
 */
export async function urlToFile(url, filename = 'image.jpg') {
  const response = await fetch(url)
  const blob = await response.blob()
  return new File([blob], filename, { type: blob.type })
}
