<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EmptyState from '@/components/EmptyState.vue'
import ProductCard from '@/components/ProductCard.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import { primaryCategories } from '@/content/catalog'
import { useCatalogStore } from '@/stores/catalog'

const route = useRoute()
const router = useRouter()
const catalogStore = useCatalogStore()

const activePrimary = ref(route.query.pet || 'cat')
const activeSecondary = ref('')
const chipScroller = ref(null)
const isDraggingChips = ref(false)
const chipDragStartX = ref(0)
const chipDragStartScrollLeft = ref(0)
const draggedChips = ref(false)
const chipPointerId = ref(null)
const hasCapturedChipPointer = ref(false)

watch(
  () => route.query.pet,
  (value) => {
    activePrimary.value = value || 'cat'
  }
)

const secondaryOptions = computed(() => catalogStore.categoriesByPetType(activePrimary.value))
const isInitialProductLoad = computed(() => catalogStore.loading.products && catalogStore.productList.length === 0)
const isRefreshingProducts = computed(() => catalogStore.loading.products && catalogStore.productList.length > 0)

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

watch(activeSecondary, () => {
  nextTick(() => {
    const activeChip = chipScroller.value?.querySelector('.category__chip--active')
    activeChip?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  })
})

function startChipDrag(event) {
  if (!chipScroller.value) {
    return
  }

  isDraggingChips.value = true
  draggedChips.value = false
  hasCapturedChipPointer.value = false
  chipPointerId.value = event.pointerId
  chipDragStartX.value = event.clientX
  chipDragStartScrollLeft.value = chipScroller.value.scrollLeft
}

function dragChips(event) {
  if (!isDraggingChips.value || !chipScroller.value) {
    return
  }

  const distance = event.clientX - chipDragStartX.value
  if (Math.abs(distance) > 6) {
    if (!hasCapturedChipPointer.value) {
      try {
        chipScroller.value.setPointerCapture?.(event.pointerId)
        hasCapturedChipPointer.value = true
      } catch {
        hasCapturedChipPointer.value = false
      }
    }
    draggedChips.value = true
  }

  chipScroller.value.scrollLeft = chipDragStartScrollLeft.value - distance
}

function endChipDrag() {
  if (!isDraggingChips.value) {
    return
  }

  if (
    chipPointerId.value !== null &&
    hasCapturedChipPointer.value &&
    chipScroller.value?.hasPointerCapture?.(chipPointerId.value)
  ) {
    chipScroller.value?.releasePointerCapture?.(chipPointerId.value)
  }

  isDraggingChips.value = false
  chipPointerId.value = null
  hasCapturedChipPointer.value = false
  window.setTimeout(() => {
    draggedChips.value = false
  }, 0)
}

function blockClickAfterDrag(event) {
  if (!draggedChips.value) {
    return
  }

  event.preventDefault()
  event.stopPropagation()
  draggedChips.value = false
}

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
  <div class="category">
    <header class="category__head page-pad">
      <p class="category__eyebrow">CATALOG</p>
      <h1 class="category__title font-display">分类选购</h1>
    </header>

    <div class="category__layout page-pad">
      <aside class="category__rail">
        <button
          v-for="item in primaryCategories"
          :key="item.id"
          type="button"
          class="category__primary"
          :class="{ 'category__primary--active': activePrimary === item.id }"
          @click="setPrimary(item.id)"
        >
          <span class="category__primary-emoji">{{ item.emoji }}</span>
          <span>{{ item.label }}</span>
        </button>
      </aside>

      <section class="category__content">
        <div
          ref="chipScroller"
          class="category__chips hide-scroll"
          :class="{ 'category__chips--dragging': isDraggingChips }"
          role="group"
          aria-label="商品二级分类"
          data-draggable-scroll="true"
          @pointerdown="startChipDrag"
          @pointermove="dragChips"
          @pointerup="endChipDrag"
          @pointercancel="endChipDrag"
          @pointerleave="endChipDrag"
          @click.capture="blockClickAfterDrag"
        >
          <button
            v-for="item in secondaryOptions"
            :key="item.id"
            type="button"
            class="category__chip"
            :class="{ 'category__chip--active': activeSecondary === item.id }"
            @click="setSecondary(item.id)"
          >
            {{ item.label || item.name }}
          </button>
        </div>

        <div v-if="isInitialProductLoad" class="category__grid">
          <SkeletonBlock variant="card" />
          <SkeletonBlock variant="card" />
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
          icon="box"
          title="这个分类还没有商品"
          description="换个分类看看，或者稍后再来。"
          action-label="查看全部"
          @action="router.push('/products')"
        />
        <div
          v-else
          class="category__results"
          :class="{ 'category__results--refreshing': isRefreshingProducts }"
        >
          <div v-if="isRefreshingProducts" class="category__refreshing" role="status" aria-live="polite">
            正在更新
          </div>
          <div class="category__grid">
            <ProductCard
              v-for="product in catalogStore.productList"
              :key="product.id"
              :product="product"
            />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.category {
  padding-bottom: var(--space-6);
}

