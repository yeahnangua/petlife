<script setup>
import AppShell from '@/components/AppShell.vue'
</script>

<template>
  <AppShell>
    <router-view v-slot="{ Component, route }">
      <transition :name="route.meta.transition || 'fade-slide'" mode="out-in">
        <component :is="Component" :key="route.fullPath" />
      </transition>
    </router-view>
  </AppShell>
</template>

<style>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 220ms ease, transform 220ms ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
