<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import EmptyState from '@/components/EmptyState.vue'
import IconSvg from '@/components/IconSvg.vue'
import PetCard from '@/components/PetCard.vue'
import PriceText from '@/components/PriceText.vue'
import StickyActionBar from '@/components/StickyActionBar.vue'
import { formatCurrency } from '@/lib/pricing'
import { useBookingStore } from '@/stores/booking'
import { useCouponStore } from '@/stores/coupons'
import { useProfileStore } from '@/stores/profile'

const router = useRouter()
const bookingStore = useBookingStore()
const couponStore = useCouponStore()
const profileStore = useProfileStore()

onMounted(async () => {
  await profileStore.fetchPets()

  if (bookingStore.serviceId && !bookingStore.timeSlots.length) {
    await bookingStore.fetchSlots()
  }

  if (bookingStore.serviceId) {
    try {
      const coupons = await couponStore.fetchCoupons({ subtotal: serviceSubtotal.value, target: 'service' })
      if (!bookingStore.selectedCouponId) {
        bookingStore.selectedCouponId = coupons.find((coupon) => coupon.available)?.id ?? ''
      }
    } catch {
      // 预约信息本身仍可提交，优惠券区域会显示 store 中的加载错误。
    }
  }
})

const currentService = computed(() => bookingStore.currentService)
const availablePets = computed(() => profileStore.pets)
const selectedPet = computed(
  () => availablePets.value.find((pet) => pet.id === bookingStore.petId) ?? null
)
const selectedStore = computed(
  () => bookingStore.storeOptions.find((item) => item.id === bookingStore.storeId) ?? null
)
const serviceSubtotal = computed(() => currentService.value?.memberPrice ?? currentService.value?.price ?? 0)
const selectedCoupon = computed(
  () => couponStore.items.find((item) => item.id === bookingStore.selectedCouponId && item.available) ?? null
)
const discountAmount = computed(() => selectedCoupon.value?.amount ?? 0)
const payableAmount = computed(() => Math.max(serviceSubtotal.value - discountAmount.value, 0))

async function submitBooking() {
  const booking = await bookingStore.submitBooking()
  router.replace({
    path: `/bookings/${booking.id}`,
    query: { backTo: '/' }
  })
}
</script>

