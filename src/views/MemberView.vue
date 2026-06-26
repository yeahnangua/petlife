<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import IconSvg from '@/components/IconSvg.vue'
import EmptyState from '@/components/EmptyState.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import { memberBenefits, newbiePack } from '@/content/member'
import { useAccountStore } from '@/stores/account'
import { useProfileStore } from '@/stores/profile'

const router = useRouter()
const accountStore = useAccountStore()
const profileStore = useProfileStore()

onMounted(async () => {
  await Promise.all([
    profileStore.fetchProfile(),
    accountStore.fetchOrdersAndBookings()
  ])
})

const profile = computed(() => profileStore.profile)
</script>

<template>
  <div class="member page-pad">
    <div v-if="profileStore.loading && !profile" class="member__stack">
      <SkeletonBlock variant="card" />
      <SkeletonBlock variant="text" :lines="3" />
    </div>

    <template v-else-if="profile">
      <div class="member__stack">
        <!-- 会员卡（深色 + 琥珀金） -->
        <section class="member__card">
          <div class="member__card-glow" />
          <p class="member__club">PETLIFE CLUB</p>
          <h1 class="member__level font-display">{{ profile.level }}</h1>
          <p class="member__since">入会于 {{ profile.joinDate }} · {{ profile.nickname }}</p>
          <div class="member__card-foot">
            <div class="member__points">
              <strong class="font-display">{{ profile.points }}</strong>
              <span>当前积分</span>
            </div>
            <button type="button" class="member__points member__points--button" @click="router.push('/coupons')">
              <strong class="font-display">{{ profile.couponCount }}</strong>
              <span>可用优惠券</span>
            </button>
            <button
              type="button"
              class="member__edit"
              @click="router.push({ path: '/profile/edit', query: { redirect: '/member' } })"
            >
              编辑资料
            </button>
          </div>
        </section>

        <!-- 近期活跃 -->
        <section class="member__panel surface-card">
          <h2 class="member__panel-title">近期活跃</h2>
          <div class="member__stats">
            <article>
              <strong class="font-display">{{ profile.stats.serviceCount }}</strong>
              <span>累计预约</span>
            </article>
            <article>
              <strong class="font-display">{{ accountStore.pendingShipmentCount }}</strong>
              <span>待发货订单</span>
            </article>
            <article>
              <strong class="font-display">{{ accountStore.pendingServiceCount }}</strong>
              <span>待服务预约</span>
            </article>
          </div>
        </section>

        <!-- 核心权益 -->
        <section class="member__panel surface-card">
          <h2 class="member__panel-title">核心权益</h2>
          <div class="member__benefits">
            <article v-for="benefit in memberBenefits" :key="benefit.id" class="member__benefit">
              <span class="member__benefit-icon" :data-tone="benefit.tone">
                <IconSvg :name="benefit.icon" :size="17" :stroke="1.7" />
              </span>
              <div class="member__benefit-copy">
                <strong>{{ benefit.title }}</strong>
                <p>{{ benefit.desc }}</p>
              </div>
            </article>
          </div>
        </section>

        <!-- 新人礼包 -->
        <section class="member__panel member__panel--gift surface-card">
          <div class="member__gift-head">
            <span class="member__gift-icon">
              <IconSvg name="gift" :size="18" :stroke="1.7" />
            </span>
            <div>
              <h2 class="member__panel-title">{{ newbiePack.title }}</h2>
              <p class="member__gift-sub">{{ newbiePack.subtitle }}</p>
            </div>
          </div>
          <ul class="member__gift-list">
            <li v-for="item in newbiePack.items" :key="item.label">
              <strong>{{ item.label }}</strong>
              <span>{{ item.desc }}</span>
            </li>
          </ul>
        </section>
      </div>
    </template>

    <EmptyState
      v-else
      icon="star"
      title="会员信息加载失败"
      :description="profileStore.error || '稍后重新进入此页再试。'"
      action-label="重试"
      @action="profileStore.fetchProfile()"
    />
  </div>
</template>

<style scoped>
.member {
  padding-top: var(--space-2);
  padding-bottom: var(--space-6);
}

.member__stack {
  display: grid;
  gap: var(--space-3);
}

