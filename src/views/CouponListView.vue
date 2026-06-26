<script setup>
import { computed, onMounted } from 'vue'
import EmptyState from '@/components/EmptyState.vue'
import IconSvg from '@/components/IconSvg.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import { formatCurrency } from '@/lib/pricing'
import { useCouponStore } from '@/stores/coupons'

const couponStore = useCouponStore()

const visibleCoupons = computed(() => [
  ...couponStore.accountAvailableCoupons,
  ...couponStore.usedCoupons
])

function formatDate(value) {
  return String(value || '').slice(0, 10)
}

onMounted(() => {
  couponStore.fetchCoupons()
})
</script>

<template>
  <div class="coupons page-pad">
    <header class="coupons__head">
      <p class="coupons__eyebrow">COUPONS</p>
      <h1 class="coupons__title font-display">我的优惠券</h1>
    </header>

    <div v-if="couponStore.loading" class="coupons__stack">
      <SkeletonBlock variant="card" />
      <SkeletonBlock variant="card" />
    </div>

    <EmptyState
      v-else-if="couponStore.error"
      icon="coupon"
      title="优惠券加载失败"
      :description="couponStore.error"
      action-label="重新加载"
      @action="couponStore.fetchCoupons()"
    />

    <template v-else-if="visibleCoupons.length">
      <section v-if="couponStore.accountAvailableCoupons.length" class="coupons__stack">
        <article v-for="coupon in couponStore.accountAvailableCoupons" :key="coupon.id" class="coupons__item surface-card">
          <div class="coupons__amount">
            <small>¥</small>
            <strong>{{ coupon.amount }}</strong>
          </div>
          <div class="coupons__body">
            <h2>{{ coupon.name }}</h2>
            <p>{{ coupon.description }}</p>
            <span>满 {{ coupon.minOrderAmount }} 可用 · 有效期至 {{ formatDate(coupon.validTo) }}</span>
          </div>
          <IconSvg name="coupon" :size="20" :stroke="1.8" />
        </article>
      </section>

      <section v-if="couponStore.usedCoupons.length" class="coupons__stack coupons__stack--muted">
        <h2 class="coupons__section-title">已使用</h2>
        <article v-for="coupon in couponStore.usedCoupons" :key="coupon.id" class="coupons__item coupons__item--muted surface-card">
          <div class="coupons__amount">
            <small>¥</small>
            <strong>{{ coupon.amount }}</strong>
          </div>
          <div class="coupons__body">
            <h2>{{ coupon.name }}</h2>
            <p>{{ coupon.description }}</p>
            <span>已使用 · 有效期至 {{ formatDate(coupon.validTo) }}</span>
          </div>
        </article>
      </section>
    </template>

    <EmptyState
      v-else
      icon="coupon"
      title="暂无优惠券"
      description="可用优惠券会在这里显示。"
      action-label="刷新"
      @action="couponStore.fetchCoupons()"
    />
  </div>
</template>

<style scoped>
.coupons {
  padding-top: var(--space-2);
  padding-bottom: var(--space-6);
}

.coupons__head {
  display: grid;
  gap: var(--space-1);
  margin-bottom: var(--space-5);
}

.coupons__eyebrow {
  color: var(--color-primary);
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-wider);
}

.coupons__title {
  font-size: var(--text-3xl);
}

.coupons__stack {
  display: grid;
  gap: var(--space-3);
}

.coupons__stack + .coupons__stack {
  margin-top: var(--space-6);
}

.coupons__section-title {
  color: var(--color-text-soft);
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
}

.coupons__item {
  display: grid;
  grid-template-columns: 76px 1fr auto;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-md);
}

.coupons__amount {
  color: var(--color-coral);
  line-height: 1;
}

.coupons__amount small {
  font-size: var(--text-sm);
  font-weight: var(--weight-bold);
}

.coupons__amount strong {
  font-family: var(--font-display);
  font-size: var(--text-4xl);
}

.coupons__body {
  display: grid;
  gap: var(--space-1);
  min-width: 0;
}

.coupons__body h2 {
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
}

.coupons__body p,
.coupons__body span {
  color: var(--color-text-mute);
  font-size: var(--text-sm);
}

.coupons__item--muted {
  opacity: 0.62;
}
</style>
