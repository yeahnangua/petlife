<script setup>
defineProps({
  variant: { type: String, default: 'text' },
  lines: { type: Number, default: 3 }
})
</script>

<template>
  <div class="skeleton" aria-hidden="true">
    <template v-if="variant === 'text'">
      <div v-for="line in lines" :key="line" class="skeleton__bar" :style="{ width: line === lines ? '62%' : '100%' }" />
    </template>
    <div v-else-if="variant === 'card'" class="skeleton__card">
      <div class="skeleton__image" />
      <div class="skeleton__bar" style="width: 80%" />
      <div class="skeleton__bar" style="width: 50%" />
    </div>
    <div v-else-if="variant === 'avatar'" class="skeleton__avatar" />
    <div v-else-if="variant === 'image'" class="skeleton__image" />
  </div>
</template>

<style scoped>
.skeleton {
  display: grid;
  gap: var(--space-2);
}

.skeleton__bar,
.skeleton__image,
.skeleton__avatar {
  background: linear-gradient(
    100deg,
    var(--color-surface-warm) 40%,
    var(--color-border-soft) 50%,
    var(--color-surface-warm) 60%
  );
  background-size: 200% 100%;
  animation: petlife-shimmer 1.4s ease-in-out infinite;
}

.skeleton__bar {
  height: 13px;
  border-radius: var(--radius-xs);
}

.skeleton__image {
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-md);
}

.skeleton__avatar {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-full);
}

.skeleton__card {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-3);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}
</style>
