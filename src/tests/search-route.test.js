import { describe, expect, it } from 'vitest'
import router from '@/router'

describe('search route', () => {
  it('registers the visual search page as a secondary route', () => {
    const route = router.getRoutes().find((item) => item.name === 'search')

    expect(route?.path).toBe('/search')
    expect(route?.meta.title).toBe('拍照搜商品')
  })

  it('registers the AI customer service page as a secondary route', () => {
    const route = router.getRoutes().find((item) => item.name === 'ai-consult')

    expect(route?.path).toBe('/ai-consult')
    expect(route?.meta.title).toBe('AI客服')
    expect(route?.meta.tab).toBeUndefined()
  })
})
