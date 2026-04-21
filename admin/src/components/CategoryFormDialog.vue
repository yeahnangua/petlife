<script setup>
import { reactive, watch } from 'vue'
import UploadImageField from '@/components/UploadImageField.vue'
import { petTypeOptions } from '@/utils/enumLabels'

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
  slug: '',
  pet_type: 'cat',
  sort_order: 0,
  cover_url: '',
  is_enabled: true
})

function syncForm(value = null) {
  form.name = value?.name ?? ''
  form.slug = value?.slug ?? ''
  form.pet_type = value?.pet_type ?? 'cat'
  form.sort_order = value?.sort_order ?? 0
  form.cover_url = value?.cover_url ?? ''
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
    name: form.name.trim(),
    slug: form.slug.trim(),
    pet_type: form.pet_type,
    sort_order: Number(form.sort_order),
    cover_url: form.cover_url.trim(),
    is_enabled: Boolean(form.is_enabled)
  })
}
</script>

<template>
  <div v-if="modelValue" class="dialog-backdrop" @click.self="closeDialog">
    <section class="dialog-card">
      <div class="dialog-card__header">
        <h3>{{ initialValue?.id ? '编辑分类' : '新增分类' }}</h3>
        <button type="button" class="dialog-card__close" @click="closeDialog">关闭</button>
      </div>
      <div class="dialog-card__grid">
        <label>
          <span>分类名称</span>
          <input v-model="form.name" />
        </label>
        <label>
          <span>分类标识</span>
          <input v-model="form.slug" />
        </label>
        <label>
          <span>宠物类型</span>
          <select v-model="form.pet_type">
            <option v-for="item in petTypeOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
        </label>
        <label>
          <span>排序</span>
          <input v-model="form.sort_order" type="number" min="0" />
        </label>
        <label class="dialog-card__switch">
          <input v-model="form.is_enabled" type="checkbox" />
          <span>启用分类</span>
        </label>
        <UploadImageField v-model="form.cover_url" label="分类封面" />
      </div>
      <footer class="dialog-card__footer">
        <button type="button" class="button-secondary" @click="closeDialog">取消</button>
        <button type="button" class="button-primary" :disabled="submitting" @click="submitForm">
          {{ submitting ? '保存中...' : '保存分类' }}
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
  width: min(100%, 680px);
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
.dialog-card__grid select {
  min-height: 44px;
  padding: 0 12px;
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
