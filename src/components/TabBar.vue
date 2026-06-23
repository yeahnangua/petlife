<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAccountStore } from '@/stores/account'
import IconSvg from './IconSvg.vue'

const route = useRoute()
const accountStore = useAccountStore()

const tabs = [
  { key: 'home', label: '首页', icon: 'home', to: '/' },
  { key: 'category', label: '分类', icon: 'category', to: '/category' },
  { key: 'service', label: '服务', icon: 'service', to: '/service' },
  { key: 'orders', label: '订单', icon: 'order', to: '/orders' },
  { key: 'profile', label: '我的', icon: 'user', to: '/profile' }
]

const activeTab = computed(() => route.meta.tab)
const pendingCount = computed(
  () => accountStore.pendingShipmentCount + accountStore.pendingServiceCount
)
</script>

<template>
  <nav class="tab-bar" aria-label="主导航">
    <router-link
      v-for="tab in tabs"
      :key="tab.key"
      :to="tab.to"
      class="tab-bar__item"
      :class="{ 'tab-bar__item--active': activeTab === tab.key }"
    >
      <span class="tab-bar__icon">
        <IconSvg :name="tab.icon" :size="21" :stroke="activeTab === tab.key ? 2 : 1.7" />
        <i v-if="tab.key === 'orders' && pendingCount > 0" class="tab-bar__dot" />
      </span>
      <span class="tab-bar__label">{{ tab.label }}</span>
    </router-link>
  </nav>
</template>

<style scoped>
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: var(--z-sticky);
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  width: 100%;
  max-width: var(--mobile-max);
  height: calc(var(--tabbar-height) + var(--safe-bottom));
  padding: var(--space-2) var(--space-3) calc(var(--space-2) + var(--safe-bottom));
  background: var(--color-primary-deep);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  box-shadow: 0 -8px 28px rgba(40, 64, 47, 0.18);
}

.tab-bar__item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  border-radius: var(--radius-md);
  color: rgba(247, 244, 236, 0.62);
  transition: color var(--dur-base) var(--ease-out);
}

.tab-bar__item--active {
  color: var(--color-text-invert);
}

.tab-bar__icon {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 26px;
  border-radius: var(--radius-full);
  transition: background-color var(--dur-base) var(--ease-out), transform var(--dur-fast) var(--ease-spring);
}

.tab-bar__item--active .tab-bar__icon {
  background: rgba(247, 244, 236, 0.16);
  transform: translateY(-1px);
}

.tab-bar__item:active .tab-bar__icon {
  transform: scale(0.9);
}

.tab-bar__dot {
  position: absolute;
  top: 1px;
  right: 3px;
  width: 7px;
  height: 7px;
  border-radius: var(--radius-full);
  background: var(--color-coral);
  box-shadow: 0 0 0 2px var(--color-primary-deep);
}

.tab-bar__label {
  font-size: var(--text-2xs);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-wide);
}
</style>
