<script setup>
import { computed, ref } from 'vue'
import { uploadImage, uploadImageFromUrl } from '@/api/upload'

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
const fileInput = ref(null)
const showDialog = ref(false)
const dialogMode = ref('choices')
const sourceUrl = ref('')
const uploading = ref(false)
const error = ref('')

const imageList = computed(() => {
  if (props.multiple) {
    return Array.isArray(props.modelValue) ? props.modelValue : []
  }

  return props.modelValue ? [props.modelValue] : []
})

const actionLabel = computed(() => {
  if (props.multiple) {
    return imageList.value.length ? '继续添加图片' : '添加图片'
  }

  return props.modelValue ? '更改图片' : '设置图片'
})

function openDialog() {
  if (uploading.value) {
    return
  }

  error.value = ''
  sourceUrl.value = ''
  dialogMode.value = 'choices'
  showDialog.value = true
}

function closeDialog() {
  if (uploading.value) {
    return
  }

  showDialog.value = false
}

function applyUploadedUrls(urls) {
  const cleanUrls = urls.filter(Boolean)

  if (!cleanUrls.length) {
    return
  }

  if (props.multiple) {
    emit('update:modelValue', [...imageList.value, ...cleanUrls])
  } else {
    emit('update:modelValue', cleanUrls[0])
  }

  showDialog.value = false
}

function removeImage(index) {
  if (!props.multiple || uploading.value) {
    return
  }

  emit('update:modelValue', imageList.value.filter((_item, itemIndex) => itemIndex !== index))
}

async function uploadFiles(files) {
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

    applyUploadedUrls(uploadedUrls)
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : '图片上传失败'
  } finally {
    uploading.value = false
  }
}

async function handleChange(event) {
  const files = Array.from(event.target.files || [])
  await uploadFiles(files)
  event.target.value = ''
}

function triggerLocalImport() {
  error.value = ''
  fileInput.value?.click()
}

function showUrlImport() {
  error.value = ''
  dialogMode.value = 'url'
}

async function importFromUrl() {
  const trimmedUrl = sourceUrl.value.trim()

  if (!trimmedUrl) {
    error.value = '请输入图片链接'
    return
  }

  uploading.value = true
  error.value = ''

  try {
    const data = await uploadImageFromUrl(trimmedUrl)
    applyUploadedUrls([data.file.url])
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : '图片链接导入失败'
  } finally {
    uploading.value = false
  }
}

function getClipboardFileName(mimeType) {
  const extension = mimeType === 'image/jpeg' ? 'jpg' : mimeType.split('/')[1] || 'png'
  return `clipboard-image.${extension.replace('svg+xml', 'svg')}`
}

