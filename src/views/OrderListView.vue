<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import OrderCard from '@/components/OrderCard.vue'
import EmptyState from '@/components/EmptyState.vue'
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

const currentStatusTabs = computed(() => activeKind.value === 'service' ? serviceStatusTabs : productStatusTabs)

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
  <div class="orders page-pad page-stack">
    <section class="orders__tabs surface-card hide-scroll">
      <button
        v-for="tab in kindTabs"
        :key="tab.id"
        type="button"
        class="orders__tab"
        :class="{ 'is-active': activeKind === tab.id }"
        @click="activeKind = tab.id"
      >
        {{ tab.label }}
      </button>
    </section>

    <section class="orders__tabs surface-card hide-scroll">
      <button
        v-for="tab in currentStatusTabs"
        :key="tab.id"
        type="button"
        class="orders__tab"
        :class="{ 'is-active': activeStatus === tab.id }"
        @click="activeStatus = tab.id"
      >
        {{ tab.label }}
      </button>
    </section>

    <div v-if="accountStore.loading" class="surface-card orders__state">正在加载订单记录...</div>

    <template v-else-if="visibleOrders.length">
      <OrderCard
        v-for="order in visibleOrders"
        :key="order.id"
        :order="order"
      />
    </template>
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
  padding-bottom: var(--space-6);
}

.orders__tabs {
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
  padding: var(--space-3);
}

.orders__tab {
  min-height: 34px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-full);
  background: var(--color-surface-soft);
  color: var(--color-text-soft);
  font-size: var(--text-sm);
}

.orders__tab.is-active {
  background: var(--color-primary-deep);
  color: var(--color-text-invert);
}

.orders__state {
  padding: var(--space-5);
  color: var(--color-text-soft);
  text-align: center;
}
</style>
