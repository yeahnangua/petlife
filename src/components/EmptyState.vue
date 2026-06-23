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
  <div class="empty-state">
    <div class="empty-state__figure">
      <i class="empty-state__ring" />
      <span class="empty-state__icon">
        <IconSvg :name="icon" :size="26" :stroke="1.6" />
      </span>
    </div>
    <h3 class="empty-state__title">{{ title }}</h3>
    <p v-if="description" class="empty-state__desc">{{ description }}</p>
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
  padding: var(--space-10) var(--space-5);
  text-align: center;
  animation: fade-up var(--dur-slow) var(--ease-out) both;
}

.empty-state__figure {
  position: relative;
  display: grid;
  place-items: center;
  width: 76px;
  height: 76px;
  margin-bottom: var(--space-1);
}

.empty-state__ring {
  position: absolute;
  inset: 0;
  border: 1.5px dashed var(--color-border);
  border-radius: var(--radius-full);
}

.empty-state__icon {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
  background: var(--color-primary-tint);
  color: var(--color-primary);
}

.empty-state__title {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
}

.empty-state__desc {
  max-width: 26ch;
  color: var(--color-text-mute);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

.empty-state__button {
  min-width: 148px;
  margin-top: var(--space-2);
}
</style>
