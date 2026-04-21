<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EmptyState from '@/components/EmptyState.vue'
import ProductCard from '@/components/ProductCard.vue'
import { primaryCategories } from '@/content/catalog'
import { useCatalogStore } from '@/stores/catalog'

const route = useRoute()
const router = useRouter()
const catalogStore = useCatalogStore()

const activePrimary = ref(route.query.pet || 'cat')
const activeSecondary = ref('')

watch(
  () => route.query.pet,
  (value) => {
    activePrimary.value = value || 'cat'
  }
)

const secondaryOptions = computed(() => catalogStore.categoriesByPetType(activePrimary.value))

watch(
  [secondaryOptions, () => route.query.category],
  ([options, routeCategory]) => {
    const resolvedCategoryId = catalogStore.resolveCategoryId(routeCategory, activePrimary.value)

    if (resolvedCategoryId && options.find((item) => item.id === resolvedCategoryId)) {
      activeSecondary.value = resolvedCategoryId
      return
    }

    if (!options.find((item) => item.id === activeSecondary.value)) {
      activeSecondary.value = options[0]?.id ?? ''
    }
  },
  { immediate: true }
)

watch(
  [activePrimary, activeSecondary],
  ([petType, categoryId]) => {
    catalogStore.fetchProductList({
      petType,
      categoryId,
      page: 1,
      pageSize: 20
    })
  },
  { immediate: true }
)

function setPrimary(id) {
  activePrimary.value = id
  router.replace({ path: '/category', query: { pet: id } })
}

function setSecondary(id) {
  activeSecondary.value = id
  router.replace({ path: '/category', query: { pet: activePrimary.value, category: id } })
}
</script>

<template>
  <div class="category page-pad">
    <div class="category__layout">
      <aside class="category__sidebar surface-card">
        <button
          v-for="item in primaryCategories"
          :key="item.id"
          type="button"
          class="category__primary"
          :class="{ 'is-active': activePrimary === item.id }"
          @click="setPrimary(item.id)"
        >
          <span>{{ item.emoji }}</span>
          <span>{{ item.label }}</span>
        </button>
      </aside>

      <section class="category__content page-stack">
        <div class="surface-card category__chip-card">
          <button
            v-for="item in secondaryOptions"
            :key="item.id"
            type="button"
            class="category__chip"
            :class="{ 'is-active': activeSecondary === item.id }"
            @click="setSecondary(item.id)"
          >
            {{ item.label || item.name }}
          </button>
        </div>

        <div v-if="catalogStore.loading.products" class="surface-card category__state">
          正在加载分类商品...
        </div>
        <EmptyState
          v-else-if="catalogStore.error.products"
          title="分类加载失败"
          :description="catalogStore.error.products"
          action-label="重试"
          @action="catalogStore.fetchProductList({ petType: activePrimary, categoryId: activeSecondary, page: 1, pageSize: 20 })"
        />
        <EmptyState
          v-else-if="!catalogStore.productList.length"
          title="这个分类下还没有商品"
          description="换个分类看看，或者稍后再来。"
          action-label="查看全部"
          @action="router.push('/products')"
        />
        <div v-else class="category__grid">
          <ProductCard
            v-for="product in catalogStore.productList"
            :key="product.id"
            :product="product"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.category {
  padding-bottom: var(--space-6);
}

.category__layout {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: var(--space-4);
}

.category__sidebar {
  display: grid;
  gap: var(--space-2);
  align-content: start;
  padding: var(--space-3);
}

.category__primary {
  display: grid;
  justify-items: center;
  gap: 6px;
  padding: var(--space-3) 0;
  border-radius: var(--radius-lg);
  color: var(--color-text-soft);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
}

.category__primary.is-active {
  background: var(--color-primary-deep);
  color: var(--color-text-invert);
}

.category__content {
  min-width: 0;
}

.category__chip-card {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding: var(--space-3);
}

.category__chip {
  min-height: 32px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-full);
  background: var(--color-surface-soft);
  color: var(--color-text-soft);
  font-size: var(--text-sm);
}

.category__chip.is-active {
  background: var(--color-primary-tint);
  color: var(--color-primary-deep);
  font-weight: var(--weight-semibold);
}

.category__grid {
  display: grid;
  gap: var(--space-3);
}

.category__state {
  padding: var(--space-5);
  color: var(--color-text-soft);
  text-align: center;
}
</style>
