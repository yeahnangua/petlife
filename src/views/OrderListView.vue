<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import OrderCard from '@/components/OrderCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import { allOrders, orderStatusTabs } from '@/mocks'

const route = useRoute()
const router = useRouter()

const activeStatus = computed({
  get: () => route.query.status || 'all',
  set: (value) => router.replace({ path: '/orders', query: value === 'all' ? {} : { status: value } })
})

const successBanner = computed(() => {
  if (route.query.created === 'product') {
    return '订单已提交，支付链路在作品集版中以结果态展示，当前已进入待支付列表。'
  }
  if (route.query.created === 'service') {
    return '预约已创建，当前已进入待服务列表，你可以继续调整宠物档案或查看会员权益。'
  }
  return ''
})

const visibleOrders = computed(() => {
  if (activeStatus.value === 'all') return allOrders
  return allOrders.filter((order) => order.status === activeStatus.value)
})
</script>

<template>
  <div class="orders page-pad page-stack">
    <section v-if="successBanner" class="orders__banner surface-card">
      {{ successBanner }}
    </section>

    <section class="orders__tabs surface-card hide-scroll">
      <button
        v-for="tab in orderStatusTabs"
        :key="tab.id"
        type="button"
        class="orders__tab"
        :class="{ 'is-active': activeStatus === tab.id }"
        @click="activeStatus = tab.id"
      >
        {{ tab.label }}
      </button>
    </section>

    <template v-if="visibleOrders.length">
      <OrderCard
        v-for="order in visibleOrders"
        :key="order.id"
        :order="order"
      />
    </template>
    <EmptyState
      v-else
      icon="order"
      title="这个状态下还没有订单"
      description="可以先从首页或者服务页逛一逛，再回来查看。"
      action-label="回首页"
      @action="router.push('/')"
    />
  </div>
</template>

<style scoped>
.orders {
  padding-bottom: var(--space-6);
}

.orders__banner {
  padding: var(--space-4);
  color: var(--color-primary-deep);
  background: linear-gradient(135deg, rgba(220, 230, 221, 0.92), rgba(255, 255, 255, 0.82));
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
</style>
