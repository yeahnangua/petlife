<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: ''
  }
})

const tone = computed(() => {
  if (props.status === 'completed') {
    return 'is-success'
  }

  if (props.status === 'cancelled' || props.status === 'inactive') {
    return 'is-danger'
  }

  return 'is-pending'
})
</script>

<template>
  <span class="status-tag" :class="tone">{{ label || status }}</span>
</template>

<style scoped>
.status-tag {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 13px;
}

.status-tag.is-pending {
  background: #efe3d3;
  color: #8c5d2e;
}

.status-tag.is-success {
  background: #dcebd6;
  color: #45663a;
}

.status-tag.is-danger {
  background: #f1d9d2;
  color: #a55541;
}
</style>
