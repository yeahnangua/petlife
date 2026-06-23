import { describe, expect, it, vi } from 'vitest'
import {
  buildProductImageSimilarities,
  cosineSimilarity,
  extractImageEmbedding,
  normalizeRecognitionPredictions,
  recognizeImageElement
} from '@/lib/imageRecognition'

describe('image recognition helpers', () => {
  it('normalizes MobileNet predictions into search labels and hints', () => {
    const result = normalizeRecognitionPredictions([
      { className: 'tabby, tabby cat', probability: 0.87 },
      { className: 'packet, package', probability: 0.62 },
      { className: 'tennis ball', probability: 0.21 }
    ])

    expect(result).toMatchObject({
      source: 'mobilenet',
      petType: 'cat'
    })
    expect(result.labels).toEqual(['tabby cat', 'packet package', 'tennis ball'])
    expect(result.keywords).toEqual(expect.arrayContaining(['tabby', 'cat', 'packet', 'package', 'tennis', 'ball']))
    expect(result.categoryHints).toEqual(expect.arrayContaining(['food', 'toy']))
  })

  it('loads a model and classifies the provided image element', async () => {
    const imageElement = document.createElement('img')
    const classify = vi.fn().mockResolvedValue([
      { className: 'Labrador retriever', probability: 0.9 }
    ])
    const infer = vi.fn().mockReturnValue({
      data: vi.fn().mockResolvedValue(new Float32Array([0.25, 0.5, 0.75])),
      dispose: vi.fn()
    })
    const modelLoader = vi.fn().mockResolvedValue({ classify, infer })

    const result = await recognizeImageElement(imageElement, { modelLoader, topK: 1 })

    expect(modelLoader).toHaveBeenCalledTimes(1)
    expect(classify).toHaveBeenCalledWith(imageElement, 1)
    expect(infer).toHaveBeenCalledWith(imageElement, true)
    expect(result.petType).toBe('dog')
    expect(result.labels).toEqual(['labrador retriever'])
    expect(result.embedding).toEqual([0.25, 0.5, 0.75])
  })

  it('extracts an embedding tensor and disposes it after reading data', async () => {
    const imageElement = document.createElement('img')
    const tensor = {
      data: vi.fn().mockResolvedValue(new Float32Array([1, 0, 0])),
      dispose: vi.fn()
    }
    const model = {
      infer: vi.fn().mockReturnValue(tensor)
    }

    const embedding = await extractImageEmbedding(imageElement, { model })

    expect(model.infer).toHaveBeenCalledWith(imageElement, true)
    expect(embedding).toEqual([1, 0, 0])
    expect(tensor.dispose).toHaveBeenCalledTimes(1)
  })

  it('calculates cosine similarity for two embeddings', () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBe(1)
    expect(cosineSimilarity([1, 0, 0], [0, 1, 0])).toBe(0)
    expect(cosineSimilarity([1, 1, 0], [1, 0, 0])).toBeCloseTo(0.707, 3)
  })

  it('builds product image similarity scores from product cover embeddings', async () => {
    const queryEmbedding = [1, 0, 0]
    const productImages = {
      'p-a': document.createElement('img'),
      'p-b': document.createElement('img')
    }
    const model = {
      infer: vi
        .fn()
        .mockReturnValueOnce({
          data: vi.fn().mockResolvedValue(new Float32Array([1, 0, 0])),
          dispose: vi.fn()
        })
        .mockReturnValueOnce({
          data: vi.fn().mockResolvedValue(new Float32Array([0, 1, 0])),
          dispose: vi.fn()
        })
    }

    const similarities = await buildProductImageSimilarities(
      [
        { id: 'p-a', cover: '/a.jpg' },
        { id: 'p-b', cover: '/b.jpg' }
      ],
      queryEmbedding,
      {
        modelLoader: vi.fn().mockResolvedValue(model),
        imageLoader: vi.fn((src) => Promise.resolve(productImages[src === '/a.jpg' ? 'p-a' : 'p-b']))
      }
    )

    expect(similarities).toEqual({
      'p-a': 100,
      'p-b': 0
    })
  })

  it('reuses product image embeddings by image url', async () => {
    const imageElement = document.createElement('img')
    const model = {
      infer: vi.fn().mockReturnValue({
        data: vi.fn().mockResolvedValue(new Float32Array([1, 0, 0])),
        dispose: vi.fn()
      })
    }
    const modelLoader = vi.fn().mockResolvedValue(model)
    const imageLoader = vi.fn().mockResolvedValue(imageElement)
    const products = [{ id: 'p-cache', cover: '/cache-cover.jpg' }]

    await buildProductImageSimilarities(products, [1, 0, 0], { modelLoader, imageLoader })
    await buildProductImageSimilarities(products, [0, 1, 0], { modelLoader, imageLoader })

    expect(imageLoader).toHaveBeenCalledTimes(1)
    expect(model.infer).toHaveBeenCalledTimes(1)
  })

  it('does not cache failed product image embedding loads', async () => {
    const imageElement = document.createElement('img')
    const model = {
      infer: vi.fn().mockReturnValue({
        data: vi.fn().mockResolvedValue(new Float32Array([1, 0, 0])),
        dispose: vi.fn()
      })
    }
    const imageLoader = vi
      .fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(imageElement)
    const products = [{ id: 'p-retry', cover: '/retry-cover.jpg' }]

    const first = await buildProductImageSimilarities(products, [1, 0, 0], {
      modelLoader: vi.fn().mockResolvedValue(model),
      imageLoader
    })
    const second = await buildProductImageSimilarities(products, [1, 0, 0], {
      modelLoader: vi.fn().mockResolvedValue(model),
      imageLoader
    })

    expect(first).toEqual({})
    expect(second).toEqual({ 'p-retry': 100 })
    expect(imageLoader).toHaveBeenCalledTimes(2)
  })
})
