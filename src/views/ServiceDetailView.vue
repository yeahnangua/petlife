<script setup>
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EmptyState from '@/components/EmptyState.vue'
import { formatCurrency } from '@/lib/pricing'
import { useBookingStore } from '@/stores/booking'
import { useCatalogStore } from '@/stores/catalog'

const route = useRoute()
const router = useRouter()
const bookingStore = useBookingStore()
const catalogStore = useCatalogStore()

const service = computed(() => catalogStore.currentService)
const storeOptions = computed(() => catalogStore.serviceStores)
const dateOptions = computed(() => catalogStore.serviceDates)
const timeSlots = computed(() => catalogStore.serviceSlots)
const selectedStore = computed(() =>
  storeOptions.value.find((item) => item.id === catalogStore.selectedStoreId) ?? null
)
const canBook = computed(() => Boolean(service.value && storeOptions.value.length && catalogStore.serviceHasBookableSlot))

watch(
  () => route.params.id,
  (id) => {
    if (id) {
      catalogStore.fetchServiceDetail(id)
    }
  },
  { immediate: true }
)

function bookService() {
  if (!service.value) return
  bookingStore.prepareFromService({
    ...service.value,
    storeOptions: storeOptions.value,
    timeSlots: timeSlots.value
  })
  router.push('/booking/confirm')
}
</script>

<template>
  <div v-if="catalogStore.loading.serviceDetail" class="page-pad">
    <div class="surface-card service-detail__state">正在加载服务详情...</div>
  </div>

  <div v-else-if="service" class="service-detail page-stack">
    <section
      class="service-detail__hero"
      :style="{
        background: `linear-gradient(135deg, ${service.gradient?.[0] || '#DCE6DD'}, ${service.gradient?.[1] || '#F5EFE7'})`
      }"
    >
      <img :src="service.cover" :alt="service.title" />
    </section>

    <div class="page-pad page-stack">
      <section class="surface-card service-detail__summary">
        <span class="pill">{{ service.tagline }}</span>
        <h2>{{ service.title }}</h2>
        <div class="service-detail__price-row">
          <strong>{{ formatCurrency(service.memberPrice ?? service.price) }}</strong>
          <span>{{ service.duration }} 分钟</span>
          <span>评分 {{ service.rating }}</span>
        </div>
        <p class="service-detail__intro">适用：{{ service.suitable.join('、') }}</p>
      </section>

      <section class="surface-card service-detail__panel">
        <div class="section-heading">
          <h2 class="section-heading__title">服务包含</h2>
        </div>
        <ul class="service-detail__list">
          <li v-for="item in service.includes" :key="item">{{ item }}</li>
        </ul>
      </section>

      <section class="surface-card service-detail__panel">
        <div class="section-heading">
          <h2 class="section-heading__title">预约门店</h2>
        </div>
        <button
          v-for="store in storeOptions"
          :key="store.id"
          type="button"
          class="service-detail__store"
          :class="{ 'is-active': catalogStore.selectedStoreId === store.id }"
          @click="catalogStore.selectServiceStore(store.id)"
        >
          <div>
            <strong>{{ store.name }}</strong>
            <p>{{ store.address }}</p>
          </div>
          <span>{{ store.businessHours || '可预约' }}</span>
        </button>
      </section>

      <section class="surface-card service-detail__panel">
        <div class="section-heading">
          <h2 class="section-heading__title">预约日期</h2>
        </div>
        <div class="service-detail__slots">
          <button
            v-for="date in dateOptions"
            :key="date.date"
            type="button"
            class="service-detail__slot"
            :class="{ 'is-active': catalogStore.selectedSlotDate === date.date }"
            @click="catalogStore.selectServiceDate(date.date)"
          >
            {{ date.label }} · {{ date.weekday }}
          </button>
        </div>
      </section>

      <section class="surface-card service-detail__panel">
        <div class="section-heading">
          <h2 class="section-heading__title">可选时间段</h2>
          <span class="section-heading__meta">{{ selectedStore?.name || '请选择门店' }}</span>
        </div>
        <div v-if="catalogStore.loading.slots" class="service-detail__slot-state">
          正在查询实时余量...
        </div>
        <div v-else-if="catalogStore.error.slots" class="service-detail__slot-state">
          {{ catalogStore.error.slots }}
        </div>
        <div v-else class="service-detail__slots">
          <span
            v-for="slot in timeSlots"
            :key="slot.id"
            class="service-detail__slot"
            :class="{ 'is-disabled': !slot.available }"
          >
            {{ slot.label }}<small v-if="slot.available">余 {{ slot.remaining }}</small>
          </span>
        </div>
      </section>

      <section class="surface-card service-detail__panel">
        <div class="section-heading">
          <h2 class="section-heading__title">注意事项</h2>
        </div>
        <ul class="service-detail__list">
          <li v-for="tip in service.tips" :key="tip">{{ tip }}</li>
        </ul>
      </section>
    </div>

    <div class="service-detail__action-bar">
      <div class="service-detail__action-copy">
        <span>会员价</span>
        <strong>{{ formatCurrency(service.memberPrice ?? service.price) }}</strong>
      </div>
      <button type="button" class="button-primary" :disabled="!canBook" @click="bookService">
        立即预约
      </button>
    </div>
  </div>

  <div v-else class="page-pad">
    <EmptyState
      icon="service"
      title="这个服务暂时不可用"
      :description="catalogStore.error.serviceDetail || '先回服务页看看其他可预约项目。'"
      action-label="返回服务页"
      @action="router.push('/service')"
    />
  </div>
