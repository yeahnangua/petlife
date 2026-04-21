import { defineStore } from 'pinia'
import {
  addCartItem,
  clearInvalidCartItems,
  deleteCartItem,
  getCart,
  updateCartItem
} from '@/api/user'
import { adaptProduct } from '@/adapters/catalog'
import { getCartSummary } from '@/lib/pricing'

function adaptCartItem(item = {}) {
  return {
    id: item.id,
    productId: item.productId,
    specKey: item.specKey,
    specLabel: item.specLabel,
    quantity: item.quantity,
    selected: Boolean(item.selected),
    valid: Boolean(item.isValid),
    invalidReason: item.invalidReason || '',
    product: adaptProduct(item.product)
  }
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
    hydrated: false,
    loading: false,
    error: '',
    submitting: false
  }),
  getters: {
    summary: (state) => getCartSummary(state.items),
    selectedItems: (state) => state.items.filter((item) => item.valid && item.selected),
    invalidItems: (state) => state.items.filter((item) => !item.valid)
  },
  actions: {
    async fetchCart() {
      this.loading = true
      this.error = ''

      try {
        const data = await getCart()
        this.items = (data.list || []).map(adaptCartItem)
        this.hydrated = true
      } catch (error) {
        this.error = error instanceof Error ? error.message : '购物车加载失败'
      } finally {
        this.loading = false
      }
    },
    async toggleSelection(id) {
      const item = this.items.find((entry) => entry.id === id)

      if (!item?.valid) {
        return
      }

      if (!this.hydrated) {
        item.selected = !item.selected
        return
      }

      await this.updateItem(id, {
        quantity: item.quantity,
        selected: !item.selected
      })
    },
    async updateQuantity(id, delta) {
      const item = this.items.find((entry) => entry.id === id)

      if (!item?.valid || item.quantity + delta < 1) {
        return
      }

      if (!this.hydrated) {
        item.quantity += delta
        return
      }

      await this.updateItem(id, {
        quantity: item.quantity + delta,
        selected: item.selected
      })
    },
    async setQuantity(id, quantity) {
      const item = this.items.find((entry) => entry.id === id)

      if (!item?.valid || quantity < 1) {
        return
      }

      if (!this.hydrated) {
        item.quantity = quantity
        return
      }

      await this.updateItem(id, {
        quantity,
        selected: item.selected
      })
    },
    async addProduct(product, specLabel, quantity = 1, specKey = specLabel.replaceAll(' · ', '|')) {
      this.submitting = true
      this.error = ''

      try {
        await addCartItem({
          product_id: product.id,
          spec_key: specKey,
          spec_label: specLabel,
          quantity
        })
        await this.fetchCart()
      } catch (error) {
        this.error = error instanceof Error ? error.message : '加入购物车失败'
        throw error
      } finally {
        this.submitting = false
      }
    },
    async updateItem(id, payload) {
      if (!this.hydrated) {
        const item = this.items.find((entry) => entry.id === id)
        if (item) {
          item.quantity = payload.quantity ?? item.quantity
          item.selected = payload.selected ?? item.selected
        }
        return
      }

      this.submitting = true
      this.error = ''

      try {
        await updateCartItem(id, payload)
        await this.fetchCart()
      } catch (error) {
        this.error = error instanceof Error ? error.message : '更新购物车失败'
        throw error
      } finally {
        this.submitting = false
      }
    },
    async removeItem(id) {
      if (!this.hydrated) {
        this.items = this.items.filter((item) => item.id !== id)
        return
      }

      this.submitting = true
      this.error = ''

      try {
        await deleteCartItem(id)
        await this.fetchCart()
      } catch (error) {
        this.error = error instanceof Error ? error.message : '移除商品失败'
        throw error
      } finally {
        this.submitting = false
      }
    },
    async clearInvalidItems() {
      if (!this.hydrated) {
        this.items = this.items.filter((item) => item.valid)
        return
      }

      this.submitting = true
      this.error = ''

      try {
        await clearInvalidCartItems()
        await this.fetchCart()
      } catch (error) {
        this.error = error instanceof Error ? error.message : '清理失效商品失败'
        throw error
      } finally {
        this.submitting = false
      }
    }
  }
})
