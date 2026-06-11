<script setup>
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EmptyState from '@/components/EmptyState.vue'
import ProductCard from '@/components/ProductCard.vue'
import ChipSwitch from '@/components/ChipSwitch.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import IconSvg from '@/components/IconSvg.vue'
import { useCatalogStore } from '@/stores/catalog'

const route = useRoute()
const router = useRouter()
const catalogStore = useCatalogStore()

const petOptions = [
  { value: 'cat', label: '猫咪' },
  { value: 'dog', label: '狗狗' }
]

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
  <div class="plist page-pad">
    <section class="plist__head">
      <div>
        <p class="plist__eyebrow">精选目录</p>
        <h2 class="plist__title font-display">挑点好物</h2>
      </div>
      <ChipSwitch v-model="activePet" :options="petOptions" />
    </section>

    <section class="plist__filters hide-scroll">
      <button
        type="button"
        class="plist__filter"
        :class="{ 'plist__filter--active': !activeCategoryId }"
        @click="setCategory('')"
      >
        全部
      </button>
      <button
        v-for="chip in filterChips"
        :key="chip.id"
        type="button"
        class="plist__filter"
        :class="{ 'plist__filter--active': activeCategoryId === chip.id }"
        @click="setCategory(chip.id)"
      >
        {{ chip.label || chip.name }}
      </button>
    </section>

    <div v-if="catalogStore.loading.products" class="plist__grid">
      <SkeletonBlock variant="card" />
      <SkeletonBlock variant="card" />
      <SkeletonBlock variant="card" />
      <SkeletonBlock variant="card" />
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
      icon="box"
      title="暂时没有符合筛选的商品"
      description="换个分类或者宠物类型试试看。"
      action-label="清空筛选"
      @action="setCategory('')"
    />
    <div v-else class="plist__grid">
      <ProductCard
        v-for="product in catalogStore.productList"
        :key="product.id"
        :product="product"
      />
    </div>

    <nav
      v-if="catalogStore.productPagination.totalPages > 1"
      class="plist__pager"
      aria-label="分页"
    >
      <button
        type="button"
        class="plist__pager-btn"
        :disabled="catalogStore.productPagination.page <= 1"
        aria-label="上一页"
        @click="goToPage(catalogStore.productPagination.page - 1)"
      >
        <IconSvg name="back" :size="16" :stroke="2.2" />
      </button>
      <span class="plist__pager-info">
        <strong class="font-display">{{ catalogStore.productPagination.page }}</strong>
        / {{ catalogStore.productPagination.totalPages }}
      </span>
      <button
        type="button"
        class="plist__pager-btn"
        :disabled="catalogStore.productPagination.page >= catalogStore.productPagination.totalPages"
        aria-label="下一页"
        @click="goToPage(catalogStore.productPagination.page + 1)"
      >
        <IconSvg name="arrow-right" :size="16" :stroke="2.2" />
      </button>
    </nav>
  </div>
</template>

<style scoped>
.plist {
  display: grid;
  gap: var(--space-4);
  padding-top: var(--space-2);
  padding-bottom: var(--space-6);
}

.plist__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-3);
}

.plist__eyebrow {
  color: var(--color-primary);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-wider);
}

.plist__title {
  margin-top: 2px;
  font-size: var(--text-2xl);
  font-weight: var(--weight-semibold);
}

.plist__filters {
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
  padding-bottom: 2px;
}

.plist__filter {
  flex-shrink: 0;
  min-height: 34px;
  padding: 0 var(--space-4);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  color: var(--color-text-soft);
  font-size: var(--text-sm);
  transition: all var(--dur-base) var(--ease-out);
}

.plist__filter--active {
  border-color: var(--color-primary-deep);
  background: var(--color-primary-deep);
  color: var(--color-text-invert);
  font-weight: var(--weight-semibold);
}

.plist__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.plist__pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-5);
  padding: var(--space-2) 0;
}

.plist__pager-btn {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-xs);
  transition: transform var(--dur-fast) var(--ease-spring), opacity var(--dur-base) var(--ease-out);
}

.plist__pager-btn:active {
  transform: scale(0.9);
}

.plist__pager-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  transform: none;
}

.plist__pager-info {
  color: var(--color-text-mute);
  font-size: var(--text-sm);
}

.plist__pager-info strong {
  color: var(--color-text);
  font-size: var(--text-lg);
}
</style>
