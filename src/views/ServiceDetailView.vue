<script setup>
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EmptyState from '@/components/EmptyState.vue'
import IconSvg from '@/components/IconSvg.vue'
import PriceText from '@/components/PriceText.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
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
const canBook = computed(() =>
  Boolean(service.value && storeOptions.value.length && catalogStore.serviceHasBookableSlot)
)
const bookLabel = computed(() => {
  if (canBook.value) return '立即预约'
  if (timeSlots.value.length && !catalogStore.serviceHasBookableSlot) return '该日时段已满'
  return '立即预约'
})

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
  bookingStore.prepareFromService(
    {
      ...service.value,
      storeOptions: storeOptions.value,
      timeSlots: timeSlots.value,
      dateOptions: dateOptions.value
    },
    {
      date: catalogStore.selectedSlotDate,
      storeId: catalogStore.selectedStoreId
    }
  )
  router.push('/booking/confirm')
}
</script>

<template>
  <div v-if="catalogStore.loading.serviceDetail" class="page-pad sdetail__loading">
    <SkeletonBlock variant="image" />
    <SkeletonBlock variant="text" :lines="3" />
  </div>

  <div v-else-if="service" class="sdetail">
    <!-- 主视觉 -->
    <section class="sdetail__hero">
      <img :src="service.cover" :alt="service.title" />
      <div class="sdetail__hero-scrim" />
    </section>

    <div class="sdetail__content page-pad">
      <!-- 摘要 -->
      <section class="sdetail__summary surface-card anim-fade-up">
        <span v-if="service.tagline" class="sdetail__tagline">{{ service.tagline }}</span>
        <h1 class="sdetail__title font-display">{{ service.title }}</h1>
        <div class="sdetail__meta">
          <span class="sdetail__meta-item">
            <IconSvg name="clock" :size="14" :stroke="2" />
            {{ service.duration }} 分钟
          </span>
          <i class="sdetail__meta-sep" />
          <span class="sdetail__meta-item sdetail__meta-item--amber">
            <IconSvg name="star" :size="14" :stroke="2" />
            {{ service.rating }} 分
          </span>
          <i v-if="service.reviewCount" class="sdetail__meta-sep" />
          <span v-if="service.reviewCount" class="sdetail__meta-item">{{ service.reviewCount }} 条评价</span>
        </div>
        <div class="sdetail__price-row">
          <PriceText :value="service.memberPrice ?? service.price" size="lg" :original="service.originalPrice" />
          <span class="sdetail__member-chip">会员价</span>
        </div>
        <p v-if="service.suitable.length" class="sdetail__suitable">
          <IconSvg name="paw" :size="14" :stroke="1.9" />
          适用：{{ service.suitable.join('、') }}
        </p>
      </section>

      <!-- 服务包含 -->
      <section v-if="service.includes.length" class="sdetail__panel surface-card anim-fade-up">
        <h2 class="sdetail__panel-title">服务包含</h2>
        <ul class="sdetail__includes">
          <li v-for="item in service.includes" :key="item">
            <span class="sdetail__check">
              <IconSvg name="check" :size="11" :stroke="3" />
            </span>
            {{ item }}
          </li>
        </ul>
      </section>

      <!-- 预约门店 -->
      <section class="sdetail__panel surface-card anim-fade-up">
        <h2 class="sdetail__panel-title">预约门店</h2>
        <button
          v-for="storeItem in storeOptions"
          :key="storeItem.id"
          type="button"
          class="sdetail__store"
          :class="{ 'sdetail__store--active': catalogStore.selectedStoreId === storeItem.id }"
          @click="catalogStore.selectServiceStore(storeItem.id)"
        >
          <span class="sdetail__store-radio" />
          <span class="sdetail__store-info">
            <strong>{{ storeItem.name }}</strong>
            <small>
              <IconSvg name="location" :size="11" :stroke="2" />
              {{ storeItem.address }}
            </small>
          </span>
          <span class="sdetail__store-hours">{{ storeItem.businessHours || '可预约' }}</span>
        </button>
      </section>

      <!-- 日期与时段 -->
      <section class="sdetail__panel surface-card anim-fade-up">
        <h2 class="sdetail__panel-title">预约日期</h2>
        <div class="sdetail__dates hide-scroll">
          <button
            v-for="date in dateOptions"
            :key="date.date"
            type="button"
            class="sdetail__date"
            :class="{ 'sdetail__date--active': catalogStore.selectedSlotDate === date.date }"
            @click="catalogStore.selectServiceDate(date.date)"
          >
            <span class="sdetail__date-label">{{ date.label }}</span>
            <span class="sdetail__date-week">{{ date.weekday }}</span>
          </button>
        </div>

        <div class="sdetail__slots-head">
          <h2 class="sdetail__panel-title">可选时段</h2>
          <span class="sdetail__slots-store">{{ selectedStore?.name || '请选择门店' }}</span>
        </div>
        <p v-if="catalogStore.loading.slots" class="sdetail__slot-state">正在查询实时余量…</p>
        <p v-else-if="catalogStore.error.slots" class="sdetail__slot-state">{{ catalogStore.error.slots }}</p>
        <div v-else class="sdetail__slots">
          <span
            v-for="slot in timeSlots"
            :key="slot.id"
            class="sdetail__slot"
            :class="{ 'sdetail__slot--disabled': !slot.available }"
          >
            {{ slot.label }}
            <small v-if="slot.available">余 {{ slot.remaining }}</small>
            <small v-else>已满</small>
          </span>
        </div>
      </section>

      <!-- 注意事项 -->
      <section v-if="service.tips.length" class="sdetail__panel surface-card anim-fade-up">
        <h2 class="sdetail__panel-title">注意事项</h2>
        <ul class="sdetail__tips">
          <li v-for="tip in service.tips" :key="tip">{{ tip }}</li>
        </ul>
      </section>
    </div>

    <!-- 底部操作栏 -->
    <div class="sdetail__action-bar">
      <div class="sdetail__action-price">
        <span>会员价</span>
        <PriceText :value="service.memberPrice ?? service.price" size="lg" />
      </div>
      <button type="button" class="button-primary sdetail__book-btn" :disabled="!canBook" @click="bookService">
        {{ bookLabel }}
      </button>
    </div>
  </div>

  <div v-else class="page-pad sdetail__missing">
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
.sdetail {
  padding-bottom: calc(var(--shell-bottom-offset) + var(--action-bar-height) + var(--space-8));
}

