<script setup>
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EmptyState from '@/components/EmptyState.vue'
import ServiceCard from '@/components/ServiceCard.vue'
import PetChipSwitch from '@/components/PetChipSwitch.vue'
import IconSvg from '@/components/IconSvg.vue'
import { serviceCategories } from '@/mocks'
import { useCatalogStore } from '@/stores/catalog'
import { useProfileStore } from '@/stores/profile'

const route = useRoute()
const router = useRouter()
const catalogStore = useCatalogStore()
const profileStore = useProfileStore()

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

function goToPage(page) {
  replaceQuery({ page })
}
</script>

<template>
  <div class="service page-pad page-stack">
    <section class="service__hero surface-card">
      <div>
        <p class="section-heading__meta">门店服务</p>
        <h2 class="section-heading__title">洗护、美容、护理和寄养都可以线上预约</h2>
        <p class="service__hero-copy">
          服务不混入购物车，直接预约到时间、门店和宠物档案，更贴近真实业务链路。
        </p>
      </div>
      <PetChipSwitch v-model="activePet" />
    </section>

    <section class="surface-card service__categories">
      <button
        type="button"
        class="service__category"
        :class="{ 'is-active': !activeCategory }"
        @click="activeCategory = ''"
      >
        <IconSvg name="service" :size="18" />
        全部
      </button>
      <button
        v-for="item in serviceCategories"
        :key="item.id"
        type="button"
        class="service__category"
        :class="{ 'is-active': activeCategory === item.id }"
        @click="activeCategory = item.id"
      >
        <IconSvg :name="item.icon" :size="18" />
        {{ item.label }}
      </button>
    </section>

    <div v-if="catalogStore.loading.services" class="surface-card service__state">
      正在加载服务目录...
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
    <section v-else class="page-stack">
      <ServiceCard
        v-for="serviceItem in catalogStore.serviceList"
        :key="serviceItem.id"
        :service="serviceItem"
      />
    </section>

    <section
      v-if="catalogStore.servicePagination.totalPages > 1"
      class="surface-card service__pagination"
    >
      <button
        type="button"
        class="button-secondary"
        :disabled="catalogStore.servicePagination.page <= 1"
        @click="goToPage(catalogStore.servicePagination.page - 1)"
      >
        上一页
      </button>
      <span>
        第 {{ catalogStore.servicePagination.page }} / {{ catalogStore.servicePagination.totalPages }} 页
      </span>
      <button
        type="button"
        class="button-secondary"
        :disabled="catalogStore.servicePagination.page >= catalogStore.servicePagination.totalPages"
        @click="goToPage(catalogStore.servicePagination.page + 1)"
      >
        下一页
      </button>
    </section>
  </div>
</template>

<style scoped>
.service {
  padding-bottom: var(--space-6);
}

.service__hero {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-5);
  background:
    radial-gradient(circle at top right, rgba(106, 133, 114, 0.18), transparent 32%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.82), rgba(242, 234, 219, 0.86));
}

.service__hero-copy {
  color: var(--color-text-soft);
}

.service__categories {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding: var(--space-3);
}

.service__category {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-full);
  background: var(--color-surface-soft);
  color: var(--color-text-soft);
  font-size: var(--text-sm);
}

.service__category.is-active {
  background: var(--color-primary-deep);
  color: var(--color-text-invert);
}

.service__state,
.service__pagination {
  padding: var(--space-4);
}

.service__state {
  color: var(--color-text-soft);
  text-align: center;
}

.service__pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}
</style>
