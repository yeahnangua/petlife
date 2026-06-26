<script setup>
import { reactive, ref, watch } from 'vue'
import { generateServiceAiDraft } from '@/api/catalog'
import UploadImageField from '@/components/UploadImageField.vue'
import { petTypeOptions, publishStatusOptions } from '@/utils/enumLabels'

const props = defineProps({
  modelValue: Boolean,
  initialValue: {
    type: Object,
    default: null
  },
  submitting: Boolean
})

const emit = defineEmits(['update:modelValue', 'submit'])
const aiGenerating = ref(false)
const aiError = ref('')

const form = reactive({
  title: '',
  subtitle: '',
  pet_type: 'cat',
  price: 0,
  member_price: 0,
  original_price: 0,
  duration_minutes: 60,
  badge: '',
  highlights_text: '',
  summary_text: '',
  notice_text: '',
  cover_url: '',
  status: 'active',
  image_urls: []
})

function listToText(list = []) {
  return list.join('\n')
}

function splitValues(value = '') {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function getPetTypeLabel(value) {
  return petTypeOptions.find((item) => item.value === value)?.label || value
}

function syncForm(value = null) {
  form.title = value?.title ?? ''
  form.subtitle = value?.subtitle ?? ''
  form.pet_type = value?.pet_type ?? 'cat'
  form.price = value?.price ?? 0
  form.member_price = value?.member_price ?? 0
  form.original_price = value?.original_price ?? 0
  form.duration_minutes = value?.duration_minutes ?? 60
  form.badge = value?.badge ?? ''
  form.highlights_text = listToText(value?.highlights)
  form.summary_text = listToText(value?.summary)
  form.notice_text = listToText(value?.notice)
  form.cover_url = value?.cover_url ?? ''
  form.status = value?.status ?? 'active'
  form.image_urls = [...(value?.image_urls || [])]
  aiError.value = ''
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
    title: form.title.trim(),
    subtitle: form.subtitle.trim(),
    pet_type: form.pet_type,
    price: Number(form.price),
    member_price: Number(form.member_price),
    original_price: Number(form.original_price),
    duration_minutes: Number(form.duration_minutes),
    badge: form.badge.trim(),
    highlights: splitValues(form.highlights_text),
    summary: splitValues(form.summary_text),
    notice: splitValues(form.notice_text),
    cover_url: form.cover_url.trim(),
    status: form.status,
    image_urls: form.image_urls
  })
}

function buildServiceAiContext() {
  return {
    title: form.title.trim(),
    subtitle: form.subtitle.trim(),
    pet_type: form.pet_type,
    pet_type_label: getPetTypeLabel(form.pet_type),
    price: Number(form.price),
    member_price: Number(form.member_price),
    original_price: Number(form.original_price),
    duration_minutes: Number(form.duration_minutes),
    badge: form.badge.trim(),
    highlights: splitValues(form.highlights_text),
    summary: splitValues(form.summary_text),
    notice: splitValues(form.notice_text)
  }
}

async function generateServiceIntro() {
  aiGenerating.value = true
  aiError.value = ''

  try {
    const data = await generateServiceAiDraft({
      service: buildServiceAiContext()
    })
    const draft = data.draft || {}
    form.highlights_text = Array.isArray(draft.highlights) ? listToText(draft.highlights) : ''
    form.summary_text = Array.isArray(draft.summary) ? listToText(draft.summary) : ''
    form.notice_text = Array.isArray(draft.notice) ? listToText(draft.notice) : ''
  } catch (requestError) {
    aiError.value = requestError instanceof Error ? requestError.message : 'AI 服务资料生成失败'
  } finally {
    aiGenerating.value = false
  }
}
</script>

<template>
  <div v-if="modelValue" class="dialog-backdrop" @click.self="closeDialog">
    <section class="dialog-card dialog-card--wide">
      <div class="dialog-card__header">
        <h3>{{ initialValue?.id ? '编辑服务' : '新增服务' }}</h3>
        <button type="button" class="dialog-card__close" @click="closeDialog">关闭</button>
      </div>
      <div class="dialog-card__grid dialog-card__grid--two">
        <label>
          <span>标题</span>
          <input v-model="form.title" />
        </label>
        <label>
          <span>副标题</span>
          <input v-model="form.subtitle" />
        </label>
        <label>
          <span>宠物类型</span>
          <select v-model="form.pet_type">
            <option v-for="item in petTypeOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
        </label>
        <label>
          <span>状态</span>
          <select v-model="form.status">
            <option v-for="item in publishStatusOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
        </label>
        <label>
          <span>价格</span>
          <input v-model="form.price" type="number" min="0" />
        </label>
        <label>
          <span>会员价</span>
          <input v-model="form.member_price" type="number" min="0" />
        </label>
        <label>
          <span>原价</span>
          <input v-model="form.original_price" type="number" min="0" />
        </label>
        <label>
          <span>时长（分钟）</span>
          <input v-model="form.duration_minutes" type="number" min="1" />
        </label>
        <label class="dialog-card__full">
          <span>角标文案</span>
          <input v-model="form.badge" />
        </label>
        <section class="service-ai dialog-card__full">
          <div>
            <strong>AI 服务资料生成</strong>
            <p v-if="aiError">{{ aiError }}</p>
          </div>
          <button
            type="button"
            class="button-secondary"
            :disabled="aiGenerating"
            data-test="generate-service-ai"
            @click="generateServiceIntro"
          >
            {{ aiGenerating ? '生成中...' : 'AI 生成服务资料' }}
          </button>
        </section>
        <label class="dialog-card__full">
          <span>亮点</span>
          <textarea v-model="form.highlights_text" rows="3" placeholder="每行一条" data-test="service-highlights" />
        </label>
        <label class="dialog-card__full">
          <span>摘要</span>
          <textarea v-model="form.summary_text" rows="3" placeholder="每行一条" data-test="service-summary" />
        </label>
        <label class="dialog-card__full">
          <span>注意事项</span>
          <textarea v-model="form.notice_text" rows="3" placeholder="每行一条" data-test="service-notice" />
        </label>
        <UploadImageField v-model="form.cover_url" label="服务封面" class="dialog-card__full" />
        <UploadImageField v-model="form.image_urls" label="服务图集" multiple class="dialog-card__full" />
      </div>
      <footer class="dialog-card__footer">
        <button type="button" class="button-secondary" @click="closeDialog">取消</button>
        <button type="button" class="button-primary" :disabled="submitting" @click="submitForm">
          {{ submitting ? '保存中...' : '保存服务' }}
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
  width: min(100%, 920px);
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

.dialog-card__grid--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
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

.dialog-card__full {
  grid-column: 1 / -1;
}

.service-ai {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
  border: 1px solid #ead8c8;
  border-radius: 14px;
  background: #fff7ef;
}

.service-ai strong {
  color: #2f251d;
  font-size: 14px;
}

.service-ai p {
  margin-top: 4px;
  color: #b4472f;
  font-size: 12px;
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

@media (max-width: 900px) {
  .dialog-card__grid--two {
    grid-template-columns: 1fr;
  }
}
</style>