.sdetail__loading,
.sdetail__missing {
  display: grid;
  gap: var(--space-4);
  padding-top: var(--space-4);
}

.sdetail__hero {
  position: relative;
  aspect-ratio: 1 / 0.82;
}

.sdetail__hero img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sdetail__hero-scrim {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  height: 60px;
  background: linear-gradient(180deg, transparent, rgba(250, 248, 243, 0.9));
}

.sdetail__content {
  position: relative;
  display: grid;
  gap: var(--space-3);
  margin-top: calc(-1 * var(--space-6));
}

.sdetail__summary {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-5);
  border-radius: var(--radius-xl);
}

.sdetail__tagline {
  justify-self: start;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  background: var(--color-info-soft);
  color: #4E6B80;
  font-size: var(--text-2xs);
  font-weight: var(--weight-bold);
}

.sdetail__title {
  font-size: var(--text-2xl);
  font-weight: var(--weight-semibold);
}

.sdetail__meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-mute);
  font-size: var(--text-xs);
}

.sdetail__meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.sdetail__meta-item--amber {
  color: var(--color-amber);
  font-weight: var(--weight-semibold);
}

.sdetail__meta-sep {
  width: 3px;
  height: 3px;
  border-radius: var(--radius-full);
  background: var(--color-text-tint);
}

.sdetail__price-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-1);
}

.sdetail__member-chip {
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: var(--color-amber-soft);
  color: #8C6A23;
  font-size: var(--text-2xs);
  font-weight: var(--weight-bold);
}

