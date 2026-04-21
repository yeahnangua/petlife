<script setup>
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EmptyState from '@/components/EmptyState.vue'
import ProductCard from '@/components/ProductCard.vue'
import PetChipSwitch from '@/components/PetChipSwitch.vue'
import { useCatalogStore } from '@/stores/catalog'

const route = useRoute()
const router = useRouter()
const catalogStore = useCatalogStore()

function replaceQuery(nextQuery) {
  const mergedQuery = {
    ...route.query,
    ...nextQuery
  }

  Object.keys(mergedQuery).forEach((key) => {
    if (mergedQuery[key] === '' || mergedQuery[key] === undefined || mergedQuery[key] === null) {
      delete mergedQuery[key]
    }
  })

  router.replace({ path: '/products', query: mergedQuery })
}

const activePet = computed({
  get: () => route.query.pet || 'cat',
  set: (value) => replaceQuery({ pet: value, page: '' })
})

const activeCategory = computed(() => route.query.category || '')
const currentPage = computed(() => Number(route.query.page || 1))
const activeCategoryId = computed(() => catalogStore.resolveCategoryId(activeCategory.value, activePet.value))

const filterChips = computed(() => catalogStore.categoriesByPetType(activePet.value))

watch(
  [activePet, activeCategoryId, currentPage],
  ([petType, categoryId, page]) => {
    catalogStore.fetchProductList({
      petType,
      categoryId,
      page,
      pageSize: 6
    })
  },
  { immediate: true }
)

function setCategory(value) {
  replaceQuery({ category: value, page: '' })
}

function goToPage(page) {
  replaceQuery({ page })
}
</script>

<template>
  <div class="product-list page-pad page-stack">
    <section class="surface-card product-list__hero">
      <div>
        <p class="section-heading__meta">精选目录</p>
        <h2 class="section-heading__title">按宠物与品类挑选商品</h2>
      </div>
      <PetChipSwitch v-model="activePet" />
    </section>

    <section class="surface-card product-list__filters">
      <button
        type="button"
        class="product-list__filter"
        :class="{ 'is-active': !activeCategoryId }"
        @click="setCategory('')"
      >
        全部
      </button>
      <button
        v-for="chip in filterChips"
        :key="chip.id"
        type="button"
        class="product-list__filter"
        :class="{ 'is-active': activeCategoryId === chip.id }"
        @click="setCategory(chip.id)"
      >
        {{ chip.label || chip.name }}
      </button>
    </section>

    <div v-if="catalogStore.loading.products" class="surface-card product-list__state">
      正在加载商品列表...
    </div>
    <EmptyState
      v-else-if="catalogStore.error.products"
      title="商品列表加载失败"
      :description="catalogStore.error.products"
      action-label="重试"
      @action="catalogStore.fetchProductList({ petType: activePet, categoryId: activeCategoryId, page: currentPage, pageSize: 6 })"
    />
    <EmptyState
      v-else-if="!catalogStore.productList.length"
      title="暂时没有符合筛选的商品"
      description="换个分类或者宠物类型试试看。"
      action-label="清空筛选"
      @action="setCategory('')"
    />
    <div v-else class="product-list__grid">
      <ProductCard
        v-for="product in catalogStore.productList"
        :key="product.id"
        :product="product"
      />
    </div>

    <section
      v-if="catalogStore.productPagination.totalPages > 1"
      class="surface-card product-list__pagination"
    >
      <button
        type="button"
        class="button-secondary"
        :disabled="catalogStore.productPagination.page <= 1"
        @click="goToPage(catalogStore.productPagination.page - 1)"
      >
        上一页
      </button>
      <span>
        第 {{ catalogStore.productPagination.page }} / {{ catalogStore.productPagination.totalPages }} 页
      </span>
      <button
        type="button"
        class="button-secondary"
        :disabled="catalogStore.productPagination.page >= catalogStore.productPagination.totalPages"
        @click="goToPage(catalogStore.productPagination.page + 1)"
      >
        下一页
      </button>
    </section>
  </div>
</template>

<style scoped>
.product-list {
  padding-bottom: var(--space-6);
}

.product-list__hero,
.product-list__filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4);
}

.product-list__filters {
  flex-wrap: wrap;
  justify-content: flex-start;
}

.product-list__filter {
  min-height: 34px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-full);
  background: var(--color-surface-soft);
  color: var(--color-text-soft);
  font-size: var(--text-sm);
}

.product-list__filter.is-active {
  background: var(--color-primary-deep);
  color: var(--color-text-invert);
}

.product-list__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.product-list__state,
.product-list__pagination {
  padding: var(--space-4);
}

.product-list__state {
  color: var(--color-text-soft);
  text-align: center;
}

.product-list__pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}
</style>
