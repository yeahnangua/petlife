import { describe, expect, it } from 'vitest'
import { products, bundles } from '@/mocks'
import {
  filterProductsByPetType,
  getFeaturedProducts,
  getRecommendedBundles
} from '@/lib/catalog'

describe('catalog helpers', () => {
  it('returns products for the active pet type and shared items', () => {
    const items = filterProductsByPetType(products, 'cat')

    expect(items.length).toBeGreaterThan(0)
    expect(items.every((item) => item.petType === 'cat' || item.petType === 'all')).toBe(true)
  })

  it('limits featured products to four items', () => {
    const items = getFeaturedProducts(products, 'dog')

    expect(items).toHaveLength(4)
  })

  it('keeps bundle recommendations aligned to the active pet type', () => {
    const items = getRecommendedBundles(bundles, 'dog')

    expect(items.length).toBeGreaterThan(0)
    expect(items.every((item) => item.petType === 'dog' || item.petType === 'all')).toBe(true)
  })
})
