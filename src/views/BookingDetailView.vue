<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import EmptyState from '@/components/EmptyState.vue'
import IconSvg from '@/components/IconSvg.vue'
import PriceText from '@/components/PriceText.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useBookingStore } from '@/stores/booking'

const route = useRoute()
const router = useRouter()
const bookingStore = useBookingStore()

const confirmOpen = ref(false)

onMounted(() => {
  bookingStore.fetchBookingDetail(route.params.id)
})

const booking = computed(() => bookingStore.currentBooking)
const bookingDetail = computed(() => bookingStore.currentBookingDetail)

async function cancelCurrentBooking() {
  confirmOpen.value = false
  await bookingStore.cancelBooking(route.params.id)
}
</script>

<template>
  <div class="bdetail page-pad">
    <div v-if="bookingStore.loading && !booking" class="bdetail__stack">
      <SkeletonBlock variant="card" />
      <SkeletonBlock variant="text" :lines="3" />
    </div>

    <template v-else-if="booking">
      <div class="bdetail__stack">
        <!-- 状态卡 -->
        <section class="bdetail__status">
          <div class="bdetail__status-row">
            <h2 class="bdetail__status-label font-display">{{ booking.statusLabel }}</h2>
            <StatusBadge :status="booking.status" :label="booking.statusLabel" />
          </div>
          <p class="bdetail__status-meta">创建时间 {{ booking.createdAt }}</p>
          <p class="bdetail__status-no">预约号 {{ booking.orderNo }}</p>
        </section>

        <!-- 服务信息 -->
        <section class="bdetail__card surface-card">
          <article class="bdetail__service">
            <img :src="booking.service.cover" :alt="booking.service.title" loading="lazy" />
            <div class="bdetail__service-info">
              <h3>{{ booking.service.title }}</h3>
              <p class="bdetail__service-pet">
                <IconSvg name="paw" :size="13" :stroke="2" />
                {{ booking.pet.name }}
              </p>
              <PriceText :value="booking.totalAmount" size="md" />
            </div>
          </article>
        </section>

        <!-- 到店信息 -->
        <section class="bdetail__card surface-card">
          <h3 class="bdetail__card-title">到店信息</h3>
          <div class="bdetail__rows">
            <p class="bdetail__row">
              <IconSvg name="location" :size="15" :stroke="1.8" />
              {{ booking.store }}
            </p>
            <p class="bdetail__row">
              <IconSvg name="calendar" :size="15" :stroke="1.8" />
              {{ booking.scheduledAt }}
            </p>
            <p v-if="bookingDetail?.contact_phone" class="bdetail__row">
              <IconSvg name="phone" :size="15" :stroke="1.8" />
              {{ bookingDetail.contact_phone }}
            </p>
            <p v-if="bookingDetail?.note" class="bdetail__row bdetail__row--note">
              <IconSvg name="chat" :size="15" :stroke="1.8" />
              {{ bookingDetail.note }}
            </p>
          </div>
        </section>

        <!-- 操作 -->
        <button
          v-if="booking.status === 'pendingService'"
          type="button"
          class="button-secondary bdetail__cancel"
          :disabled="bookingStore.submitting"
          @click="confirmOpen = true"
        >
          {{ bookingStore.submitting ? '处理中…' : '取消预约' }}
        </button>
      </div>

      <ConfirmDialog
        :open="confirmOpen"
        title="取消这次预约？"
        :desc="`${booking.service.title} · ${booking.scheduledAt}`"
        confirm-label="取消预约"
        danger
        @confirm="cancelCurrentBooking"
        @cancel="confirmOpen = false"
      />
    </template>

    <EmptyState
      v-else
      icon="calendar"
      title="预约详情加载失败"
      :description="bookingStore.error || '请稍后再试。'"
      action-label="返回订单页"
      @action="router.push('/orders')"
    />
  </div>
</template>

<style scoped>
.bdetail {
  padding-top: var(--space-2);
  padding-bottom: var(--space-6);
}

.bdetail__stack {
  display: grid;
  gap: var(--space-3);
}

.bdetail__status {
  display: grid;
  gap: 4px;
  padding: var(--space-5);
  border-radius: var(--radius-xl);
  background: linear-gradient(150deg, #41576B, #34465A);
  color: var(--color-text-invert);
  box-shadow: var(--shadow-md);
}

.bdetail__status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.bdetail__status-label {
  font-size: var(--text-2xl);
  font-weight: var(--weight-semibold);
}

.bdetail__status-meta {
  color: rgba(247, 244, 236, 0.66);
  font-size: var(--text-xs);
}

.bdetail__status-no {
  color: rgba(247, 244, 236, 0.5);
  font-size: var(--text-2xs);
  font-family: var(--font-mono);
}

.bdetail__card {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-5);
  border-radius: var(--radius-lg);
}

.bdetail__card-title {
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
}

.bdetail__service {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  gap: var(--space-4);
}

.bdetail__service img {
  width: 76px;
  height: 76px;
  border-radius: var(--radius-md);
  object-fit: cover;
  background: var(--color-surface-warm);
}

.bdetail__service-info {
  display: grid;
  align-content: center;
  gap: 4px;
}

.bdetail__service-info h3 {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
}

.bdetail__service-pet {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text-mute);
  font-size: var(--text-xs);
}

.bdetail__rows {
  display: grid;
  gap: var(--space-3);
}

.bdetail__row {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  color: var(--color-text-soft);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

.bdetail__row :deep(.icon-svg) {
  flex-shrink: 0;
  transform: translateY(2px);
  color: var(--color-sky);
}

.bdetail__row--note {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-surface-warm);
}

.bdetail__cancel {
  width: 100%;
}
</style>
