<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EmptyState from '@/components/EmptyState.vue'
import { formatCurrency } from '@/lib/pricing'
import { useBookingStore } from '@/stores/booking'

const route = useRoute()
const router = useRouter()
const bookingStore = useBookingStore()

onMounted(() => {
  bookingStore.fetchBookingDetail(route.params.id)
})

const booking = computed(() => bookingStore.currentBooking)
const bookingDetail = computed(() => bookingStore.currentBookingDetail)

async function cancelCurrentBooking() {
  await bookingStore.cancelBooking(route.params.id)
}
</script>

<template>
  <div class="booking-detail page-pad page-stack">
    <div v-if="bookingStore.loading && !booking" class="surface-card booking-detail__state">
      正在加载预约详情...
    </div>

    <template v-else-if="booking">
      <section class="surface-card booking-detail__card">
        <div class="section-heading">
          <div>
            <p class="section-heading__meta">预约状态</p>
            <h2 class="section-heading__title">{{ booking.statusLabel }}</h2>
          </div>
          <span>{{ booking.createdAt }}</span>
        </div>
        <p>预约号：{{ booking.orderNo }}</p>
        <p>门店：{{ booking.store }}</p>
        <p>到店时间：{{ booking.scheduledAt }}</p>
      </section>

      <section class="surface-card booking-detail__card">
        <article class="booking-detail__service">
          <img :src="booking.service.cover" :alt="booking.service.title" />
          <div>
            <strong>{{ booking.service.title }}</strong>
            <p>{{ booking.pet.name }} · {{ formatCurrency(booking.totalAmount) }}</p>
          </div>
        </article>
        <p>联系电话：{{ bookingDetail?.contact_phone }}</p>
        <p v-if="bookingDetail?.note">备注：{{ bookingDetail.note }}</p>
      </section>

      <section v-if="booking.status === 'pendingService'" class="surface-card booking-detail__card">
        <button type="button" class="button-secondary" :disabled="bookingStore.submitting" @click="cancelCurrentBooking">
          {{ bookingStore.submitting ? '处理中...' : '取消预约' }}
        </button>
      </section>
    </template>

    <EmptyState
      v-else
      title="预约详情加载失败"
      :description="bookingStore.error || '请稍后再试。'"
      action-label="返回订单页"
      @action="router.push('/orders')"
    />
  </div>
</template>

<style scoped>
.booking-detail {
  padding-bottom: var(--space-6);
}

.booking-detail__card {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4);
}

.booking-detail__service {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: var(--space-3);
}

.booking-detail__service img {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-lg);
  object-fit: cover;
}

.booking-detail__card p,
.booking-detail__state {
  color: var(--color-text-soft);
}

.booking-detail__state {
  padding: var(--space-5);
  text-align: center;
}
</style>
