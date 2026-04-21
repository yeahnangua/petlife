<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProductCard from '@/components/ProductCard.vue'
import { primaryCategories, products, secondaryCategories } from '@/mocks'
import { getProductsByCategory } from '@/lib/catalog'

const route = useRoute()
const router = useRouter()

const activePrimary = ref(route.query.pet || 'cat')
const activeSecondary = ref('')

watch(
  () => route.query.pet,
  (value) => {
    activePrimary.value = value || 'cat'
  }
)

const secondaryOptions = computed(() => secondaryCategories[activePrimary.value] ?? [])

watch(
  secondaryOptions,
  (options) => {
    if (!options.find((item) => item.id === activeSecondary.value)) {
      activeSecondary.value = options[0]?.id ?? ''
    }
  },
  { immediate: true }
)

const normalizedCategory = computed(() => {
  const current = activeSecondary.value.split('-').pop()
  return current === 'home' || current === 'gift' ? '' : current
})

const filteredProducts = computed(() =>
  getProductsByCategory(products, activePrimary.value, normalizedCategory.value)
)

function setPrimary(id) {
  activePrimary.value = id
  router.replace({ path: '/category', query: { pet: id } })
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
            @click="activeSecondary = item.id"
          >
            {{ item.label }}
          </button>
        </div>

        <div class="category__grid">
          <ProductCard
            v-for="product in filteredProducts"
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
</style>
