<script setup>
import { computed, onMounted, ref } from 'vue'
import StatusTag from '@/components/StatusTag.vue'
import { useOperationsStore } from '@/stores/operations'

const operationsStore = useOperationsStore()
const statusFilter = ref('')

const visibleBookings = computed(() => operationsStore.bookings)

async function loadBookings() {
  await operationsStore.fetchBookings(statusFilter.value)
}

async function selectBooking(id) {
  await operationsStore.fetchBookingDetail(id)
}

async function changeStatus(status) {
  if (!operationsStore.currentBooking?.id) {
    return
  }

  await operationsStore.changeBookingStatus(operationsStore.currentBooking.id, status)
}

onMounted(() => {
  loadBookings()
})
</script>

<template>
  <section class="operations-page">
    <div class="operations-page__toolbar">
      <div>
        <p class="operations-page__meta">预约管理</p>
        <h2>到店服务状态</h2>
      </div>
      <div class="operations-page__filters">
        <select v-model="statusFilter" @change="loadBookings">
          <option value="">全部状态</option>
          <option value="pendingService">pendingService</option>
          <option value="completed">completed</option>
          <option value="cancelled">cancelled</option>
        </select>
        <button type="button" class="button-primary" @click="loadBookings">刷新</button>
      </div>
    </div>
    <p v-if="operationsStore.error" class="operations-page__error">{{ operationsStore.error }}</p>
    <div class="operations-page__layout">
      <aside class="operations-panel">
        <header class="operations-panel__head">预约列表</header>
        <div v-if="operationsStore.loading.bookings" class="operations-panel__state">正在加载预约...</div>
        <button
          v-for="item in visibleBookings"
          :key="item.id"
          type="button"
          class="operations-list-item"
          :class="{ 'is-active': operationsStore.currentBooking?.id === item.id }"
          @click="selectBooking(item.id)"
        >
          <div>
            <strong>{{ item.booking_no }}</strong>
            <p>{{ item.pet_name_snapshot }} · {{ item.scheduled_at }}</p>
          </div>
          <StatusTag :status="item.status" :label="item.status_label" />
        </button>
      </aside>

      <article class="operations-panel operations-panel--detail">
        <header class="operations-panel__head">预约详情</header>
        <div v-if="operationsStore.loading.bookingDetail" class="operations-panel__state">正在加载详情...</div>
        <template v-else-if="operationsStore.currentBooking">
          <div class="operations-detail__header">
            <div>
              <h3>{{ operationsStore.currentBooking.booking_no }}</h3>
              <p>{{ operationsStore.currentBooking.created_at }}</p>
            </div>
            <StatusTag
              :status="operationsStore.currentBooking.status"
              :label="operationsStore.currentBooking.status_label"
            />
          </div>
          <div class="operations-detail__grid">
            <div>
              <span>宠物</span>
              <strong>{{ operationsStore.currentBooking.pet_name_snapshot }}</strong>
            </div>
            <div>
              <span>服务</span>
              <strong>{{ operationsStore.currentBooking.service_title_snapshot }}</strong>
            </div>
            <div>
              <span>门店</span>
              <strong>{{ operationsStore.currentBooking.store_name_snapshot }}</strong>
            </div>
            <div>
              <span>时段</span>
              <strong>{{ operationsStore.currentBooking.scheduled_at }}</strong>
            </div>
            <div>
              <span>联系电话</span>
              <strong>{{ operationsStore.currentBooking.contact_phone }}</strong>
            </div>
            <div>
              <span>价格</span>
              <strong>¥{{ operationsStore.currentBooking.service_price_snapshot }}</strong>
            </div>
            <div class="operations-detail__full">
              <span>备注</span>
              <strong>{{ operationsStore.currentBooking.note || '无' }}</strong>
            </div>
          </div>
          <div v-if="operationsStore.currentBooking.status === 'pendingService'" class="operations-detail__actions">
            <button type="button" class="button-secondary" :disabled="operationsStore.submitting" @click="changeStatus('cancelled')">
              取消预约
            </button>
            <button type="button" class="button-primary" :disabled="operationsStore.submitting" @click="changeStatus('completed')">
              标记完成
            </button>
          </div>
        </template>
        <div v-else class="operations-panel__state">选择一条预约查看详情。</div>
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
.operations-list-item {
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
  padding: 14px;
  border: 0;
  border-radius: 16px;
  background: #fffdfa;
  text-align: left;
}

.operations-list-item.is-active {
  outline: 1px solid #866549;
}

.operations-list-item p {
  color: #6d5e4e;
}

.operations-detail__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.operations-detail__grid span {
  color: #866549;
}

.operations-detail__full {
  grid-column: 1 / -1;
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