.category__head {
  padding-top: calc(var(--safe-top) + var(--space-5));
  padding-bottom: var(--space-4);
}

.category__eyebrow {
  color: var(--color-primary);
  font-size: var(--text-2xs);
  font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-wider);
}

.category__title {
  margin-top: 2px;
  font-size: var(--text-3xl);
  font-weight: var(--weight-semibold);
}

.category__layout {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: var(--space-4);
  align-items: start;
}

.category__rail {
  position: sticky;
  top: var(--space-4);
  display: grid;
  gap: var(--space-2);
  padding: var(--space-2);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-xs);
}

.category__primary {
  display: grid;
  justify-items: center;
  gap: 4px;
  padding: var(--space-3) 0;
  border-radius: var(--radius-md);
  color: var(--color-text-soft);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  transition: background-color var(--dur-base) var(--ease-out), color var(--dur-base) var(--ease-out), transform var(--dur-fast) var(--ease-spring);
}

.category__primary:active {
  transform: scale(0.94);
}

.category__primary--active {
  background: var(--color-primary-deep);
  color: var(--color-text-invert);
  box-shadow: var(--shadow-brand);
}

.category__primary-emoji {
  font-size: var(--text-lg);
}

.category__content {
  display: grid;
  gap: var(--space-3);
  min-width: 0;
}

.category__chips {
  display: flex;
  gap: var(--space-2);
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-behavior: smooth;
  scroll-padding-inline: var(--space-3);
  touch-action: pan-y;
  cursor: grab;
  mask-image: linear-gradient(90deg, transparent 0, #000 10px, #000 calc(100% - 22px), transparent 100%);
  padding-bottom: 2px;
  user-select: none;
  -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 10px, #000 calc(100% - 22px), transparent 100%);
  -webkit-overflow-scrolling: touch;
}

.category__chips--dragging {
  cursor: grabbing;
  scroll-behavior: auto;
}

.category__chip {
  flex-shrink: 0;
  min-height: 32px;
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  color: var(--color-text-soft);
  font-size: var(--text-sm);
  transition: all var(--dur-base) var(--ease-out);
}

.category__chip--active {
  border-color: var(--color-primary-soft);
  background: var(--color-primary-tint);
  color: var(--color-primary-deep);
  font-weight: var(--weight-semibold);
}

.category__results {
  position: relative;
  display: grid;
  gap: var(--space-2);
}

.category__refreshing {
  justify-self: start;
  padding: 3px 9px;
  border-radius: var(--radius-full);
  background: var(--color-primary-tint);
  color: var(--color-primary-deep);
  font-size: var(--text-2xs);
  font-weight: var(--weight-semibold);
}

.category__results--refreshing .category__grid {
  opacity: 0.72;
  transition: opacity var(--dur-base) var(--ease-out);
}

.category__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-2);
}
</style>
