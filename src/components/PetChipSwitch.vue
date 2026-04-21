<script setup>
const props = defineProps({
  modelValue: {
    type: String,
    default: 'cat'
  },
  options: {
    type: Array,
    default: () => ([
      { id: 'cat', label: '猫咪' },
      { id: 'dog', label: '狗狗' }
    ])
  }
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div class="pet-switch">
    <button
      v-for="option in options"
      :key="option.id"
      type="button"
      class="pet-switch__chip"
      :class="{ 'is-active': modelValue === option.id }"
      @click="emit('update:modelValue', option.id)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped>
.pet-switch {
  display: inline-grid;
  grid-auto-flow: column;
  gap: var(--space-2);
  padding: 6px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.7);
  box-shadow: var(--shadow-sm);
}

.pet-switch__chip {
  min-width: 72px;
  min-height: 36px;
  padding: 0 var(--space-4);
  border-radius: var(--radius-full);
  color: var(--color-text-mute);
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
  transition:
    color var(--dur-base) var(--ease-out),
    background-color var(--dur-base) var(--ease-out),
    transform var(--dur-base) var(--ease-out);
}

.pet-switch__chip.is-active {
  background: var(--color-primary-deep);
  color: var(--color-text-invert);
  transform: translateY(-1px);
}
</style>