<template>
  <div class="booking page-pad page-with-submit-bar">
    <template v-if="!availablePets.length">
      <EmptyState
        icon="paw"
        title="先创建宠物档案"
        description="服务预约需要关联具体宠物，补一份档案后就能继续。"
        action-label="去新增档案"
        @action="router.push('/pets')"
      />
    </template>

    <template v-else-if="currentService">
      <div class="booking__stack">
        <!-- 服务摘要 -->
        <section class="booking__service surface-card">
          <img :src="currentService.cover" :alt="currentService.title" />
          <div class="booking__service-info">
            <h2 class="booking__service-title">{{ currentService.title }}</h2>
            <p class="booking__service-meta">
              <IconSvg name="clock" :size="13" :stroke="2" />
              {{ currentService.duration }} 分钟
            </p>
            <PriceText :value="currentService.memberPrice ?? currentService.price" size="md" />
          </div>
        </section>

        <!-- 01 选择宠物 -->
        <section class="booking__card surface-card">
          <header class="booking__card-head">
            <span class="booking__step font-display">01</span>
            <h2 class="booking__card-title">选择宠物</h2>
          </header>
          <div class="booking__pets">
            <PetCard
              v-for="pet in availablePets"
              :key="pet.id"
              :pet="pet"
              :active="bookingStore.petId === pet.id"
              @select="bookingStore.setPet(pet.id)"
            />
          </div>
        </section>

        <!-- 02 选择门店 -->
        <section class="booking__card surface-card">
          <header class="booking__card-head">
            <span class="booking__step font-display">02</span>
            <h2 class="booking__card-title">选择门店</h2>
          </header>
          <button
            v-for="storeItem in bookingStore.storeOptions"
            :key="storeItem.id"
            type="button"
            class="booking__store"
            :class="{ 'booking__store--active': bookingStore.storeId === storeItem.id }"
            @click="bookingStore.setStore(storeItem.id)"
          >
            <span class="booking__store-radio" />
            <span class="booking__store-info">
              <strong>{{ storeItem.name }}</strong>
              <small>{{ storeItem.address }}</small>
            </span>
          </button>
        </section>

        <!-- 03 日期与时段 -->
        <section class="booking__card surface-card">
          <header class="booking__card-head">
            <span class="booking__step font-display">03</span>
            <h2 class="booking__card-title">日期与时段</h2>
          </header>

          <div class="booking__dates hide-scroll">
            <button
              v-for="date in bookingStore.dateOptions"
              :key="date.date"
              type="button"
              class="booking__date"
              :class="{ 'booking__date--active': bookingStore.date === date.date }"
              @click="bookingStore.setDate(date.date)"
            >
              <span class="booking__date-label">{{ date.label }}</span>
              <span class="booking__date-week">{{ date.weekday }}</span>
            </button>
          </div>

          <p v-if="bookingStore.loading" class="booking__slot-state">正在查询时段余量…</p>
          <div v-else class="booking__slots">
            <button
              v-for="slot in bookingStore.timeSlots"
              :key="slot.id"
              type="button"
              class="booking__slot"
              :class="{
                'booking__slot--active': bookingStore.slotId === slot.id,
                'booking__slot--disabled': !slot.available
              }"
              :disabled="!slot.available"
              @click="bookingStore.setSlot(slot.id)"
            >
              {{ slot.label }}
              <small v-if="slot.available">余 {{ slot.remaining }}</small>
              <small v-else>已满</small>
            </button>
          </div>
        </section>

        <!-- 04 优惠券 -->
        <section class="booking__card surface-card">
          <header class="booking__card-head">
            <span class="booking__step font-display">04</span>
            <h2 class="booking__card-title">优惠券</h2>
            <span class="booking__coupon-count">{{ couponStore.availableCoupons.length }} 张可用</span>
          </header>
          <div v-if="couponStore.availableCoupons.length" class="booking__coupons">
            <label
              v-for="coupon in couponStore.availableCoupons"
              :key="coupon.id"
              class="booking__coupon"
              :class="{ 'booking__coupon--active': bookingStore.selectedCouponId === coupon.id }"
            >
              <input v-model="bookingStore.selectedCouponId" type="radio" :value="coupon.id" class="sr-only" />
              <span class="booking__coupon-main">
                <strong>{{ coupon.name }}</strong>
                <small>{{ coupon.description || `满 ${coupon.minOrderAmount} 减 ${coupon.amount}` }}</small>
              </span>
              <span class="booking__coupon-amount">-{{ formatCurrency(coupon.amount) }}</span>
            </label>
          </div>
          <div v-if="couponStore.checkoutUnavailableCoupons.length" class="booking__coupons booking__coupons--muted">
            <article
              v-for="coupon in couponStore.checkoutUnavailableCoupons"
              :key="coupon.id"
              class="booking__coupon booking__coupon--disabled"
            >
              <span class="booking__coupon-main">
                <strong>{{ coupon.name }}</strong>
                <small>{{ coupon.unavailableReason || `满 ${coupon.minOrderAmount} 可用` }}</small>
              </span>
              <span class="booking__coupon-amount">-{{ formatCurrency(coupon.amount) }}</span>
            </article>
          </div>
          <p
            v-if="!couponStore.availableCoupons.length && !couponStore.checkoutUnavailableCoupons.length"
            class="booking__coupon-empty"
          >
            暂无可用优惠券
          </p>
        </section>

        <!-- 05 联系与备注 -->
        <section class="booking__card surface-card">
          <header class="booking__card-head">
            <span class="booking__step font-display">05</span>
            <h2 class="booking__card-title">联系与备注</h2>
          </header>
          <p v-if="bookingStore.error" class="booking__error">{{ bookingStore.error }}</p>
          <label class="booking__field">
            <span>联系电话</span>
            <input v-model="bookingStore.phone" type="tel" placeholder="填写门店联系号码" />
          </label>
          <label class="booking__field">
            <span>预约备注</span>
            <textarea
              v-model="bookingStore.note"
              rows="3"
              placeholder="比如怕生、对牛肉过敏、需要提前电话联系"
            />
          </label>
        </section>
      </div>

      <StickyActionBar>
        <div class="booking__bar-info">
          <span class="booking__bar-meta">
            {{ [selectedPet?.name, selectedStore?.name].filter(Boolean).join(' · ') || '请完成预约信息' }}
          </span>
          <PriceText :value="payableAmount" size="lg" />
        </div>
        <button
          type="button"
          class="button-primary booking__submit-btn"
          :disabled="!bookingStore.isReady || bookingStore.submitting"
          @click="submitBooking"
        >
          {{ bookingStore.submitting ? '提交中…' : '提交预约' }}
        </button>
      </StickyActionBar>
    </template>

    <EmptyState
      v-else
      icon="calendar"
      title="先从服务详情发起预约"
      description="当前没有待确认的服务预约，回服务页重新选择即可。"
      action-label="去服务页"
      @action="router.push('/service')"
    />
  </div>
</template>

<style scoped>
.booking {
  padding-top: var(--space-2);
  padding-bottom: var(--space-6);
}

