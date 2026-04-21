<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import IconSvg from './IconSvg.vue'

const route = useRoute()

const tabs = [
  { id: 'home', label: '首页', icon: 'home', to: '/' },
  { id: 'category', label: '分类', icon: 'category', to: '/category' },
  { id: 'service', label: '服务', icon: 'service', to: '/service' },
  { id: 'orders', label: '订单', icon: 'order', to: '/orders' },
  { id: 'profile', label: '我的', icon: 'user', to: '/profile' }
]

const currentTab = computed(() => route.meta.tab || '')
</script>

<template>
  <nav class="tabbar">
    <div class="tabbar__inner">
      <RouterLink
        v-for="tab in tabs"
        :key="tab.id"
        :to="tab.to"
        class="tabbar__item"
        :class="{ 'is-active': currentTab === tab.id }"
      >
        <IconSvg :name="tab.icon" :size="20" />
        <span>{{ tab.label }}</span>
      </RouterLink>
    </div>
  </nav>
</template>

<style scoped>
.tabbar {
  position: sticky;
  bottom: 0;
  z-index: var(--z-sticky);
  padding: 0 var(--space-4) calc(var(--safe-bottom) + var(--space-3));
}

.tabbar__inner {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--space-2);
  padding: var(--space-2);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: calc(var(--radius-xl) + 6px);
  background: rgba(250, 245, 236, 0.92);
  box-shadow: var(--shadow-float);
  backdrop-filter: blur(24px);
}

.tabbar__item {
  display: grid;
  justify-items: center;
  gap: 4px;
  padding: var(--space-2) var(--space-1);
  color: var(--color-text-mute);
  font-size: var(--text-xs);
  transition: color var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out);
}

.tabbar__item.is-active {
  color: var(--color-primary-deep);
  transform: translateY(-1px);
}
</style>
