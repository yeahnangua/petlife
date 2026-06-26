<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import EmptyState from '@/components/EmptyState.vue'
import IconSvg from '@/components/IconSvg.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'

const router = useRouter()
const authStore = useAuthStore()
const profileStore = useProfileStore()

onMounted(async () => {
  await Promise.all([profileStore.fetchProfile(), profileStore.fetchPets()])
})

const profile = computed(() => profileStore.profile)
const selectedPet = computed(() => profileStore.selectedPet)
const profileLevel = computed(() => profile.value?.level?.replace(/^PetLife\s*[· ]\s*/, '') || '')

const shortcuts = [
  { label: '我的订单', icon: 'order', to: '/orders', tone: 'sage' },
  { label: '会员权益', icon: 'star', to: '/member', tone: 'amber' },
  { label: '宠物档案', icon: 'paw', to: '/pets', tone: 'clay' },
  { label: '购物车', icon: 'cart', to: '/cart', tone: 'coral' }
]

const functions = [
  { label: '收货地址', icon: 'location', to: '/addresses' },
  { label: '编辑资料', icon: 'edit', to: { path: '/profile/edit', query: { redirect: '/profile' } } }
]

async function handleLogout() {
  try {
    await authStore.logout()
  } finally {
    router.replace('/login')
  }
}
</script>

<template>
  <div class="me page-pad">
    <div v-if="profileStore.loading && !profile" class="me__stack">
      <SkeletonBlock variant="card" />
      <SkeletonBlock variant="text" :lines="2" />
    </div>

    <template v-else-if="profile">
      <div class="me__stack">
        <!-- 用户头部（深色块） -->
        <section class="me__hero">
          <div class="me__hero-row">
            <img class="me__avatar" :src="profile.avatar" :alt="profile.nickname" />
            <div class="me__identity">
              <h1 class="me__name font-display">{{ profile.nickname }}</h1>
              <p class="me__meta">{{ profile.phone }}</p>
              <span class="me__level">
                <IconSvg name="star" :size="11" :stroke="2.2" />
                {{ profileLevel }} · 入会于 {{ profile.joinDate }}
              </span>
            </div>
            <button
              type="button"
              class="me__edit"
              aria-label="编辑资料"
              @click="router.push({ path: '/profile/edit', query: { redirect: '/profile' } })"
            >
              <IconSvg name="edit" :size="16" :stroke="1.8" />
            </button>
          </div>
          <div class="me__stats">
            <article>
              <strong class="font-display">{{ profile.stats.orderCount }}</strong>
              <span>累计订单</span>
            </article>
            <i />
            <article>
              <strong class="font-display">{{ profile.stats.serviceCount }}</strong>
              <span>预约服务</span>
            </article>
            <i />
            <article>
              <strong class="font-display">¥{{ profile.stats.savedAmount }}</strong>
              <span>累计节省</span>
            </article>
          </div>
        </section>

        <!-- 快捷入口 -->
        <section class="me__shortcuts surface-card">
          <button
            v-for="item in shortcuts"
            :key="item.label"
            type="button"
            class="me__shortcut"
            @click="router.push(item.to)"
          >
            <span class="me__shortcut-icon" :data-tone="item.tone">
              <IconSvg :name="item.icon" :size="19" :stroke="1.7" />
            </span>
            <span>{{ item.label }}</span>
          </button>
        </section>

        <!-- 常用宠物 -->
        <section class="me__pet surface-card" @click="router.push('/pets')">
          <div class="me__pet-avatar" :style="{ background: selectedPet?.avatar ? 'transparent' : (selectedPet?.color || 'var(--color-primary-tint)') }">
            <img v-if="selectedPet?.avatar" :src="selectedPet.avatar" :alt="selectedPet.name" />
            <IconSvg v-else name="paw" :size="20" :stroke="1.8" />
          </div>
          <div class="me__pet-info">
            <p class="me__pet-eyebrow">当前常用宠物</p>
            <h3 class="me__pet-name">{{ selectedPet?.name || '去创建档案' }}</h3>
            <p v-if="selectedPet" class="me__pet-meta">
              {{ selectedPet.breed }}<template v-if="selectedPet.age"> · {{ selectedPet.age }}</template> · {{ selectedPet.weight }}kg
            </p>
          </div>
          <span class="me__pet-manage">
            管理
            <IconSvg name="arrow-right" :size="12" :stroke="2.4" />
          </span>
        </section>

        <!-- 积分与权益 -->
        <section class="me__points surface-card" @click="router.push('/coupons')">
          <div class="me__points-info">
            <p class="me__pet-eyebrow">积分与权益</p>
            <h3 class="me__points-value font-display">{{ profile.points }} <small>积分</small></h3>
            <p class="me__pet-meta">{{ profile.couponCount }} 张可用券 · 完整权益看会员页</p>
          </div>
          <span class="me__points-cta">
            <IconSvg name="gift" :size="18" :stroke="1.7" />
          </span>
        </section>

        <!-- 功能列表 -->
        <section class="me__functions surface-card">
          <button
            v-for="item in functions"
            :key="item.label"
            type="button"
            class="me__function"
            @click="router.push(item.to)"
          >
            <IconSvg :name="item.icon" :size="17" :stroke="1.7" class="me__function-icon" />
            <span>{{ item.label }}</span>
            <IconSvg name="arrow-right" :size="14" :stroke="2" class="me__function-arrow" />
          </button>
          <button
            type="button"
            class="me__function me__function--logout"
            data-test="profile-logout"
            @click="handleLogout"
          >
            <IconSvg name="logout" :size="17" :stroke="1.7" class="me__function-icon" />
            <span>退出登录</span>
            <IconSvg name="arrow-right" :size="14" :stroke="2" class="me__function-arrow" />
          </button>
        </section>
      </div>
    </template>

    <EmptyState
      v-else
      title="个人资料加载失败"
      :description="profileStore.error || '稍后再试一次。'"
      action-label="重试"
      @action="profileStore.fetchProfile()"
    />
  </div>