async function importFromClipboard() {
  if (!navigator.clipboard?.read) {
    error.value = '当前浏览器不支持读取剪切板图片'
    return
  }

  uploading.value = true
  error.value = ''

  try {
    const items = await navigator.clipboard.read()

    for (const item of items) {
      const imageType = item.types.find((type) => type.startsWith('image/'))

      if (!imageType) {
        continue
      }

      const blob = await item.getType(imageType)
      const file = new File([blob], getClipboardFileName(blob.type || imageType), {
        type: blob.type || imageType
      })
      await uploadFiles([file])
      return
    }

    error.value = '剪切板里没有图片'
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : '剪切板图片导入失败'
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="upload-image-field">
    <div class="upload-image-field__topline">
      <span class="upload-image-field__title">{{ label }}</span>
      <button type="button" class="upload-image-field__trigger" @click="openDialog">
        {{ actionLabel }}
      </button>
    </div>

    <input
      ref="fileInput"
      class="upload-image-field__file"
      type="file"
      accept="image/*"
      :multiple="multiple"
      @change="handleChange"
    />

    <div v-if="imageList.length" class="upload-image-field__preview-list">
      <figure
        v-for="(item, index) in imageList"
        :key="`${item}-${index}`"
        class="upload-image-field__preview"
      >
        <img :src="item" :alt="label" loading="lazy" />
        <figcaption>{{ item }}</figcaption>
        <button
          v-if="multiple"
          type="button"
          class="upload-image-field__remove"
          :data-test="`remove-image-${item}`"
          :disabled="uploading"
          @click="removeImage(index)"
        >
          删除
        </button>
      </figure>
    </div>
    <p v-else class="upload-image-field__hint">图片会保存到本地 uploads 目录</p>
    <p v-if="error && !showDialog" class="upload-image-field__hint is-error">{{ error }}</p>

    <div v-if="showDialog" class="upload-image-field__backdrop" @click.self="closeDialog">
      <section class="upload-image-field__dialog" role="dialog" aria-modal="true" :aria-label="label">
        <header class="upload-image-field__dialog-header">
          <h4>{{ label }}</h4>
          <button type="button" class="upload-image-field__close" :disabled="uploading" @click="closeDialog">
            关闭
          </button>
        </header>

        <div v-if="dialogMode === 'choices'" class="upload-image-field__source-grid">
          <button type="button" data-test="local-image-import" @click="triggerLocalImport">
            <strong>本地导入</strong>
            <span>从电脑选择图片文件</span>
          </button>
          <button type="button" data-test="open-url-import" @click="showUrlImport">
            <strong>从链接导入</strong>
            <span>服务端下载并保存为本地文件</span>
          </button>
          <button type="button" data-test="import-clipboard-image" @click="importFromClipboard">
            <strong>从剪切板导入</strong>
            <span>读取剪切板中的图片</span>
          </button>
        </div>

        <form v-else class="upload-image-field__url-form" @submit.prevent="importFromUrl">
          <label>
            <span>图片链接</span>
            <input
              v-model="sourceUrl"
              data-test="image-url-input"
              type="url"
              placeholder="https://example.com/product.jpg"
            />
          </label>
          <div class="upload-image-field__dialog-actions">
            <button type="button" class="button-secondary" :disabled="uploading" @click="dialogMode = 'choices'">
              返回
            </button>
            <button
              type="submit"
              class="button-primary"
              data-test="submit-url-import"
              :disabled="uploading"
            >
              导入链接图片
            </button>
          </div>
        </form>

        <p v-if="uploading" class="upload-image-field__hint">上传中...</p>
        <p v-else-if="error" class="upload-image-field__hint is-error">{{ error }}</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.upload-image-field {
  display: grid;
  gap: 10px;
}

.upload-image-field__topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.upload-image-field__title {
  color: #2f281f;
  font-size: 14px;
  font-weight: 700;
}

.upload-image-field__trigger,
.upload-image-field__close,
.upload-image-field__source-grid button,
.upload-image-field__dialog-actions button {
  border: 0;
  cursor: pointer;
  font: inherit;
}

.upload-image-field__trigger {
  min-height: 36px;
  padding: 0 14px;
  border-radius: 10px;
  background: #2f281f;
  color: #fffdfa;
  font-size: 13px;
  font-weight: 700;
}

.upload-image-field__file {
  display: none;
}

.upload-image-field__preview-list {
  display: grid;
  gap: 8px;
}

.upload-image-field__preview {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  margin: 0;
  padding: 8px;
  border: 1px solid #eadfcc;
  border-radius: 12px;
  background: #fffdfa;
}

.upload-image-field__preview img {
  width: 72px;
  height: 72px;
  border-radius: 10px;
  background: #f4ecdf;
  object-fit: cover;
}

.upload-image-field__preview figcaption {
  min-width: 0;
  color: #6d5e4e;
  font-size: 13px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.upload-image-field__remove {
  min-height: 34px;
  padding: 0 12px;
  border: 0;
  border-radius: 10px;
  background: #f4e4d8;
  color: #9d4e2f;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
}

.upload-image-field__remove:disabled {
  cursor: wait;
  opacity: 0.65;
}

.upload-image-field__hint {
  margin: 0;
  color: #6d5e4e;
  font-size: 13px;
}

.upload-image-field__hint.is-error {
  color: #b15b38;
}

.upload-image-field__backdrop {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(32, 24, 16, 0.45);
}

.upload-image-field__dialog {
  width: min(100%, 520px);
  display: grid;
  gap: 18px;
  padding: 22px;
  border-radius: 20px;
  background: #fffdfa;
  box-shadow: 0 24px 80px rgba(45, 36, 26, 0.22);
}

.upload-image-field__dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.upload-image-field__dialog-header h4 {
  margin: 0;
  color: #2f281f;
  font-size: 18px;
}

.upload-image-field__close {
  min-height: 34px;
  padding: 0 12px;
  border-radius: 10px;
  background: #f4ecdf;
  color: #6d5e4e;
  font-size: 13px;
  font-weight: 700;
}

.upload-image-field__source-grid {
  display: grid;
  gap: 10px;
}

.upload-image-field__source-grid button {
  display: grid;
  gap: 4px;
  min-height: 72px;
  padding: 14px 16px;
  border: 1px solid #eadfcc;
  border-radius: 14px;
  background: #fff8ed;
  color: #2f281f;
  text-align: left;
}

.upload-image-field__source-grid button:active,
.upload-image-field__trigger:active {
  transform: translateY(1px);
}

.upload-image-field__source-grid strong {
  font-size: 15px;
}

.upload-image-field__source-grid span {
  color: #7a6a58;
  font-size: 13px;
}

.upload-image-field__url-form {
  display: grid;
  gap: 14px;
}

.upload-image-field__url-form label {
  display: grid;
  gap: 8px;
  color: #4c4034;
  font-size: 13px;
  font-weight: 700;
}

.upload-image-field__url-form input {
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid #d8cab5;
  border-radius: 12px;
  background: #fffdfa;
  color: #2f281f;
  font: inherit;
}

.upload-image-field__dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.upload-image-field__dialog-actions button {
  min-height: 40px;
  padding: 0 14px;
  border-radius: 10px;
  font-weight: 700;
}

.button-secondary {
  background: #f4ecdf;
  color: #6d5e4e;
}

.button-primary {
  background: #2f281f;
  color: #fffdfa;
}

.upload-image-field__close:disabled,
.upload-image-field__dialog-actions button:disabled {
  cursor: wait;
  opacity: 0.65;
}
</style>
