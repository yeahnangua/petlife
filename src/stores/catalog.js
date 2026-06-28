import { defineStore } from 'pinia'
import {
  getCategories,
  getProductDetail,
  getProducts,
  getServiceDetail,
  getServices,
  getStoreSlots,
  getStores
} from '@/api/public'
import {
  adaptCategory,
  adaptProduct,
  adaptProductDetail,
  adaptService,
  adaptServiceDetail,
  adaptStore,
  adaptStoreSlot
} from '@/adapters/catalog'

function createPagination(overrides = {}) {
  return {
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
    ...overrides
  }
}

function createProductFilters(overrides = {}) {
  return {
    petType: 'cat',
    categoryId: '',
    keyword: '',
    page: 1,
    pageSize: 6,
    ...overrides
  }
}

function createServiceFilters(overrides = {}) {
  return {
    petType: 'cat',
    category: '',
    page: 1,
    pageSize: 20,
    ...overrides
  }
}

function createLoadingState() {
  return {
    home: false,
    products: false,
    visualSearch: false,
    productDetail: false,
    services: false,
    serviceDetail: false,
    slots: false
  }
}

function createErrorState() {
  return {
    home: '',
    products: '',
    visualSearch: '',
    productDetail: '',
    services: '',
    serviceDetail: '',
    slots: ''
  }
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : '请求失败，请稍后重试'
}

function addDays(baseDate, days) {
  const nextDate = new Date(baseDate)
  nextDate.setDate(baseDate.getDate() + days)
  return nextDate
}

function formatWeekday(date) {
  return new Intl.DateTimeFormat('zh-CN', { weekday: 'short' }).format(date)
}