</template>

<style scoped>
.service-detail {
  padding-bottom: calc(var(--shell-bottom-offset) + var(--action-bar-height) + var(--space-8));
}

.service-detail__hero {
  aspect-ratio: 1.05;
}

.service-detail__hero img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.service-detail__summary,
.service-detail__panel {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-5);
}

.service-detail__summary h2 {
  font-size: var(--text-2xl);
}

.service-detail__price-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}

.service-detail__price-row strong {
  color: var(--color-coral);
  font-size: var(--text-3xl);
}

.service-detail__price-row span,
.service-detail__intro,
.service-detail__store p {
  color: var(--color-text-soft);
}

.service-detail__list {
  display: grid;
  gap: 8px;
}

.service-detail__list li::before {
  content: '·';
  margin-right: 8px;
}

.service-detail__store {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  background: var(--color-surface-soft);
}

.service-detail__store.is-active,
.service-detail__slot.is-active {
  outline: 1px solid var(--color-primary);
  background: var(--color-primary-tint);
}

.service-detail__store strong {
  display: block;
  margin-bottom: 6px;
}

.service-detail__store span {
  color: var(--color-primary-deep);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
}

.service-detail__slots {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.service-detail__slot {
  min-height: 36px;
  padding: 0 var(--space-4);
  border-radius: var(--radius-full);
  background: var(--color-primary-tint);
  color: var(--color-primary-deep);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.service-detail__slot.is-disabled {
  background: var(--color-bg-deep);
  color: var(--color-text-tint);
}

.service-detail__slot small {
  font-size: var(--text-xs);
}

.service-detail__slot-state,
.service-detail__state {
  color: var(--color-text-soft);
  text-align: center;
}

.service-detail__state {
  padding: var(--space-5);
}

.service-detail__action-bar {
  position: fixed;
  right: max(var(--space-4), calc((100vw - var(--mobile-max)) / 2 + var(--space-4)));
  bottom: calc(var(--shell-bottom-offset) + var(--space-4));
  left: max(var(--space-4), calc((100vw - var(--mobile-max)) / 2 + var(--space-4)));
  z-index: var(--z-sticky);
  display: grid;
  grid-template-columns: minmax(0, 1fr) 1.1fr;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: calc(var(--radius-xl) + 2px);
  background: rgba(250, 245, 236, 0.94);
  box-shadow: var(--shadow-float);
  backdrop-filter: blur(22px);
}

.service-detail__action-copy {
  display: grid;
  align-content: center;
}

.service-detail__action-copy span {
  color: var(--color-text-mute);
  font-size: var(--text-sm);
}

.service-detail__action-copy strong {
  color: var(--color-coral);
  font-size: var(--text-2xl);
}
</style>
