import { describe, expect, it } from 'vitest'
import { products, bundles } from '@/mocks'
import {
  filterProductsByPetType,
  getFeaturedProducts,
  getMarketingRecommendation,
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

  it('builds a cart-aware marketing recommendation for active pet type without claiming a real coupon', () => {
    const recommendation = getMarketingRecommendation({
      petType: 'dog',
      products,
      services: [{ id: 's-1', title: '狗狗精洗护理', petType: 'dog' }],
      profile: { level: '铂金会员', points: 2680, stats: { orderCount: 12 } },
      cartItems: [{ id: 'c-1', valid: true }, { id: 'c-2', valid: false }]
    })

    expect(recommendation.profileTags).toContain('高复购用户')
    expect(recommendation.profileTags).toContain('购物车待转化')
    expect(recommendation.campaign.title).toBe('会员加购方案')
    expect(recommendation.campaign.value).toBe('高客单组合')
    expect(`${recommendation.campaign.title}${recommendation.campaign.value}`).not.toContain('券')
    expect(recommendation.product.petType).toBe('dog')
    expect(recommendation.service.title).toBe('狗狗精洗护理')
  })
})
