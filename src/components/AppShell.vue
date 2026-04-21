<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BottomTabBar from './BottomTabBar.vue'
import PageHeader from './PageHeader.vue'

const route = useRoute()

const title = computed(() => route.meta.title || 'PetLife')
const showTabBar = computed(() => Boolean(route.meta.tab))
const shellBottomOffset = computed(() =>
  showTabBar.value ? 'calc(var(--tabbar-height) + var(--safe-bottom))' : 'var(--safe-bottom)'
)
</script>

<template>
  <div class="app-shell">
    <div class="app-shell__phone" :style="{ '--shell-bottom-offset': shellBottomOffset }">
      <PageHeader :title="title" />
      <main class="app-shell__viewport">
        <slot />
      </main>
      <BottomTabBar v-if="showTabBar" />
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  min-height: 100dvh;
  padding: var(--space-5) var(--space-4);
  background:
    radial-gradient(circle at top left, rgba(217, 119, 87, 0.18), transparent 24%),
    radial-gradient(circle at top right, rgba(106, 133, 114, 0.18), transparent 28%),
    linear-gradient(180deg, #f6f1e7, #efe6d8 56%, #f5efe7);
}

.app-shell__phone {
  --shell-bottom-offset: var(--safe-bottom);
  width: 100%;
  max-width: var(--mobile-max);
  min-height: calc(100vh - var(--space-10));
  min-height: calc(100dvh - var(--space-10));
  margin: 0 auto;
  border: 1px solid rgba(255, 255, 255, 0.75);
  border-radius: 36px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.76), rgba(251, 247, 238, 0.96)),
    var(--color-bg);
  box-shadow: var(--shadow-lg);
  overflow: clip;
}

.app-shell__viewport {
  min-height: calc(100dvh - 204px);
  padding-bottom: var(--space-6);
}
</style>
