<script setup>
import { ref } from 'vue'
import { uploadImage } from '@/api/upload'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: '上传图片'
  },
  hint: {
    type: String,
    default: '支持 JPG / PNG，上传后会自动保存到当前档案。'
  }
})

const emit = defineEmits(['update:modelValue'])
const uploading = ref(false)
const error = ref('')

async function handleChange(event) {
  const file = event.target.files?.[0]

  if (!file) {
    return
  }

  uploading.value = true
  error.value = ''

  try {
    const data = await uploadImage(file)
    emit('update:modelValue', data.file.url || '')
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : '图片上传失败'
  } finally {
    uploading.value = false
    event.target.value = ''
  }
}
</script>

<template>
  <div class="image-upload-field">
    <div class="image-upload-field__header">
      <span>{{ label }}</span>
      <label class="image-upload-field__trigger">
        <input type="file" accept="image/*" @change="handleChange" />
        <span>{{ uploading ? '上传中...' : (modelValue ? '重新上传' : '选择图片') }}</span>
      </label>
    </div>

    <div v-if="modelValue" class="image-upload-field__preview">
      <img :src="modelValue" :alt="label" />
      <p class="image-upload-field__url">{{ modelValue }}</p>
    </div>
    <p v-else class="image-upload-field__hint">{{ hint }}</p>

    <p v-if="error" class="image-upload-field__hint is-error">{{ error }}</p>
  </div>
</template>

<style scoped>
.image-upload-field {
  display: grid;
  gap: var(--space-3);
}

.image-upload-field__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.image-upload-field__trigger {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.72);
  color: var(--color-primary-deep);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  overflow: hidden;
}

.image-upload-field__trigger input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.image-upload-field__preview {
  display: grid;
  gap: var(--space-3);
}

.image-upload-field__preview img {
  width: 96px;
  height: 96px;
  border-radius: var(--radius-xl);
  object-fit: cover;
  background: var(--color-surface-soft);
}

.image-upload-field__hint,
.image-upload-field__url {
  color: var(--color-text-soft);
  font-size: var(--text-sm);
}

.image-upload-field__url {
  overflow-wrap: anywhere;
}

.image-upload-field__hint.is-error {
  color: var(--color-coral);
}
</style>
