<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: { type: [Number, String], default: 0 },
  size: { type: String, default: 'md' },
  original: { type: [Number, String], default: null },
  prefix: { type: String, default: '¥' }
})

const display = computed(() => {
  const amount = Number(props.value || 0)
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(1)
})
</script>

<template>
  <span class="price" :class="`price--${size}`">
    <span class="price__prefix">{{ prefix }}</span>
    <span class="price__value font-display">{{ display }}</span>
    <del v-if="original !== null && Number(original) > Number(value)" class="price__original">
      {{ prefix }}{{ Number(original) }}
    </del>
  </span>
</template>

<style scoped>
.price {
  display: inline-flex;
  align-items: baseline;
  gap: 1px;
  color: var(--color-coral);
  line-height: 1;
}

.price__prefix {
  font-size: 0.62em;
  font-weight: var(--weight-semibold);
}

.price__value {
  font-weight: var(--weight-semibold);
  font-variant-numeric: lining-nums;
  letter-spacing: -0.01em;
}

.price__original {
  margin-left: var(--space-2);
  color: var(--color-text-tint);
  font-size: 0.56em;
  font-weight: var(--weight-regular);
}

.price--sm .price__value { font-size: var(--text-md); }
.price--md .price__value { font-size: var(--text-xl); }
.price--lg .price__value { font-size: var(--text-3xl); }
.price--xl .price__value { font-size: var(--text-4xl); }
</style>
