<script setup>
import IconSvg from '@/components/IconSvg.vue'

defineProps({
  icon: {
    type: String,
    default: 'paw'
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  actionLabel: {
    type: String,
    default: ''
  }
})

defineEmits(['action'])
</script>

<template>
  <div class="empty-state surface-card">
    <div class="empty-state__icon">
      <IconSvg :name="icon" :size="28" />
    </div>
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
    <button
      v-if="actionLabel"
      type="button"
      class="button-primary empty-state__button"
      @click="$emit('action')"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>

<style scoped>
.empty-state {
  display: grid;
  justify-items: center;
  gap: var(--space-3);
  padding: var(--space-8) var(--space-5);
  text-align: center;
}

.empty-state__icon {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
  background: var(--color-primary-tint);
  color: var(--color-primary-deep);
}

.empty-state h3 {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
}

.empty-state p {
  max-width: 24ch;
  color: var(--color-text-soft);
  font-size: var(--text-sm);
}

.empty-state__button {
  min-width: 140px;
}
</style>
