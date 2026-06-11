<script setup>
defineProps({
  transparent: { type: Boolean, default: false }
})
</script>

<template>
  <div class="page-submit-bar">
    <div class="sticky-bar" :class="{ 'sticky-bar--transparent': transparent }">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.sticky-bar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin: 0 var(--page-padding);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-xl);
  background: color-mix(in srgb, var(--color-surface) 92%, transparent);
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.sticky-bar--transparent {
  border: none;
  background: none;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  padding: 0;
}
</style>
