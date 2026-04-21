<script setup>
import { ref } from 'vue'
import { uploadImage } from '@/api/upload'

const props = defineProps({
  modelValue: {
    type: [String, Array],
    default: ''
  },
  label: {
    type: String,
    default: '上传图片'
  },
  multiple: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])
const uploading = ref(false)
const error = ref('')

async function handleChange(event) {
  const files = Array.from(event.target.files || [])

  if (!files.length) {
    return
  }

  uploading.value = true
  error.value = ''

  try {
    const uploadedUrls = []

    for (const file of files) {
      const data = await uploadImage(file)
      uploadedUrls.push(data.file.url)
    }

    if (props.multiple) {
      emit('update:modelValue', [...(Array.isArray(props.modelValue) ? props.modelValue : []), ...uploadedUrls])
    } else {
      emit('update:modelValue', uploadedUrls[0] || '')
    }
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : '图片上传失败'
  } finally {
    uploading.value = false
    event.target.value = ''
  }
}
</script>

<template>
  <div class="upload-image-field">
    <label class="upload-image-field__label">
      <span>{{ label }}</span>
      <input type="file" accept="image/*" :multiple="multiple" @change="handleChange" />
    </label>
    <p v-if="uploading" class="upload-image-field__hint">上传中...</p>
    <p v-else-if="error" class="upload-image-field__hint is-error">{{ error }}</p>
    <div v-if="multiple && Array.isArray(modelValue) && modelValue.length" class="upload-image-field__list">
      <span v-for="item in modelValue" :key="item">{{ item }}</span>
    </div>
    <p v-else-if="!multiple && modelValue" class="upload-image-field__hint">{{ modelValue }}</p>
  </div>
</template>

<style scoped>
.upload-image-field {
  display: grid;
  gap: 8px;
}

.upload-image-field__label {
  display: grid;
  gap: 8px;
}

.upload-image-field__label input {
  min-height: 44px;
  padding: 10px 0;
}

.upload-image-field__hint,
.upload-image-field__list {
  color: #6d5e4e;
  font-size: 13px;
}

.upload-image-field__list {
  display: grid;
  gap: 6px;
}

.upload-image-field__hint.is-error {
  color: #b15b38;
}
</style>
