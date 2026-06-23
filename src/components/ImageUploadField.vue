<script setup>
import { ref } from 'vue'
import { uploadImage } from '@/api/upload'
import IconSvg from './IconSvg.vue'

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
    default: '支持 JPG / PNG'
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
  <div class="upload-field">
    <span class="upload-field__label">{{ label }}</span>
    <label class="upload-field__tile" :class="{ 'upload-field__tile--filled': modelValue }">
      <input type="file" accept="image/*" @change="handleChange" />
      <img v-if="modelValue" :src="modelValue" :alt="label" />
      <span v-else class="upload-field__placeholder">
        <IconSvg name="camera" :size="22" :stroke="1.6" />
        <i>{{ hint }}</i>
      </span>
      <span class="upload-field__action">
        <template v-if="uploading">上传中…</template>
        <template v-else-if="modelValue">更换</template>
        <template v-else>选择图片</template>
      </span>
    </label>
    <p v-if="error" class="upload-field__error">{{ error }}</p>
  </div>
</template>

<style scoped>
.upload-field {
  display: grid;
  gap: var(--space-2);
}

.upload-field__label {
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  color: var(--color-text-soft);
  letter-spacing: var(--tracking-wide);
}

.upload-field__tile {
  position: relative;
  display: grid;
  place-items: center;
  width: 108px;
  height: 108px;
  border: 1.5px dashed var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-soft);
  overflow: hidden;
  cursor: pointer;
  transition: border-color var(--dur-base) var(--ease-out);
}

.upload-field__tile:active {
  border-color: var(--color-primary);
}

.upload-field__tile--filled {
  border-style: solid;
  border-color: var(--color-border-soft);
}

.upload-field__tile input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.upload-field__tile img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-field__placeholder {
  display: grid;
  justify-items: center;
  gap: var(--space-1);
  color: var(--color-text-tint);
}

.upload-field__placeholder i {
  font-style: normal;
  font-size: var(--text-2xs);
}

.upload-field__action {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  padding: 4px 0;
  background: rgba(35, 33, 28, 0.55);
  color: var(--color-text-invert);
  font-size: var(--text-2xs);
  font-weight: var(--weight-semibold);
  text-align: center;
  backdrop-filter: blur(3px);
  pointer-events: none;
}

.upload-field__error {
  color: var(--color-danger);
  font-size: var(--text-xs);
}
</style>
