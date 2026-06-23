<script setup>
import IconSvg from './IconSvg.vue'

defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, required: true }
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div class="chip-switch" role="tablist">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="tab"
      class="chip-switch__chip"
      :class="{ 'chip-switch__chip--active': modelValue === option.value }"
      :aria-selected="modelValue === option.value"
      @click="$emit('update:modelValue', option.value)"
    >
      <IconSvg v-if="option.icon" :name="option.icon" :size="15" :stroke="2" />
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped>
.chip-switch {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  border-radius: var(--radius-full);
  background: var(--color-surface-warm);
}

.chip-switch__chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 32px;
  padding: 0 var(--space-4);
  border-radius: var(--radius-full);
  color: var(--color-text-mute);
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  transition:
    background-color var(--dur-base) var(--ease-out),
    color var(--dur-base) var(--ease-out),
    box-shadow var(--dur-base) var(--ease-out),
    transform var(--dur-fast) var(--ease-spring);
}

.chip-switch__chip:active {
  transform: scale(0.95);
}

.chip-switch__chip--active {
  background: var(--color-primary-deep);
  color: var(--color-text-invert);
  box-shadow: var(--shadow-sm);
}
</style>
