<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProductCard from '@/components/ProductCard.vue'
import PetChipSwitch from '@/components/PetChipSwitch.vue'
import { products, quickEntries } from '@/mocks'
import { getProductsByCategory } from '@/lib/catalog'

const route = useRoute()
const router = useRouter()

const activePet = computed({
  get: () => route.query.pet || 'cat',
  set: (value) => router.replace({ path: '/products', query: { ...route.query, pet: value } })
})

const activeCategory = computed({
  get: () => route.query.category || '',
  set: (value) => router.replace({ path: '/products', query: { ...route.query, category: value } })
})

const filterChips = computed(() =>
  quickEntries.filter((item) => ['food', 'snack', 'toy', 'clean'].includes(item.id))
)

const filteredProducts = computed(() =>
  getProductsByCategory(products, activePet.value, activeCategory.value)
)
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
        :class="{ 'is-active': !activeCategory }"
        @click="activeCategory = ''"
      >
        全部
      </button>
      <button
        v-for="chip in filterChips"
        :key="chip.id"
        type="button"
        class="product-list__filter"
        :class="{ 'is-active': activeCategory === chip.id }"
        @click="activeCategory = chip.id"
      >
        {{ chip.label }}
      </button>
    </section>

    <div class="product-list__grid">
      <ProductCard
        v-for="product in filteredProducts"
        :key="product.id"
        :product="product"
      />
    </div>
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
</style>