.sdetail__suitable {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-1);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-primary-tint);
  color: var(--color-primary-deep);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
}

.sdetail__panel {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-5);
  border-radius: var(--radius-lg);
}

.sdetail__panel-title {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
}

.sdetail__includes {
  display: grid;
  gap: var(--space-3);
}

.sdetail__includes li {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  color: var(--color-text-soft);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

.sdetail__check {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  transform: translateY(2px);
  border-radius: var(--radius-full);
  background: var(--color-primary-tint);
  color: var(--color-primary);
}

.sdetail__store {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1.5px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  text-align: left;
  transition: all var(--dur-base) var(--ease-out);
}

.sdetail__store--active {
  border-color: var(--color-primary);
  background: var(--color-primary-tint);
}

.sdetail__store-radio {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  transition: all var(--dur-base) var(--ease-out);
}

.sdetail__store--active .sdetail__store-radio {
  border-width: 5px;
  border-color: var(--color-primary-deep);
}

.sdetail__store-info {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 3px;
}

.sdetail__store-info strong {
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
}

.sdetail__store-info small {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--color-text-mute);
  font-size: var(--text-xs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sdetail__store-hours {
  flex-shrink: 0;
  color: var(--color-primary-deep);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
}

.sdetail__dates {
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
  padding-bottom: 2px;
}

.sdetail__date {
  flex-shrink: 0;
  display: grid;
  justify-items: center;
  gap: 2px;
  min-width: 62px;
  padding: var(--space-2) var(--space-3);
  border: 1.5px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  transition: all var(--dur-base) var(--ease-out);
}

.sdetail__date--active {
  border-color: var(--color-primary-deep);
  background: var(--color-primary-deep);
}

.sdetail__date-label {
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
}

.sdetail__date-week {
  color: var(--color-text-mute);
  font-size: var(--text-2xs);
}

.sdetail__date--active .sdetail__date-label {
  color: var(--color-text-invert);
}

.sdetail__date--active .sdetail__date-week {
  color: rgba(247, 244, 236, 0.7);
}

.sdetail__slots-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--space-2);
}

.sdetail__slots-store {
  color: var(--color-text-mute);
  font-size: var(--text-xs);
}

.sdetail__slots {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-2);
}

.sdetail__slot {
  display: grid;
  justify-items: center;
  gap: 1px;
  padding: var(--space-2) 0;
  border: 1px solid var(--color-primary-soft);
  border-radius: var(--radius-sm);
  background: var(--color-primary-tint);
  color: var(--color-primary-deep);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
}

.sdetail__slot small {
  font-size: var(--text-2xs);
  font-weight: var(--weight-regular);
  opacity: 0.75;
}

.sdetail__slot--disabled {
  border-color: var(--color-border-soft);
  background: var(--color-bg-deep);
  color: var(--color-text-tint);
}

.sdetail__slot-state {
  color: var(--color-text-mute);
  font-size: var(--text-sm);
  text-align: center;
  padding: var(--space-3) 0;
}

.sdetail__tips {
  display: grid;
  gap: var(--space-2);
}

.sdetail__tips li {
  position: relative;
  padding-left: var(--space-4);
  color: var(--color-text-soft);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

.sdetail__tips li::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 9px;
  width: 5px;
  height: 5px;
  border-radius: var(--radius-full);
  background: var(--color-amber);
}

.sdetail__action-bar {
  position: fixed;
  right: max(var(--space-4), calc((100vw - var(--mobile-max)) / 2 + var(--space-4)));
  bottom: calc(var(--shell-bottom-offset) + var(--space-4));
  left: max(var(--space-4), calc((100vw - var(--mobile-max)) / 2 + var(--space-4)));
  z-index: var(--z-sticky);
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--color-surface) 92%, transparent);
  box-shadow: var(--shadow-float);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.sdetail__action-price {
  display: grid;
  gap: 1px;
}

.sdetail__action-price > span {
  color: var(--color-text-mute);
  font-size: var(--text-2xs);
}

.sdetail__book-btn {
  flex: 1;
  min-height: 46px;
}
</style>
