<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, default: '' },
  label: { type: String, default: '' }
})

const TONE_MAP = {
  pendingPayment: 'warning',
  pendingShipment: 'warning',
  pendingService: 'warning',
  pendingReceipt: 'info',
  upcoming: 'info',
  inService: 'info',
  completed: 'success',
  cancelled: 'neutral',
  inStock: 'success',
  soldOut: 'danger',
  active: 'success',
  inactive: 'neutral'
}

const tone = computed(() => TONE_MAP[props.status] || 'neutral')
const text = computed(() => props.label || props.status)
</script>

<template>
  <span class="status-badge" :class="`status-badge--${tone}`">
    <i class="status-badge__dot" />
    {{ text }}
  </span>
</template>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 24px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-wide);
}

.status-badge__dot {
  width: 5px;
  height: 5px;
  border-radius: var(--radius-full);
  background: currentColor;
}

.status-badge--warning {
  background: var(--color-warning-soft);
  color: #8C6A23;
}

.status-badge--info {
  background: var(--color-info-soft);
  color: #4E6B80;
}

.status-badge--success {
  background: var(--color-success-soft);
  color: var(--color-success);
}

.status-badge--danger {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}

.status-badge--neutral {
  background: var(--color-surface-warm);
  color: var(--color-text-mute);
}
</style>
