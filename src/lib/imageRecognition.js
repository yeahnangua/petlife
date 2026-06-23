let mobileNetModelPromise = null
const productEmbeddingCache = new Map()

const petKeywordMap = {
  cat: ['cat', 'kitten', 'feline', 'tabby', 'persian', 'siamese', 'egyptian'],
  dog: ['dog', 'puppy', 'canine', 'retriever', 'labrador', 'terrier', 'poodle', 'husky', 'beagle']
}

const categoryKeywordMap = {
  food: ['food', 'kibble', 'package', 'packet', 'pouch', 'carton', 'can', 'tin', 'bowl'],
  snack: ['snack', 'treat', 'meat', 'jerky'],
  litter: ['litter', 'sand', 'tray'],
  toy: ['toy', 'ball', 'rubber', 'stick', 'teddy', 'frisbee'],
  clean: ['shampoo', 'soap', 'lotion', 'spray', 'bottle'],
  travel: ['backpack', 'carrier', 'crate', 'bag', 'harness'],
  care: ['supplement', 'medicine', 'tube', 'health'],
  home: ['fountain', 'water', 'bowl', 'dispenser']
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function normalizeLabel(className = '') {
  const words = String(className)
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)

  return unique(words).join(' ')
}

function tokenize(labels = []) {
  return unique(
    labels.flatMap((label) =>
      String(label)
        .toLowerCase()
        .match(/[a-z0-9\u4e00-\u9fa5]+/g) || []
    )
  )
}

function inferPetType(keywords = []) {
  if (keywords.some((keyword) => petKeywordMap.dog.includes(keyword))) return 'dog'
  if (keywords.some((keyword) => petKeywordMap.cat.includes(keyword))) return 'cat'
  return ''
}

function inferCategoryHints(keywords = []) {
  return Object.entries(categoryKeywordMap)
    .filter(([, categoryKeywords]) => keywords.some((keyword) => categoryKeywords.includes(keyword)))
    .map(([category]) => category)
}

export function normalizeRecognitionPredictions(predictions = []) {
  const normalizedPredictions = predictions.map((prediction) => ({
    label: normalizeLabel(prediction.className || prediction.label),
    score: Number(prediction.probability ?? prediction.score ?? 0)
  }))

  const labels = unique(normalizedPredictions.map((prediction) => prediction.label))
  const keywords = tokenize(labels)

  return {
    source: 'mobilenet',
    predictions: normalizedPredictions,
    labels,
    keywords,
    petType: inferPetType(keywords),
    categoryHints: inferCategoryHints(keywords)
  }
}

export async function loadMobileNetModel() {
  if (!mobileNetModelPromise) {
    mobileNetModelPromise = Promise.all([
      import('@tensorflow/tfjs'),
      import('@tensorflow-models/mobilenet')
    ]).then(([, mobilenet]) => mobilenet.load({ version: 2, alpha: 0.75 }))
  }

  return mobileNetModelPromise
}

export async function extractImageEmbedding(imageElement, { model, modelLoader = loadMobileNetModel } = {}) {
  const resolvedModel = model || (await modelLoader())
  const embeddingTensor = resolvedModel.infer(imageElement, true)

  try {
    return Array.from(await embeddingTensor.data())
  } finally {
    embeddingTensor.dispose?.()
  }
}

export function cosineSimilarity(left = [], right = []) {
  const length = Math.min(left.length, right.length)
  if (!length) return 0

  let dot = 0
  let leftNorm = 0
  let rightNorm = 0

  for (let index = 0; index < length; index += 1) {
    dot += left[index] * right[index]
    leftNorm += left[index] * left[index]
    rightNorm += right[index] * right[index]
  }

  if (!leftNorm || !rightNorm) return 0

  const similarity = dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm))
  return Math.min(1, Math.max(-1, similarity))
}

export function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('商品图片加载失败'))
    image.src = src
  })
}

async function getProductImageEmbedding(imageUrl, { model, imageLoader }) {
  if (!productEmbeddingCache.has(imageUrl)) {
    productEmbeddingCache.set(
      imageUrl,
      imageLoader(imageUrl)
        .then((imageElement) => extractImageEmbedding(imageElement, { model }))
        .catch((error) => {
          productEmbeddingCache.delete(imageUrl)
          throw error
        })
    )
  }

  return productEmbeddingCache.get(imageUrl)
}

export async function buildProductImageSimilarities(
  products = [],
  queryEmbedding = [],
  { modelLoader = loadMobileNetModel, imageLoader = loadImageElement } = {}
) {
  if (!queryEmbedding.length) return {}

  const model = await modelLoader()
  const entries = await Promise.all(products.map(async (product) => {
    const imageUrl = product.cover || product.image || product.imageUrl
    if (!product.id || !imageUrl) return null

    try {
      const productEmbedding = await getProductImageEmbedding(imageUrl, { model, imageLoader })
      const similarity = Math.max(0, cosineSimilarity(queryEmbedding, productEmbedding))
      return [product.id, Math.round(similarity * 100)]
    } catch {
      return null
    }
  }))

  return Object.fromEntries(entries.filter(Boolean))
}

export async function recognizeImageElement(imageElement, { modelLoader = loadMobileNetModel, topK = 5 } = {}) {
  if (!imageElement) {
    throw new Error('请先选择一张图片')
  }

  const model = await modelLoader()
  const [predictions, embedding] = await Promise.all([
    model.classify(imageElement, topK),
    extractImageEmbedding(imageElement, { model })
  ])

  return {
    ...normalizeRecognitionPredictions(predictions),
    embedding
  }
}
