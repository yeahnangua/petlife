<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import OrderCard from '@/components/OrderCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import { useAccountStore } from '@/stores/account'

const route = useRoute()
const router = useRouter()
const accountStore = useAccountStore()

const kindTabs = [
  { id: 'product', label: '商品订单' },
  { id: 'service', label: '服务预约' }
]

const productStatusTabs = [
  { id: 'all', label: '全部' },
  { id: 'pendingShipment', label: '待发货' },
  { id: 'completed', label: '已完成' },
  { id: 'cancelled', label: '已取消' }
]

const serviceStatusTabs = [
  { id: 'all', label: '全部' },
  { id: 'pendingService', label: '待服务' },
  { id: 'completed', label: '已完成' },
  { id: 'cancelled', label: '已取消' }
]

onMounted(() => {
  accountStore.fetchOrdersAndBookings()
})

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

  router.replace({ path: '/orders', query: mergedQuery })
}

const activeKind = computed({
  get: () => route.query.kind || 'product',
  set: (value) => replaceQuery({ kind: value, status: '' })
})

const activeStatus = computed({
  get: () => route.query.status || 'all',
  set: (value) => replaceQuery({ status: value === 'all' ? '' : value })
})

const currentStatusTabs = computed(() =>
  activeKind.value === 'service' ? serviceStatusTabs : productStatusTabs
)

const visibleOrders = computed(() => {
  const source = activeKind.value === 'service'
    ? accountStore.serviceBookings
    : accountStore.productOrders

  if (activeStatus.value === 'all') {
    return source
  }

  return source.filter((order) => order.status === activeStatus.value)
})
</script>

<template>
  <div class="orders page-pad">
    <header class="orders__head">
      <p class="orders__eyebrow">ORDERS</p>
      <h1 class="orders__title font-display">我的订单</h1>
    </header>

    <!-- 类型切换 -->
    <section class="orders__kind">
      <button
        v-for="tab in kindTabs"
        :key="tab.id"
        type="button"
        class="orders__tab orders__kind-tab"
        :class="{ 'is-active': activeKind === tab.id }"
        @click="activeKind = tab.id"
      >
        {{ tab.label }}
      </button>
    </section>

    <!-- 状态筛选 -->
    <section class="orders__status hide-scroll">
      <button
        v-for="tab in currentStatusTabs"
        :key="tab.id"
        type="button"
        class="orders__tab orders__status-tab"
        :class="{ 'is-active': activeStatus === tab.id }"
        @click="activeStatus = tab.id"
      >
        {{ tab.label }}
      </button>
    </section>

    <div v-if="accountStore.loading" class="orders__stack">
      <SkeletonBlock variant="card" />
      <SkeletonBlock variant="card" />
    </div>

    <section v-else-if="visibleOrders.length" class="orders__stack">
      <OrderCard v-for="order in visibleOrders" :key="order.id" :order="order" />
    </section>
    <EmptyState
      v-else
      icon="order"
      :title="accountStore.error ? '订单记录加载失败' : '这个状态下还没有订单'"
      :description="accountStore.error || '可以先从首页或者服务页逛一逛，再回来查看。'"
      action-label="回首页"
      @action="router.push('/')"
    />
  </div>
</template>

<style scoped>
.orders {
  display: grid;
  gap: var(--space-4);
  padding-bottom: var(--space-6);
  align-content: start;
}

.orders__head {
  padding-top: calc(var(--safe-top) + var(--space-5));
}

.orders__eyebrow {
  color: var(--color-primary);
  font-size: var(--text-2xs);
  font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-wider);
}

.orders__title {
  margin-top: 2px;
  font-size: var(--text-3xl);
  font-weight: var(--weight-semibold);
}

.orders__kind {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  padding: 4px;
  border-radius: var(--radius-full);
  background: var(--color-surface-warm);
}

.orders__kind-tab {
  min-height: 38px;
  border-radius: var(--radius-full);
  color: var(--color-text-mute);
  font-size: var(--text-md);
  font-weight: var(--weight-medium);
  transition: all var(--dur-base) var(--ease-out);
}

.orders__kind-tab.is-active {
  background: var(--color-primary-deep);
  color: var(--color-text-invert);
  font-weight: var(--weight-semibold);
  box-shadow: var(--shadow-sm);
}

.orders__status {
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
  padding-bottom: 2px;
}

.orders__status-tab {
  flex-shrink: 0;
  min-height: 32px;
  padding: 0 var(--space-4);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  color: var(--color-text-soft);
  font-size: var(--text-sm);
  transition: all var(--dur-base) var(--ease-out);
}

.orders__status-tab.is-active {
  border-color: var(--color-primary-soft);
  background: var(--color-primary-tint);
  color: var(--color-primary-deep);
  font-weight: var(--weight-semibold);
}

.orders__stack {
  display: grid;
  gap: var(--space-3);
}
</style>
