import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { cartItems } from '@/mocks'
import { getCartSummary } from '@/lib/pricing'
import { useCartStore } from '@/stores/cart'

describe('pricing helpers', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('calculates totals from valid selected items only', () => {
    const summary = getCartSummary(cartItems)

    expect(summary.selectedCount).toBe(3)
    expect(summary.invalidCount).toBe(1)
    expect(summary.total).toBe(352)
  })

  it('recomputes totals when a cart item is toggled on', () => {
    const store = useCartStore()

    store.toggleSelection('ci-3')

    expect(store.summary.selectedCount).toBe(4)
    expect(store.summary.total).toBe(470)
  })
})
