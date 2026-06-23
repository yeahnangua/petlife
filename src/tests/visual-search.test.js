import { describe, expect, it } from 'vitest'
import { products } from '@/mocks'
import {
  createVisualSearchRecord,
  rankVisualSearchMatches,
  toggleVisualSearchFavorite,
  upsertVisualSearchHistory
} from '@/lib/visualSearch'

describe('visual search helpers', () => {
  it('ranks in-stock matches for the active pet type with similarity metadata', () => {
    const matches = rankVisualSearchMatches({
      products,
      petType: 'cat',
      imageName: 'cat-food-package.jpg',
      limit: 3
    })

    expect(matches).toHaveLength(3)
    expect(matches[0].product.petType).toBe('cat')
    expect(matches[0].similarity).toBeGreaterThan(matches[2].similarity)
    expect(matches[0].reason).toContain('猫咪')
    expect(matches.every((match) => match.product.stockStatus !== 'soldOut')).toBe(true)
  })

  it('uses recognition keywords and category hints when ranking matches', () => {
    const matches = rankVisualSearchMatches({
      products,
      petType: 'dog',
      imageName: 'uploaded-photo.jpg',
      recognition: {
        labels: ['tennis ball', 'rubber toy'],
        keywords: ['tennis', 'ball', 'rubber', 'toy'],
        categoryHints: ['toy']
      },
      limit: 2
    })

    expect(matches[0].product.id).toBe('p-006')
    expect(matches[0].labels).toEqual(expect.arrayContaining(['狗狗', '玩具']))
    expect(matches[0].reason).toContain('AI识别')
  })

  it('combines image similarity and tag similarity with configurable weights', () => {
    const matches = rankVisualSearchMatches({
      products,
      petType: 'dog',
      imageName: 'uploaded-photo.jpg',
      recognition: {
        labels: ['rubber toy'],
        keywords: ['rubber', 'toy'],
        categoryHints: ['toy']
      },
      imageSimilarities: {
        'p-005': 96,
        'p-006': 50
      },
      weights: {
        image: 0.8,
        tag: 0.2
      },
      limit: 2
    })

    expect(matches[0].product.id).toBe('p-005')
    expect(matches[0].imageSimilarity).toBe(96)
    expect(matches[0].tagSimilarity).toBeLessThan(matches[1].tagSimilarity)
    expect(matches[0].reason).toContain('图片 96%')
    expect(matches[0].reason).toContain('标签')
  })

  it('prepends a new history record and limits history to twenty items', () => {
    const existing = Array.from({ length: 20 }, (_, index) =>
      createVisualSearchRecord({
        id: `old-${index}`,
        imageUrl: `/images/old-${index}.jpg`,
        labels: ['旧记录'],
        matches: products.slice(0, 1),
        searchedAt: `2026-06-${String(index + 1).padStart(2, '0')}T08:00:00.000Z`
      })
    )

    const next = upsertVisualSearchHistory(existing, {
      id: 'new-record',
      imageUrl: '/images/new.jpg',
      labels: ['猫粮', '包装识别'],
      matches: products.slice(0, 2),
      searchedAt: '2026-06-23T08:00:00.000Z'
    })

    expect(next).toHaveLength(20)
    expect(next[0]).toMatchObject({
      id: 'new-record',
      thumbUrl: '/images/new.jpg',
      resultCount: 2,
      topProductId: products[0].id
    })
    expect(next.find((item) => item.id === 'old-19')).toBeUndefined()
  })

  it('toggles favorite state without changing other records', () => {
    const history = [
      createVisualSearchRecord({ id: 'a', imageUrl: '/a.jpg', labels: ['猫粮'], matches: products.slice(0, 1) }),
      createVisualSearchRecord({ id: 'b', imageUrl: '/b.jpg', labels: ['玩具'], matches: products.slice(1, 2) })
    ]

    const next = toggleVisualSearchFavorite(history, 'b')

    expect(next[0].favorite).toBe(false)
    expect(next[1].favorite).toBe(true)
  })
})