/* ---------- 会员卡 ---------- */
.member__card {
  position: relative;
  overflow: hidden;
  display: grid;
  gap: 3px;
  padding: var(--space-6) var(--space-5) var(--space-5);
  border-radius: var(--radius-2xl);
  background: linear-gradient(140deg, #2A2620 0%, #3A332A 70%, #2A2620 100%);
  color: #F4E7CC;
  box-shadow: var(--shadow-lg);
}

.member__card-glow {
  position: absolute;
  top: -60px;
  right: -40px;
  width: 200px;
  height: 200px;
  border-radius: var(--radius-full);
  background: radial-gradient(circle, rgba(201, 154, 69, 0.32), transparent 68%);
  pointer-events: none;
}

.member__club {
  color: rgba(244, 231, 204, 0.55);
  font-size: var(--text-2xs);
  font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-wider);
}

.member__level {
  font-size: var(--text-3xl);
  font-weight: var(--weight-semibold);
}

.member__since {
  color: rgba(244, 231, 204, 0.62);
  font-size: var(--text-xs);
}

.member__card-foot {
  display: flex;
  align-items: flex-end;
  gap: var(--space-6);
  margin-top: var(--space-5);
  padding-top: var(--space-4);
  border-top: 1px solid rgba(244, 231, 204, 0.16);
}

.member__points {
  display: grid;
  gap: 1px;
}

.member__points--button {
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.member__points strong {
  font-size: var(--text-2xl);
  font-weight: var(--weight-semibold);
  color: #E8C77F;
}

.member__points span {
  color: rgba(244, 231, 204, 0.55);
  font-size: var(--text-2xs);
}

.member__edit {
  margin-left: auto;
  padding: 8px 14px;
  border: 1px solid rgba(244, 231, 204, 0.35);
  border-radius: var(--radius-full);
  color: #F4E7CC;
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  transition: transform var(--dur-fast) var(--ease-spring);
}

.member__edit:active {
  transform: scale(0.94);
}

/* ---------- 面板 ---------- */
.member__panel {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-5);
  border-radius: var(--radius-lg);
}

.member__panel-title {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
}

.member__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
}

.member__stats article {
  display: grid;
  justify-items: center;
  gap: 2px;
  padding: var(--space-3) 0;
  border-radius: var(--radius-md);
  background: var(--color-surface-soft);
}

.member__stats strong {
  font-size: var(--text-xl);
  font-weight: var(--weight-semibold);
}

.member__stats span {
  color: var(--color-text-mute);
  font-size: var(--text-2xs);
}

/* ---------- 权益 ---------- */
.member__benefits {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.member__benefit {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
}

.member__benefit-icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 12px;
}

.member__benefit-icon[data-tone='sage'] {
  background: var(--color-primary-tint);
  color: var(--color-primary);
}

.member__benefit-icon[data-tone='coral'] {
  background: var(--color-coral-soft);
  color: var(--color-coral);
}

.member__benefit-icon[data-tone='amber'] {
  background: var(--color-amber-soft);
  color: var(--color-amber);
}

.member__benefit-icon[data-tone='clay'] {
  background: #F2E6DC;
  color: var(--color-clay);
}

.member__benefit-copy {
  display: grid;
  gap: 1px;
  min-width: 0;
}

.member__benefit-copy strong {
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
}

.member__benefit-copy p {
  color: var(--color-text-mute);
  font-size: var(--text-2xs);
  line-height: var(--leading-snug);
}

/* ---------- 新人礼包 ---------- */
.member__gift-head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.member__gift-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: var(--color-coral-soft);
  color: var(--color-coral);
}

.member__gift-sub {
  color: var(--color-text-mute);
  font-size: var(--text-xs);
}

.member__gift-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2);
}

.member__gift-list li {
  display: grid;
  gap: 2px;
  padding: var(--space-3) var(--space-4);
  border: 1px dashed var(--color-coral-soft);
  border-radius: var(--radius-md);
  background: #FDF7F3;
}

.member__gift-list strong {
  color: var(--color-coral);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
}

.member__gift-list span {
  color: var(--color-text-mute);
  font-size: var(--text-2xs);
}
</style>
