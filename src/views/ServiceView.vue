<script setup>
import { computed, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EmptyState from '@/components/EmptyState.vue'
import ServiceCard from '@/components/ServiceCard.vue'
import ChipSwitch from '@/components/ChipSwitch.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import IconSvg from '@/components/IconSvg.vue'
import { useDragScroll } from '@/composables/useDragScroll'
import { serviceCategories } from '@/content/catalog'
import { useCatalogStore } from '@/stores/catalog'
import { useProfileStore } from '@/stores/profile'

const route = useRoute()
const router = useRouter()
const catalogStore = useCatalogStore()
const profileStore = useProfileStore()

const petOptions = [
  { value: 'cat', label: '猫咪' },
  { value: 'dog', label: '狗狗' }
]

const guarantees = [
  { icon: 'shield', label: '门店专业认证' },
  { icon: 'leaf', label: '温和低应激' },
  { icon: 'heart', label: '全程可陪同' }
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

  router.replace({ path: '/service', query: mergedQuery })
}

const activePet = computed({
  get: () => route.query.pet || profileStore.activePetType,
  set: (value) => {
    profileStore.setPetType(value)
    replaceQuery({ pet: value, page: '' })
  }
})

const activeCategory = computed({
  get: () => route.query.category || '',
  set: (value) => replaceQuery({ category: value, page: '' })
})

const currentPage = computed(() => Number(route.query.page || 1))
const isInitialServiceLoad = computed(() => catalogStore.loading.services && catalogStore.serviceList.length === 0)
const {
  scroller: categoryScroller,
  isDragging: isDraggingCategories,
  startDrag: startCategoryDrag,
  drag: dragCategories,
  endDrag: endCategoryDrag,
  blockClickAfterDrag: blockCategoryClickAfterDrag
} = useDragScroll()

watch(
  [activePet, activeCategory, currentPage],
  ([petType, category, page]) => {
    catalogStore.fetchServiceList({
      petType,
      category,
      page,
      pageSize: 20
    })
  },
  { immediate: true }
)

watch(activeCategory, () => {
  nextTick(() => {
    const activeButton = categoryScroller.value?.querySelector('.service__category--active')
    activeButton?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  })
})

function goToPage(page) {
  replaceQuery({ page })
}
</script>

<template>
  <div class="service">
    <!-- 头部 -->
    <header class="service__head page-pad">
      <div class="service__head-row">
        <div>
          <p class="service__eyebrow">SERVICES</p>
          <h1 class="service__title font-display">门店服务<br />线上轻松预约</h1>
        </div>
        <ChipSwitch v-model="activePet" :options="petOptions" />
      </div>
      <div class="service__guarantee">
        <span v-for="item in guarantees" :key="item.label" class="service__guarantee-item">
          <IconSvg :name="item.icon" :size="14" :stroke="1.9" />
          {{ item.label }}
        </span>
      </div>
    </header>

    <div class="service__body page-pad">
      <!-- 分类 -->
      <section
        ref="categoryScroller"
        class="service__categories hide-scroll"
        :class="{ 'service__categories--dragging': isDraggingCategories }"
        role="group"
        aria-label="服务分类"
        data-draggable-scroll="true"
        @pointerdown="startCategoryDrag"
        @pointermove="dragCategories"
        @pointerup="endCategoryDrag"
        @pointercancel="endCategoryDrag"
        @pointerleave="endCategoryDrag"
        @click.capture="blockCategoryClickAfterDrag"
      >
        <button
          type="button"
          class="service__category"
          :class="{ 'service__category--active': !activeCategory }"
          @click="activeCategory = ''"
        >
          <IconSvg name="service" :size="16" :stroke="1.8" />
          全部
        </button>
        <button
          v-for="item in serviceCategories"
          :key="item.id"
          type="button"
          class="service__category"
          :class="{ 'service__category--active': activeCategory === item.id }"
          @click="activeCategory = item.id"
        >
          <IconSvg :name="item.icon" :size="16" :stroke="1.8" />
          {{ item.label }}
        </button>
      </section>

      <!-- 列表 -->
      <div v-if="isInitialServiceLoad" class="service__list">
        <SkeletonBlock variant="card" />
        <SkeletonBlock variant="card" />
      </div>
      <EmptyState
        v-else-if="catalogStore.error.services"
        icon="service"
        title="服务目录加载失败"
        :description="catalogStore.error.services"
        action-label="重试"
        @action="catalogStore.fetchServiceList({ petType: activePet, category: activeCategory, page: currentPage, pageSize: 20 })"
      />
      <EmptyState
        v-else-if="!catalogStore.serviceList.length"
        icon="service"
        title="这个筛选下还没有服务"
        description="切换宠物类型或服务分类试试看。"
        action-label="查看全部"
        @action="activeCategory = ''"
      />
      <section v-else class="service__list">
        <ServiceCard
          v-for="serviceItem in catalogStore.serviceList"
          :key="serviceItem.id"
          :service="serviceItem"
        />
      </section>

      <!-- 分页 -->
      <nav v-if="catalogStore.servicePagination.totalPages > 1" class="service__pager" aria-label="分页">
        <button
          type="button"
          class="service__pager-btn"
          :disabled="catalogStore.servicePagination.page <= 1"
          aria-label="上一页"
          @click="goToPage(catalogStore.servicePagination.page - 1)"
        >
          <IconSvg name="back" :size="16" :stroke="2.2" />
        </button>
        <span class="service__pager-info">
          <strong class="font-display">{{ catalogStore.servicePagination.page }}</strong>
          / {{ catalogStore.servicePagination.totalPages }}
        </span>
        <button
          type="button"
          class="service__pager-btn"
          :disabled="catalogStore.servicePagination.page >= catalogStore.servicePagination.totalPages"
          aria-label="下一页"
          @click="goToPage(catalogStore.servicePagination.page + 1)"
        >
          <IconSvg name="arrow-right" :size="16" :stroke="2.2" />
        </button>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.service {
  padding-bottom: var(--space-6);
}

.service__head {
  display: grid;
  gap: var(--space-4);
  padding-top: calc(var(--safe-top) + var(--space-5));
  padding-bottom: var(--space-5);
  background: linear-gradient(180deg, var(--color-primary-tint), transparent);
}

.service__head-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}

.service__eyebrow {
  color: var(--color-primary);
  font-size: var(--text-2xs);
  font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-wider);
}

.service__title {
  margin-top: 2px;
  font-size: var(--text-3xl);
  font-weight: var(--weight-semibold);
  line-height: 1.2;
}

.service__guarantee {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
}

.service__guarantee-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--color-primary-deep);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
}

.service__body {
  display: grid;
  gap: var(--space-4);
}

.service__categories {
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

.service__categories--dragging {
  cursor: grabbing;
  scroll-behavior: auto;
}

.service__category {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 38px;
  padding: 0 var(--space-4);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  color: var(--color-text-soft);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  transition: all var(--dur-base) var(--ease-out);
}

.service__category--active {
  border-color: var(--color-primary-deep);
  background: var(--color-primary-deep);
  color: var(--color-text-invert);
}

.service__list {
  display: grid;
  gap: var(--space-3);
}

.service__pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-5);
  padding: var(--space-2) 0;
}

.service__pager-btn {
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

.service__pager-btn:active {
  transform: scale(0.9);
}

.service__pager-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  transform: none;
}

.service__pager-info {
  color: var(--color-text-mute);
  font-size: var(--text-sm);
}

.service__pager-info strong {
  color: var(--color-text);
  font-size: var(--text-lg);
}
</style>