</template>

<style scoped>
.me {
  padding-bottom: var(--space-6);
}

.me__stack {
  display: grid;
  gap: var(--space-3);
  padding-top: calc(var(--safe-top) + var(--space-4));
}

/* ---------- 头部 ---------- */
.me__hero {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-5);
  border-radius: var(--radius-2xl);
  background: linear-gradient(152deg, #2E4A38 0%, var(--color-primary-deep) 62%, #1E3024 100%);
  color: var(--color-text-invert);
  box-shadow: var(--shadow-brand);
}

.me__hero-row {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.me__avatar {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-full);
  object-fit: cover;
  box-shadow: 0 0 0 2.5px rgba(247, 244, 236, 0.35);
}

.me__identity {
  flex: 1;
  display: grid;
  gap: 3px;
  min-width: 0;
}

.me__name {
  font-size: var(--text-2xl);
  font-weight: var(--weight-semibold);
}

.me__meta {
  color: rgba(247, 244, 236, 0.65);
  font-size: var(--text-xs);
}

.me__level {
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  border: 1px solid rgba(201, 154, 69, 0.6);
  border-radius: var(--radius-full);
  color: #E8C77F;
  font-size: var(--text-2xs);
  font-weight: var(--weight-medium);
}

.me__edit {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: rgba(247, 244, 236, 0.14);
  color: var(--color-text-invert);
  transition: transform var(--dur-fast) var(--ease-spring);
}

.me__edit:active {
  transform: scale(0.9);
}

.me__stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--space-4);
  border-top: 1px solid rgba(247, 244, 236, 0.14);
}

.me__stats article {
  display: grid;
  justify-items: center;
  gap: 2px;
}

.me__stats strong {
  font-size: var(--text-xl);
  font-weight: var(--weight-semibold);
}

.me__stats span {
  color: rgba(247, 244, 236, 0.6);
  font-size: var(--text-2xs);
}

.me__stats i {
  width: 1px;
  height: 26px;
  background: rgba(247, 244, 236, 0.14);
}

/* ---------- 快捷入口 ---------- */
.me__shortcuts {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-2);
  padding: var(--space-4) var(--space-2);
  border-radius: var(--radius-xl);
}

.me__shortcut {
  display: grid;
  justify-items: center;
  gap: var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--color-text-soft);
  transition: transform var(--dur-fast) var(--ease-spring);
}

.me__shortcut:active {
  transform: scale(0.92);
}

.me__shortcut-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 16px;
}

.me__shortcut-icon[data-tone='sage'] {
  background: var(--color-primary-tint);
  color: var(--color-primary);
}

.me__shortcut-icon[data-tone='amber'] {
  background: var(--color-amber-soft);
  color: var(--color-amber);
}

.me__shortcut-icon[data-tone='clay'] {
  background: #F2E6DC;
  color: var(--color-clay);
}

.me__shortcut-icon[data-tone='coral'] {
  background: var(--color-coral-soft);
  color: var(--color-coral);
}

/* ---------- 宠物卡 ---------- */
.me__pet,
.me__points {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: transform var(--dur-fast) var(--ease-spring);
}

.me__pet:active,
.me__points:active {
  transform: scale(0.98);
}

.me__pet-avatar {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  border-radius: var(--radius-full);
  overflow: hidden;
  color: rgba(255, 255, 255, 0.9);
}

.me__pet-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.me__pet-info,
.me__points-info {
  flex: 1;
  display: grid;
  gap: 2px;
  min-width: 0;
}

.me__pet-eyebrow {
  color: var(--color-text-tint);
  font-size: var(--text-2xs);
  letter-spacing: var(--tracking-wide);
}

.me__pet-name {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
}

.me__pet-meta {
  color: var(--color-text-mute);
  font-size: var(--text-xs);
}

.me__pet-manage {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  color: var(--color-text-mute);
  font-size: var(--text-sm);
}

/* ---------- 积分 ---------- */
.me__points-value {
  font-size: var(--text-2xl);
  font-weight: var(--weight-semibold);
  color: var(--color-text);
}

.me__points-value small {
  font-size: var(--text-sm);
  color: var(--color-text-mute);
}

.me__points-cta {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border-radius: var(--radius-full);
  background: var(--color-amber-soft);
  color: var(--color-amber);
}

/* ---------- 功能列表 ---------- */
.me__functions {
  display: grid;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.me__function {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  font-size: var(--text-md);
  text-align: left;
  transition: background-color var(--dur-fast) var(--ease-out);
}

.me__function:active {
  background: var(--color-surface-soft);
}

.me__function + .me__function {
  border-top: 1px solid var(--color-border-soft);
}

.me__function-icon {
  color: var(--color-primary);
}

.me__function--logout {
  color: var(--color-danger);
}

.me__function--logout .me__function-icon {
  color: var(--color-danger);
}

.me__function span {
  flex: 1;
}

.me__function-arrow {
  color: var(--color-text-tint);
}
</style>
