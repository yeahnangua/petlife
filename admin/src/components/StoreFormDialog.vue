<script setup>
import { reactive, watch } from 'vue'
import UploadImageField from '@/components/UploadImageField.vue'
import { publishStatusOptions } from '@/utils/enumLabels'

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
  name: '',
  phone: '',
  address: '',
  business_hours: '',
  cover_url: '',
  status: 'active'
})

function syncForm(value = null) {
  form.name = value?.name ?? ''
  form.phone = value?.phone ?? ''
  form.address = value?.address ?? ''
  form.business_hours = value?.business_hours ?? ''
  form.cover_url = value?.cover_url ?? ''
  form.status = value?.status ?? 'active'
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
    name: form.name.trim(),
    phone: form.phone.trim(),
    address: form.address.trim(),
    business_hours: form.business_hours.trim(),
    cover_url: form.cover_url.trim(),
    status: form.status
  })
}
</script>

<template>
  <div v-if="modelValue" class="dialog-backdrop" @click.self="closeDialog">
    <section class="dialog-card">
      <div class="dialog-card__header">
        <h3>{{ initialValue?.id ? '编辑门店' : '新增门店' }}</h3>
        <button type="button" class="dialog-card__close" @click="closeDialog">关闭</button>
      </div>
      <div class="dialog-card__grid">
        <label>
          <span>门店名称</span>
          <input v-model="form.name" />
        </label>
        <label>
          <span>联系电话</span>
          <input v-model="form.phone" />
        </label>
        <label>
          <span>门店地址</span>
          <textarea v-model="form.address" rows="2" />
        </label>
        <label>
          <span>营业时间</span>
          <input v-model="form.business_hours" />
        </label>
        <label>
          <span>状态</span>
          <select v-model="form.status">
            <option v-for="item in publishStatusOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
        </label>
        <UploadImageField v-model="form.cover_url" label="门店封面" />
      </div>
      <footer class="dialog-card__footer">
        <button type="button" class="button-secondary" @click="closeDialog">取消</button>
        <button type="button" class="button-primary" :disabled="submitting" @click="submitForm">
          {{ submitting ? '保存中...' : '保存门店' }}
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
  align-items: start;
  justify-items: center;
  padding: 24px;
  background: rgba(32, 24, 16, 0.45);
  overflow-y: auto;
  overscroll-behavior: contain;
}

.dialog-card {
  width: min(100%, 720px);
  display: grid;
  gap: 20px;
  padding: 24px;
  border-radius: 24px;
  background: #fffdfa;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
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

.dialog-card__grid input,
.dialog-card__grid select,
.dialog-card__grid textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #d8cbbd;
  border-radius: 14px;
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