.booking__stack {
  display: grid;
  gap: var(--space-3);
}

.booking__service {
  display: grid;
  grid-template-columns: 84px minmax(0, 1fr);
  gap: var(--space-4);
  padding: var(--space-4);
  border-radius: var(--radius-xl);
}

.booking__service img {
  width: 84px;
  height: 84px;
  border-radius: var(--radius-md);
  object-fit: cover;
  background: var(--color-surface-warm);
}

.booking__service-info {
  display: grid;
  align-content: center;
  gap: 4px;
}

.booking__service-title {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
}

.booking__service-meta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text-mute);
  font-size: var(--text-xs);
}

.booking__card {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-5);
  border-radius: var(--radius-lg);
}

.booking__card-head {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
}

.booking__step {
  color: var(--color-primary-soft);
  font-size: var(--text-2xl);
  font-weight: var(--weight-bold);
  font-style: italic;
}

.booking__card-title {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
}

.booking__coupon-count,
.booking__coupon-empty {
  color: var(--color-text-mute);
  font-size: var(--text-xs);
}

.booking__coupon-count {
  margin-left: auto;
}

.booking__pets {
  display: grid;
  gap: var(--space-2);
}

.booking__store {
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

.booking__store--active {
  border-color: var(--color-primary);
  background: var(--color-primary-tint);
}

.booking__store-radio {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  transition: all var(--dur-base) var(--ease-out);
}

.booking__store--active .booking__store-radio {
  border-width: 5px;
  border-color: var(--color-primary-deep);
}

.booking__store-info {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.booking__store-info strong {
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
}

.booking__store-info small {
  color: var(--color-text-mute);
  font-size: var(--text-xs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.booking__dates {
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
  padding-bottom: 2px;
}

.booking__date {
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

.booking__date--active {
  border-color: var(--color-primary-deep);
  background: var(--color-primary-deep);
}

.booking__date-label {
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
}

.booking__date-week {
  color: var(--color-text-mute);
  font-size: var(--text-2xs);
}

.booking__date--active .booking__date-label {
  color: var(--color-text-invert);
}

.booking__date--active .booking__date-week {
  color: rgba(247, 244, 236, 0.7);
}

.booking__slots {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-2);
}

.booking__slot {
  display: grid;
  justify-items: center;
  gap: 1px;
  padding: var(--space-2) 0;
  border: 1.5px solid var(--color-primary-soft);
  border-radius: var(--radius-sm);
  background: var(--color-primary-tint);
  color: var(--color-primary-deep);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  transition: all var(--dur-base) var(--ease-out);
}

.booking__slot small {
  font-size: var(--text-2xs);
  font-weight: var(--weight-regular);
  opacity: 0.75;
}

.booking__slot--active {
  border-color: var(--color-primary-deep);
  background: var(--color-primary-deep);
  color: var(--color-text-invert);
}

.booking__slot--disabled {
  border-color: var(--color-border-soft);
  background: var(--color-bg-deep);
  color: var(--color-text-tint);
  cursor: not-allowed;
}

.booking__slot-state {
  color: var(--color-text-mute);
  font-size: var(--text-sm);
  text-align: center;
  padding: var(--space-2) 0;
}

.booking__coupons {
  display: grid;
  gap: var(--space-2);
}

.booking__coupons--muted {
  margin-top: calc(var(--space-2) * -1);
}

.booking__coupon {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1.5px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.booking__coupon--active {
  border-color: var(--color-primary-deep);
  background: var(--color-primary-tint);
}

.booking__coupon--disabled {
  opacity: 0.58;
}

.booking__coupon-main {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.booking__coupon-main strong {
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
}

.booking__coupon-main small {
  color: var(--color-text-mute);
  font-size: var(--text-xs);
}

.booking__coupon-amount {
  flex-shrink: 0;
  color: var(--color-coral);
  font-size: var(--text-sm);
  font-weight: var(--weight-bold);
}

.booking__field {
  display: grid;
  gap: var(--space-2);
}

.booking__field span {
  color: var(--color-text-soft);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
}

.booking__field input,
.booking__field textarea {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  font-size: var(--text-body);
  transition: border-color var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out);
}

.booking__field textarea {
  resize: none;
}

.booking__field input:focus,
.booking__field textarea:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-tint);
}

.booking__error {
  color: var(--color-danger);
  font-size: var(--text-sm);
}

.booking__bar-info {
  display: grid;
  gap: 1px;
  flex: 1;
  min-width: 0;
}

.booking__bar-meta {
  color: var(--color-text-mute);
  font-size: var(--text-2xs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.booking__submit-btn {
  min-width: 132px;
}
</style>
