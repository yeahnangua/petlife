<script setup>
defineProps({
  eyebrow: { type: String, default: '' },
  title: { type: String, required: true },
  more: { type: String, default: '' }
})

defineEmits(['more'])
</script>

<template>
  <header class="section-head">
    <div class="section-head__text">
      <p v-if="eyebrow" class="section-head__eyebrow">{{ eyebrow }}</p>
      <h2 class="section-head__title font-display">{{ title }}</h2>
    </div>
    <button v-if="more" type="button" class="section-head__more" @click="$emit('more')">
      {{ more }}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7" /></svg>
    </button>
  </header>
</template>

<style scoped>
.section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-3);
}

.section-head__eyebrow {
  margin-bottom: 2px;
  color: var(--color-primary);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
}

.section-head__title {
  font-size: var(--text-2xl);
  font-weight: var(--weight-semibold);
  color: var(--color-text);
}

.section-head__more {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding-bottom: 3px;
  color: var(--color-text-mute);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  transition: color var(--dur-fast) var(--ease-out);
}

.section-head__more:active {
  color: var(--color-primary-deep);
}
</style>