function formatMonthDay(date) {
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function formatDateValue(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function buildServiceDates(count = 7) {
  const today = new Date()

  return Array.from({ length: count }, (_, index) => {
    const date = addDays(today, index)

    return {
      date: formatDateValue(date),
      label: index === 0 ? '今天' : index === 1 ? '明天' : formatMonthDay(date),
      weekday: formatWeekday(date)
    }
  })
}

function paginateList(items, page, pageSize) {
  const normalizedPageSize = Number(pageSize) || 20
  const normalizedPage = Math.max(Number(page) || 1, 1)
  const total = items.length
  const totalPages = total === 0 ? 0 : Math.ceil(total / normalizedPageSize)
  const startIndex = (normalizedPage - 1) * normalizedPageSize

  return {
    list: items.slice(startIndex, startIndex + normalizedPageSize),
    pagination: createPagination({
      page: normalizedPage,
      pageSize: normalizedPageSize,
      total,
      totalPages
    })
  }
}

export const useCatalogStore = defineStore('catalog', {
  state: () => ({
    categories: [],
    homeProducts: [],
    homeServices: [],
    productList: [],
    visualSearchProducts: [],
    productPagination: createPagination({ pageSize: 6 }),
    productFilters: createProductFilters(),
    currentProduct: null,
    relatedProducts: [],
    serviceList: [],
    servicePagination: createPagination({ pageSize: 20 }),
    serviceFilters: createServiceFilters(),
    currentService: null,
    serviceStores: [],
    serviceDates: buildServiceDates(),
    serviceSlots: [],
    selectedStoreId: '',
    selectedSlotDate: '',
    loading: createLoadingState(),
    error: createErrorState()
  }),
  getters: {
    categoriesByPetType: (state) => (petType = 'cat') =>
      state.categories.filter((item) => item.petType === petType || item.petType === 'all'),
    serviceHasBookableSlot: (state) => state.serviceSlots.some((slot) => slot.available)
  },
  actions: {
    resolveCategoryId(value, petType = 'cat') {
      if (!value) {
        return ''
      }

      const matchedCategory = this.categories.find((item) => {
        if (item.id === value) {
          return true
        }

        return item.slug === value && (item.petType === petType || item.petType === 'all')
      })

      return matchedCategory?.id ?? ''
    },

    async ensureCategories() {
      if (this.categories.length > 0) {
        return this.categories
      }

      const data = await getCategories()
      this.categories = (data.list || []).map(adaptCategory)
      return this.categories
    },

    async fetchHomeData(petType = 'cat') {
      this.loading.home = true
      this.error.home = ''

      try {
        const [categoryData, productData, serviceData] = await Promise.all([
          getCategories(),
          getProducts({ petType, page: 1, pageSize: 8 }),
          getServices({ petType, page: 1, pageSize: 4 })
        ])

        this.categories = (categoryData.list || []).map(adaptCategory)
        this.homeProducts = (productData.list || []).map(adaptProduct)
        this.homeServices = (serviceData.list || []).map(adaptService)
      } catch (error) {
        this.error.home = getErrorMessage(error)
        this.homeProducts = []
        this.homeServices = []
      } finally {
        this.loading.home = false
      }
    },

    async fetchProductList(filters = {}) {
      this.loading.products = true
      this.error.products = ''

      const nextFilters = createProductFilters({
        ...this.productFilters,
        ...filters
      })

      try {
        await this.ensureCategories()

        const data = await getProducts(nextFilters)
        this.productFilters = nextFilters
        this.productList = (data.list || []).map(adaptProduct)
        this.productPagination = createPagination(data.pagination || { pageSize: nextFilters.pageSize })
      } catch (error) {
        this.error.products = getErrorMessage(error)
        this.productList = []
        this.productPagination = createPagination({ pageSize: nextFilters.pageSize })
      } finally {
        this.loading.products = false
      }
    },

    async fetchVisualSearchProducts({ force = false } = {}) {
      if (this.visualSearchProducts.length > 0 && !force) {
        return this.visualSearchProducts
      }

      this.loading.visualSearch = true
      this.error.visualSearch = ''

      try {
        const data = await getProducts({ page: 1, pageSize: 100 })
        this.visualSearchProducts = (data.list || []).map(adaptProduct)
      } catch (error) {
        this.error.visualSearch = getErrorMessage(error)
        if (!this.visualSearchProducts.length) {
          this.visualSearchProducts = []
        }
      } finally {
        this.loading.visualSearch = false
      }

      return this.visualSearchProducts
    },

    async fetchProductDetail(id) {
      this.loading.productDetail = true
      this.error.productDetail = ''

      try {
        const detailData = await getProductDetail(id)
        const currentProduct = adaptProductDetail(detailData.item)
        const relatedPetType = currentProduct.petType === 'all' ? 'cat' : currentProduct.petType
        const relatedData = await getProducts({ petType: relatedPetType, page: 1, pageSize: 4 })

        this.currentProduct = currentProduct
        this.relatedProducts = (relatedData.list || [])
          .map(adaptProduct)
          .filter((item) => item.id !== id)
          .slice(0, 4)
      } catch (error) {
        this.error.productDetail = getErrorMessage(error)
        this.currentProduct = null
        this.relatedProducts = []
      } finally {
        this.loading.productDetail = false
      }
    },

    async fetchServiceList(filters = {}) {
      this.loading.services = true
      this.error.services = ''

      const nextFilters = createServiceFilters({
        ...this.serviceFilters,
        ...filters
      })

      try {
        const data = await getServices({
          petType: nextFilters.petType,
          page: 1,
          pageSize: 50
        })
        const allServices = (data.list || []).map(adaptService)
        const filteredServices = nextFilters.category
          ? allServices.filter((item) => item.category === nextFilters.category)
          : allServices
        const pagedResult = paginateList(filteredServices, nextFilters.page, nextFilters.pageSize)

        this.serviceFilters = nextFilters
        this.serviceList = pagedResult.list
        this.servicePagination = pagedResult.pagination
      } catch (error) {
        this.error.services = getErrorMessage(error)
        this.serviceList = []
        this.servicePagination = createPagination({ pageSize: nextFilters.pageSize })
      } finally {
        this.loading.services = false
      }
    },

    async fetchServiceDetail(id) {
      this.loading.serviceDetail = true
      this.error.serviceDetail = ''
      this.error.slots = ''

      try {
        const [serviceData, storesData] = await Promise.all([
          getServiceDetail(id),
          getStores()
        ])

        const currentService = adaptServiceDetail(serviceData.item)
        const serviceStores = (storesData.list || [])
          .map(adaptStore)
          .filter((item) => item.status === 'active' || !item.status)
        const serviceDates = buildServiceDates()
        const selectedStoreId = serviceStores[0]?.id ?? ''
        const selectedSlotDate = serviceDates[0]?.date ?? ''

        this.currentService = {
          ...currentService,
          storeOptions: serviceStores,
          timeSlots: []
        }
        this.serviceStores = serviceStores
        this.serviceDates = serviceDates
        this.selectedStoreId = selectedStoreId
        this.selectedSlotDate = selectedSlotDate
        this.serviceSlots = []

        if (selectedStoreId && selectedSlotDate) {
          await this.fetchServiceSlots({
            serviceId: id,
            storeId: selectedStoreId,
            date: selectedSlotDate
          })
        }
      } catch (error) {
        this.error.serviceDetail = getErrorMessage(error)
        this.currentService = null
        this.serviceStores = []
        this.serviceSlots = []
        this.selectedStoreId = ''
        this.selectedSlotDate = ''
      } finally {
        this.loading.serviceDetail = false
      }
    },

    async fetchServiceSlots({ serviceId, storeId, date } = {}) {
      const targetServiceId = serviceId || this.currentService?.id
      const targetStoreId = storeId || this.selectedStoreId
      const targetDate = date || this.selectedSlotDate

      if (!targetServiceId || !targetStoreId || !targetDate) {
        this.serviceSlots = []
        return []
      }

      this.loading.slots = true
      this.error.slots = ''

      try {
        const data = await getStoreSlots(targetStoreId, {
          date: targetDate,
          serviceId: targetServiceId
        })
        const slots = (data.list || []).map(adaptStoreSlot)

        this.selectedStoreId = targetStoreId
        this.selectedSlotDate = targetDate
        this.serviceSlots = slots

        if (this.currentService) {
          this.currentService = {
            ...this.currentService,
            storeOptions: this.serviceStores,
            timeSlots: slots
          }
        }

        return slots
      } catch (error) {
        this.error.slots = getErrorMessage(error)
        this.serviceSlots = []
        return []
      } finally {
        this.loading.slots = false
      }
    },

    async selectServiceStore(storeId) {
      return this.fetchServiceSlots({ storeId })
    },

    async selectServiceDate(date) {
      return this.fetchServiceSlots({ date })
    }
  }
})
