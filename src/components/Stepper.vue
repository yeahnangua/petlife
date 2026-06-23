<script setup>
import IconSvg from './IconSvg.vue'

const props = defineProps({
  modelValue: { type: Number, default: 1 },
  min: { type: Number, default: 1 },
  max: { type: Number, default: 99 }
})

const emit = defineEmits(['update:modelValue'])

function step(delta) {
  const next = props.modelValue + delta
  if (next < props.min || next > props.max) {
    return
  }
  emit('update:modelValue', next)
}
</script>

<template>
  <div class="stepper">
    <button
      type="button"
      class="stepper__btn"
      :disabled="modelValue <= min"
      aria-label="减少数量"
      @click="step(-1)"
    >
      <IconSvg name="minus" :size="14" :stroke="2.2" />
    </button>
    <span class="stepper__value">{{ modelValue }}</span>
    <button
      type="button"
      class="stepper__btn"
      :disabled="modelValue >= max"
      aria-label="增加数量"
      @click="step(1)"
    >
      <IconSvg name="plus" :size="14" :stroke="2.2" />
    </button>
  </div>
</template>

<style scoped>
.stepper {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border-radius: var(--radius-full);
  background: var(--color-surface-warm);
}

.stepper__btn {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: var(--radius-full);
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-xs);
  transition: transform var(--dur-fast) var(--ease-spring), opacity var(--dur-fast) var(--ease-out);
}

.stepper__btn:active {
  transform: scale(0.88);
}

.stepper__btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  transform: none;
}

.stepper__value {
  min-width: 28px;
  text-align: center;
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
  font-variant-numeric: tabular-nums;
}
</style>
