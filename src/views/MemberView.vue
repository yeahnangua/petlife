<script setup>
import IconSvg from '@/components/IconSvg.vue'
import { coupons, memberBenefits, newbiePack, user } from '@/mocks'
</script>

<template>
  <div class="member page-pad page-stack">
    <section class="member__hero surface-card">
      <div>
        <p class="section-heading__meta">PetLife Club</p>
        <h2 class="font-display">会员不是折扣堆砌，而是照顾体验的升级。</h2>
      </div>
      <div class="member__stats">
        <article>
          <strong>{{ user.points }}</strong>
          <span>当前积分</span>
        </article>
        <article>
          <strong>{{ user.couponCount }}</strong>
          <span>可用券</span>
        </article>
      </div>
    </section>

    <section class="surface-card member__panel">
      <div class="section-heading">
        <h2 class="section-heading__title">核心权益</h2>
      </div>
      <div class="member__benefits">
        <article
          v-for="benefit in memberBenefits"
          :key="benefit.id"
          class="member__benefit"
        >
          <span class="member__icon">
            <IconSvg :name="benefit.icon" :size="18" />
          </span>
          <div>
            <strong>{{ benefit.title }}</strong>
            <p>{{ benefit.desc }}</p>
          </div>
        </article>
      </div>
    </section>

    <section class="surface-card member__panel">
      <div class="section-heading">
        <h2 class="section-heading__title">可用优惠券</h2>
      </div>
      <article
        v-for="coupon in coupons"
        :key="coupon.id"
        class="member__coupon"
      >
        <div>
          <strong>¥{{ coupon.amount }}</strong>
          <p>{{ coupon.title }}</p>
        </div>
        <div class="member__coupon-meta">
          <span>{{ coupon.scope }}</span>
          <span>{{ coupon.expire }} 到期</span>
        </div>
      </article>
    </section>

    <section class="surface-card member__panel">
      <div class="section-heading">
        <h2 class="section-heading__title">{{ newbiePack.title }}</h2>
      </div>
      <p class="member__subtitle">{{ newbiePack.subtitle }}</p>
      <ul class="member__gift-list">
        <li v-for="item in newbiePack.items" :key="item.label">
          <strong>{{ item.label }}</strong>
          <span>{{ item.desc }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.member {
  padding-bottom: var(--space-6);
}

.member__hero,
.member__panel {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-5);
}

.member__hero {
  background:
    radial-gradient(circle at top right, rgba(212, 164, 76, 0.18), transparent 30%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.82), rgba(242, 234, 219, 0.88));
}

.member__hero h2 {
  max-width: 14ch;
  font-size: clamp(28px, 7vw, 40px);
}

.member__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.member__stats article,
.member__benefit,
.member__coupon,
.member__gift-list li {
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  background: var(--color-surface-soft);
}

.member__stats strong {
  display: block;
  font-size: var(--text-2xl);
}

.member__stats span,
.member__subtitle,
.member__benefit p,
.member__coupon-meta span,
.member__gift-list span {
  color: var(--color-text-soft);
  font-size: var(--text-sm);
}

.member__benefits {
  display: grid;
  gap: var(--space-3);
}

.member__benefit {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: var(--space-3);
}

.member__icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: var(--color-primary-tint);
  color: var(--color-primary-deep);
}

.member__coupon {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.member__coupon strong {
  font-size: var(--text-2xl);
  color: var(--color-coral);
}

.member__coupon-meta {
  display: grid;
  gap: 6px;
  text-align: right;
}

.member__gift-list {
  display: grid;
  gap: var(--space-3);
}

.member__gift-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}
</style>
