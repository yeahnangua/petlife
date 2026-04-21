import { defineStore } from 'pinia'
import { cartItems } from '@/mocks'
import { getCartSummary } from '@/lib/pricing'

const cloneItems = () => cartItems.map((item) => ({ ...item }))
const makeCartId = () => `ci-${Math.random().toString(36).slice(2, 10)}`

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: cloneItems()
  }),
  getters: {
    summary: (state) => getCartSummary(state.items),
    selectedItems: (state) => state.items.filter((item) => item.valid && item.selected),
    invalidItems: (state) => state.items.filter((item) => !item.valid)
  },
  actions: {
    toggleSelection(id) {
      const item = this.items.find((entry) => entry.id === id)
      if (item?.valid) {
        item.selected = !item.selected
      }
    },
    updateQuantity(id, delta) {
      const item = this.items.find((entry) => entry.id === id)
      if (item?.valid && item.quantity + delta >= 1) {
        item.quantity += delta
      }
    },
    setQuantity(id, quantity) {
      const item = this.items.find((entry) => entry.id === id)
      if (item?.valid && quantity >= 1) {
        item.quantity = quantity
      }
    },
    addProduct(product, specLabel, quantity = 1) {
      const existing = this.items.find(
        (item) => item.productId === product.id && item.specLabel === specLabel && item.valid
      )

      if (existing) {
        existing.quantity += quantity
        existing.selected = true
        return
      }

      this.items.unshift({
        id: makeCartId(),
        productId: product.id,
        product,
        specLabel,
        quantity,
        selected: true,
        valid: product.stockStatus !== 'soldOut',
        invalidReason: product.stockStatus === 'soldOut' ? '商品已售罄' : ''
      })
    },
    removeInvalidItems() {
      this.items = this.items.filter((item) => item.valid)
    }
  }
})
