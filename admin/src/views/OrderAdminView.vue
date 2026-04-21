<script setup>
import { computed, onMounted, ref } from 'vue'
import StatusTag from '@/components/StatusTag.vue'
import { useOperationsStore } from '@/stores/operations'

const operationsStore = useOperationsStore()
const statusFilter = ref('')

const visibleOrders = computed(() => operationsStore.orders)

async function loadOrders() {
  await operationsStore.fetchOrders(statusFilter.value)
}

async function selectOrder(id) {
  await operationsStore.fetchOrderDetail(id)
}

async function changeStatus(status) {
  if (!operationsStore.currentOrder?.id) {
    return
  }

  await operationsStore.changeOrderStatus(operationsStore.currentOrder.id, status)
}

onMounted(() => {
  loadOrders()
})
</script>

<template>
  <section class="operations-page">
    <div class="operations-page__toolbar">
      <div>
        <p class="operations-page__meta">订单管理</p>
        <h2>发货与售后状态</h2>
      </div>
      <div class="operations-page__filters">
        <select v-model="statusFilter" @change="loadOrders">
          <option value="">全部状态</option>
          <option value="pendingShipment">pendingShipment</option>
          <option value="completed">completed</option>
          <option value="cancelled">cancelled</option>
        </select>
        <button type="button" class="button-primary" @click="loadOrders">刷新</button>
      </div>
    </div>
    <p v-if="operationsStore.error" class="operations-page__error">{{ operationsStore.error }}</p>
    <div class="operations-page__layout">
      <aside class="operations-panel">
        <header class="operations-panel__head">订单列表</header>
        <div v-if="operationsStore.loading.orders" class="operations-panel__state">正在加载订单...</div>
        <button
          v-for="item in visibleOrders"
          :key="item.id"
          type="button"
          class="operations-list-item"
          :class="{ 'is-active': operationsStore.currentOrder?.id === item.id }"
          @click="selectOrder(item.id)"
        >
          <div>
            <strong>{{ item.order_no }}</strong>
            <p>{{ item.receiver_name_snapshot }} · {{ item.item_count }} 件</p>
          </div>
          <StatusTag :status="item.status" :label="item.status_label" />
        </button>
      </aside>

      <article class="operations-panel operations-panel--detail">
        <header class="operations-panel__head">订单详情</header>
        <div v-if="operationsStore.loading.orderDetail" class="operations-panel__state">正在加载详情...</div>
        <template v-else-if="operationsStore.currentOrder">
          <div class="operations-detail__header">
            <div>
              <h3>{{ operationsStore.currentOrder.order_no }}</h3>
              <p>{{ operationsStore.currentOrder.created_at }}</p>
            </div>
            <StatusTag
              :status="operationsStore.currentOrder.status"
              :label="operationsStore.currentOrder.status_label"
            />
          </div>
          <div class="operations-detail__grid">
            <div>
              <span>收货人</span>
              <strong>{{ operationsStore.currentOrder.receiver_name_snapshot }}</strong>
            </div>
            <div>
              <span>联系电话</span>
              <strong>{{ operationsStore.currentOrder.receiver_phone_snapshot }}</strong>
            </div>
            <div class="operations-detail__full">
              <span>收货地址</span>
              <strong>
                {{ operationsStore.currentOrder.receiver_region_snapshot }}
                {{ operationsStore.currentOrder.receiver_address_snapshot }}
              </strong>
            </div>
            <div>
              <span>总金额</span>
              <strong>¥{{ operationsStore.currentOrder.total_amount }}</strong>
            </div>
            <div class="operations-detail__full">
              <span>备注</span>
              <strong>{{ operationsStore.currentOrder.remark || '无' }}</strong>
            </div>
          </div>
          <div class="operations-detail__items">
            <h4>商品明细</h4>
            <article v-for="item in operationsStore.currentOrder.items" :key="item.id" class="operations-detail__item">
              <div>
                <strong>{{ item.product_title_snapshot }}</strong>
                <p>{{ item.spec_label_snapshot }} · x{{ item.quantity }}</p>
              </div>
              <span>¥{{ item.amount }}</span>
            </article>
          </div>
          <div v-if="operationsStore.currentOrder.status === 'pendingShipment'" class="operations-detail__actions">
            <button type="button" class="button-secondary" :disabled="operationsStore.submitting" @click="changeStatus('cancelled')">
              取消订单
            </button>
            <button type="button" class="button-primary" :disabled="operationsStore.submitting" @click="changeStatus('completed')">
              标记完成
            </button>
          </div>
        </template>
        <div v-else class="operations-panel__state">选择一条订单查看详情。</div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.operations-page {
  display: grid;
  gap: 20px;
}

.operations-page__toolbar,
.operations-page__filters,
.operations-detail__header,
.operations-detail__actions,
.operations-detail__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.operations-page__meta {
  color: #866549;
}

.operations-page__filters select {
  min-height: 40px;
  padding: 0 12px;
  border: 1px solid #d8cbbd;
  border-radius: 999px;
}

.operations-page__error,
.operations-panel__state {
  padding: 16px;
  border-radius: 16px;
  background: #f6efe6;
}

.operations-page__error {
  color: #b15b38;
}

.operations-page__layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 20px;
}

.operations-panel {
  display: grid;
  gap: 12px;
  align-content: start;
  padding: 20px;
  border-radius: 24px;
  background: #fff7ef;
}

.operations-panel__head {
  font-weight: 600;
}

.operations-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
  border: 0;
  border-radius: 16px;
  background: #fffdfa;
  text-align: left;
}

.operations-list-item.is-active {
  outline: 1px solid #866549;
}

.operations-list-item p,
.operations-detail__item p {
  color: #6d5e4e;
}

.operations-detail__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.operations-detail__grid span,
.operations-detail__items h4 {
  color: #866549;
}

.operations-detail__full {
  grid-column: 1 / -1;
}

.operations-detail__items {
  display: grid;
  gap: 12px;
}

.operations-detail__item {
  padding: 14px;
  border-radius: 16px;
  background: #fffdfa;
}

.button-primary,
.button-secondary {
  min-height: 40px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
}

.button-primary {
  background: #29211b;
  color: #fff;
}

.button-secondary {
  background: #eadfd1;
}

@media (max-width: 900px) {
  .operations-page__layout {
    grid-template-columns: 1fr;
  }

  .operations-detail__grid {
    grid-template-columns: 1fr;
  }
}
</style>
