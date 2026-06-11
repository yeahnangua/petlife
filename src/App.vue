<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import TopBar from '@/components/TopBar.vue'
import TabBar from '@/components/TabBar.vue'

const route = useRoute()

const isTabRoute = computed(() => Boolean(route.meta.tab))
const pageTitle = computed(() => route.meta.title || 'PetLife')
const shellBottomOffset = computed(() =>
  isTabRoute.value ? 'calc(var(--tabbar-height) + var(--safe-bottom))' : 'var(--safe-bottom)'
)
</script>

<template>
  <div class="app-stage">
    <div class="app" :style="{ '--shell-bottom-offset': shellBottomOffset }">
      <TopBar v-if="!isTabRoute" :title="pageTitle" />
      <main class="app__viewport">
        <router-view v-slot="{ Component }">
          <transition :name="route.meta.transition || 'fade-slide'" mode="out-in">
            <component :is="Component" :key="route.fullPath" />
          </transition>
        </router-view>
      </main>
      <TabBar v-if="isTabRoute" />
    </div>
  </div>
</template>

<style>
.app-stage {
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--color-bg);
}

.app {
  position: relative;
  width: 100%;
  max-width: var(--mobile-max);
  min-height: 100vh;
  min-height: 100dvh;
  margin: 0 auto;
  background: var(--color-bg);
}

/* 桌面浏览时：限宽居中，两侧素雅品牌底 */
@media (min-width: 480px) {
  .app-stage {
    background:
      radial-gradient(900px 420px at 18% -8%, rgba(74, 107, 87, 0.10), transparent 64%),
      radial-gradient(720px 380px at 86% 4%, rgba(217, 113, 78, 0.07), transparent 60%),
      var(--color-bg-deep);
  }

  .app {
    box-shadow: 0 0 0 1px var(--color-border-soft), 0 18px 60px rgba(35, 33, 28, 0.10);
  }
}

.app__viewport {
  min-height: calc(100dvh - var(--shell-bottom-offset, 0px));
  padding-bottom: calc(var(--shell-bottom-offset, 0px) + var(--space-6));
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
