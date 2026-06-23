import { defineStore } from 'pinia'
import {
  createCategory,
  createProduct,
  createService,
  createStore,
  createTimeSlot,
  deleteCategory,
  deleteProduct,
  deleteService,
  deleteStore,
  deleteTimeSlot,
  listCategories,
  listProducts,
  listServices,
  listStores,
  listTimeSlots,
  updateCategory,
  updateProduct,
  updateService,
  updateStore,
  updateTimeSlot
} from '@/api/catalog'

function upsertById(list, item) {
  const index = list.findIndex((entry) => entry.id === item.id)

  if (index === -1) {
    return [item, ...list]
  }

  return list.map((entry) => (entry.id === item.id ? item : entry))
}

function removeById(list, id) {
  return list.filter((entry) => entry.id !== id)
}

export const useCatalogStore = defineStore('admin-catalog', {
  state: () => ({
    categories: [],
    products: [],
    services: [],
    stores: [],
    timeSlots: [],
    loading: {
      categories: false,
      products: false,
      services: false,
      stores: false,
      timeSlots: false
    },
    saving: {
      category: false,
      product: false,
      service: false,
      store: false,
      timeSlot: false
    },
    error: '',
    dialogs: {
      category: { open: false, item: null },
      product: { open: false, item: null },
      service: { open: false, item: null },
      store: { open: false, item: null },
      timeSlot: { open: false, item: null }
    }
  }),
  getters: {
    enabledCategories: (state) => state.categories.filter((item) => item.is_enabled)
  },
  actions: {
    openDialog(type, item = null) {
      this.dialogs[type] = {
        open: true,
        item
      }
    },
    closeDialog(type) {
      this.dialogs[type] = {
        open: false,
        item: null
      }
    },
    async fetchCategories() {
      this.loading.categories = true
      this.error = ''

      try {
        const data = await listCategories()
        this.categories = data.list || []
        return this.categories
      } catch (error) {
        this.error = error instanceof Error ? error.message : '分类加载失败'
        throw error
      } finally {
        this.loading.categories = false
      }
    },
    async saveCategory(payload, id = null) {
      this.saving.category = true
      this.error = ''

      try {
        const data = id ? await updateCategory(id, payload) : await createCategory(payload)
        this.categories = upsertById(this.categories, data.item)
        this.closeDialog('category')
        return data.item
      } catch (error) {
        this.error = error instanceof Error ? error.message : '分类保存失败'
        throw error
      } finally {
        this.saving.category = false
      }
    },
    async removeCategory(id) {
      this.saving.category = true
      this.error = ''

      try {
        const data = await deleteCategory(id)
        this.categories = removeById(this.categories, data.item.id)
        return data.item
      } catch (error) {
        this.error = error instanceof Error ? error.message : '分类删除失败'
        throw error
      } finally {
        this.saving.category = false
      }
    },
    async fetchProducts() {
      this.loading.products = true
      this.error = ''

      try {
        const data = await listProducts()
        this.products = data.list || []
        return this.products
      } catch (error) {
        this.error = error instanceof Error ? error.message : '商品加载失败'
        throw error
      } finally {
        this.loading.products = false
      }
    },
    async saveProduct(payload, id = null) {
      this.saving.product = true
      this.error = ''

      try {
        const data = id ? await updateProduct(id, payload) : await createProduct(payload)
        this.products = upsertById(this.products, data.item)
        this.closeDialog('product')
        return data.item
      } catch (error) {
        this.error = error instanceof Error ? error.message : '商品保存失败'
        throw error
      } finally {
        this.saving.product = false
      }
    },
    async removeProduct(id) {
      this.saving.product = true
      this.error = ''

      try {
        const data = await deleteProduct(id)
        this.products = data.item.status ? upsertById(this.products, data.item) : removeById(this.products, data.item.id)
        return data.item
      } catch (error) {
        this.error = error instanceof Error ? error.message : '商品删除失败'
        throw error
      } finally {
        this.saving.product = false
      }
    },
    async fetchServices() {
      this.loading.services = true
      this.error = ''

      try {
        const data = await listServices()
        this.services = data.list || []
        return this.services
      } catch (error) {
        this.error = error instanceof Error ? error.message : '服务加载失败'
        throw error
      } finally {
        this.loading.services = false
      }
    },
    async saveService(payload, id = null) {
      this.saving.service = true
      this.error = ''

      try {
        const data = id ? await updateService(id, payload) : await createService(payload)
        this.services = upsertById(this.services, data.item)
        this.closeDialog('service')
        return data.item
      } catch (error) {
        this.error = error instanceof Error ? error.message : '服务保存失败'
        throw error
      } finally {
        this.saving.service = false
      }
    },
    async removeService(id) {
      this.saving.service = true
      this.error = ''

      try {
        const data = await deleteService(id)
        this.services = data.item.status ? upsertById(this.services, data.item) : removeById(this.services, data.item.id)
        return data.item
      } catch (error) {
        this.error = error instanceof Error ? error.message : '服务删除失败'
        throw error
      } finally {
        this.saving.service = false
      }
    },
    async fetchStores() {
      this.loading.stores = true
      this.error = ''

      try {
        const data = await listStores()
        this.stores = data.list || []
        return this.stores
      } catch (error) {
        this.error = error instanceof Error ? error.message : '门店加载失败'
        throw error
      } finally {
        this.loading.stores = false
      }
    },
    async saveStore(payload, id = null) {
      this.saving.store = true
      this.error = ''

      try {
        const data = id ? await updateStore(id, payload) : await createStore(payload)
        this.stores = upsertById(this.stores, data.item)
        this.closeDialog('store')
        return data.item
      } catch (error) {
        this.error = error instanceof Error ? error.message : '门店保存失败'
        throw error
      } finally {
        this.saving.store = false
      }
    },
    async removeStore(id) {
      this.saving.store = true
      this.error = ''

      try {
        const data = await deleteStore(id)
        this.stores = data.item.status ? upsertById(this.stores, data.item) : removeById(this.stores, data.item.id)
        return data.item
      } catch (error) {
        this.error = error instanceof Error ? error.message : '门店删除失败'
        throw error
      } finally {
        this.saving.store = false
      }
    },
    async fetchTimeSlots() {
      this.loading.timeSlots = true
      this.error = ''

      try {
        const data = await listTimeSlots()
        this.timeSlots = data.list || []
        return this.timeSlots
      } catch (error) {
        this.error = error instanceof Error ? error.message : '时段加载失败'
        throw error
      } finally {
        this.loading.timeSlots = false
      }
    },
    async saveTimeSlot(payload, id = null) {
      this.saving.timeSlot = true
      this.error = ''

      try {
        const data = id ? await updateTimeSlot(id, payload) : await createTimeSlot(payload)
        this.timeSlots = upsertById(this.timeSlots, data.item)
        this.closeDialog('timeSlot')
        return data.item
      } catch (error) {
        this.error = error instanceof Error ? error.message : '时段保存失败'
        throw error
      } finally {
        this.saving.timeSlot = false
      }
    },
    async removeTimeSlot(id) {
      this.saving.timeSlot = true
      this.error = ''

      try {
        const data = await deleteTimeSlot(id)
        this.timeSlots = data.item.is_enabled !== undefined ? upsertById(this.timeSlots, data.item) : removeById(this.timeSlots, data.item.id)
        return data.item
      } catch (error) {
        this.error = error instanceof Error ? error.message : '时段删除失败'
        throw error
      } finally {
        this.saving.timeSlot = false
      }
    }
  }
})
