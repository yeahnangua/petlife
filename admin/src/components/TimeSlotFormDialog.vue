<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  initialValue: {
    type: Object,
    default: null
  },
  submitting: Boolean
})

const emit = defineEmits(['update:modelValue', 'submit'])

const form = reactive({
  label: '',
  start_time: '10:00',
  end_time: '11:00',
  capacity: 1,
  sort_order: 0,
  is_enabled: true
})

function syncForm(value = null) {
  form.label = value?.label ?? ''
  form.start_time = value?.start_time ?? '10:00'
  form.end_time = value?.end_time ?? '11:00'
  form.capacity = value?.capacity ?? 1
  form.sort_order = value?.sort_order ?? 0
  form.is_enabled = value?.is_enabled ?? true
}

watch(
  () => [props.modelValue, props.initialValue],
  ([open, value]) => {
    if (open) {
      syncForm(value)
    }
  },
  { immediate: true }
)

function closeDialog() {
  emit('update:modelValue', false)
}

function submitForm() {
  emit('submit', {
    label: form.label.trim(),
    start_time: form.start_time,
    end_time: form.end_time,
    capacity: Number(form.capacity),
    sort_order: Number(form.sort_order),
    is_enabled: Boolean(form.is_enabled)
  })
}
</script>

<template>
  <div v-if="modelValue" class="dialog-backdrop" @click.self="closeDialog">
    <section class="dialog-card">
      <div class="dialog-card__header">
        <h3>{{ initialValue?.id ? '编辑时段' : '新增时段' }}</h3>
        <button type="button" class="dialog-card__close" @click="closeDialog">关闭</button>
      </div>
      <div class="dialog-card__grid">
        <label>
          <span>时段标签</span>
          <input v-model="form.label" />
        </label>
        <label>
          <span>开始时间</span>
          <input v-model="form.start_time" type="time" />
        </label>
        <label>
          <span>结束时间</span>
          <input v-model="form.end_time" type="time" />
        </label>
        <label>
          <span>容量</span>
          <input v-model="form.capacity" type="number" min="1" />
        </label>
        <label>
          <span>排序</span>
          <input v-model="form.sort_order" type="number" min="0" />
        </label>
        <label class="dialog-card__switch">
          <input v-model="form.is_enabled" type="checkbox" />
          <span>启用时段</span>
        </label>
      </div>
      <footer class="dialog-card__footer">
        <button type="button" class="button-secondary" @click="closeDialog">取消</button>
        <button type="button" class="button-primary" :disabled="submitting" @click="submitForm">
          {{ submitting ? '保存中...' : '保存时段' }}
        </button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.dialog-backdrop {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(32, 24, 16, 0.45);
}

.dialog-card {
  width: min(100%, 640px);
  display: grid;
  gap: 20px;
  padding: 24px;
  border-radius: 24px;
  background: #fffdfa;
}

.dialog-card__header,
.dialog-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.dialog-card__grid {
  display: grid;
  gap: 16px;
}

.dialog-card__grid label {
  display: grid;
  gap: 8px;
}

.dialog-card__grid input {
  width: 100%;
  padding: 12px;
  border: 1px solid #d8cbbd;
  border-radius: 14px;
}

.dialog-card__switch {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dialog-card__close,
.button-secondary,
.button-primary {
  min-height: 40px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
}

.dialog-card__close,
.button-secondary {
  background: #eadfd1;
}

.button-primary {
  background: #29211b;
  color: #fff;
}
</style>
