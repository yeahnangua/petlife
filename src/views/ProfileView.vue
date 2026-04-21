<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import EmptyState from '@/components/EmptyState.vue'
import IconSvg from '@/components/IconSvg.vue'
import { useProfileStore } from '@/stores/profile'

const router = useRouter()
const profileStore = useProfileStore()

onMounted(async () => {
  await Promise.all([profileStore.fetchProfile(), profileStore.fetchPets()])
})

const profile = computed(() => profileStore.profile)
const selectedPet = computed(() => profileStore.selectedPet)

const shortcuts = [
  { label: '我的订单', icon: 'order', to: '/orders' },
  { label: '会员权益', icon: 'star', to: '/member' },
  { label: '宠物档案', icon: 'paw', to: '/pets' },
  { label: '购物车', icon: 'cart', to: '/cart' }
]
</script>

<template>
  <div class="profile page-pad page-stack">
    <div v-if="profileStore.loading && !profile" class="surface-card profile__state">
      正在加载个人资料...
    </div>

    <template v-else-if="profile">
      <section class="profile__hero surface-card">
        <img class="profile__avatar" :src="profile.avatar" :alt="profile.nickname" />
        <div class="profile__copy">
          <span class="pill">{{ profile.level }}</span>
          <h2>{{ profile.nickname }}</h2>
          <p>{{ profile.phone }} · 入会于 {{ profile.joinDate }}</p>
        </div>
      </section>

      <section class="profile__stats surface-card">
        <article>
          <strong>{{ profile.stats.orderCount }}</strong>
          <span>累计订单</span>
        </article>
        <article>
          <strong>{{ profile.stats.serviceCount }}</strong>
          <span>预约服务</span>
        </article>
        <article>
          <strong>¥{{ profile.stats.savedAmount }}</strong>
          <span>累计节省</span>
        </article>
      </section>

      <section class="profile__grid">
        <button
          v-for="item in shortcuts"
          :key="item.label"
          type="button"
          class="profile__shortcut surface-card"
          @click="router.push(item.to)"
        >
          <IconSvg :name="item.icon" :size="20" />
          <span>{{ item.label }}</span>
        </button>
      </section>

      <section class="profile__pet surface-card">
        <div class="section-heading">
          <div>
            <p class="section-heading__meta">当前常用宠物</p>
            <h2 class="section-heading__title">{{ selectedPet?.name || '去创建档案' }}</h2>
          </div>
          <button type="button" class="section-link" @click="router.push('/pets')">管理</button>
        </div>
        <p v-if="selectedPet" class="profile__pet-copy">
          {{ selectedPet.breed }} · {{ selectedPet.age }} · {{ selectedPet.weight }}kg
        </p>
      </section>

      <section class="profile__member surface-card">
        <div>
          <p class="section-heading__meta">积分与权益</p>
          <h2 class="section-heading__title">{{ profile.points }} 积分</h2>
          <p>{{ profile.couponCount }} 张可用券 · 查看会员页获取完整权益展示</p>
        </div>
        <button type="button" class="button-secondary" @click="router.push('/member')">查看详情</button>
      </section>
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
.profile {
  padding-bottom: var(--space-6);
}

.profile__hero,
.profile__member,
.profile__pet {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5);
}

.profile__avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
}

.profile__copy {
  display: grid;
  gap: 6px;
}

.profile__copy p,
.profile__pet-copy,
.profile__member p {
  color: var(--color-text-soft);
}

.profile__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
  padding: var(--space-4);
}

.profile__stats article {
  display: grid;
  gap: 4px;
  justify-items: center;
}

.profile__stats strong {
  font-size: var(--text-2xl);
}

.profile__stats span {
  color: var(--color-text-soft);
  font-size: var(--text-sm);
}

.profile__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.profile__shortcut {
  display: grid;
  justify-items: center;
  gap: var(--space-2);
  padding: var(--space-4);
}

.profile__shortcut span {
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
}

.profile__pet,
.profile__member {
  justify-content: space-between;
}

.section-link {
  color: var(--color-primary-deep);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
}

.profile__state {
  padding: var(--space-5);
  color: var(--color-text-soft);
  text-align: center;
}
</style>
