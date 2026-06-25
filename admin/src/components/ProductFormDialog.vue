<script setup>
import { computed, reactive, ref, watch } from 'vue'
import UploadImageField from '@/components/UploadImageField.vue'
import {
  getPetTypeLabel,
  petTypeOptions,
  publishStatusOptions,
  stockStatusOptions
} from '@/utils/enumLabels'

const props = defineProps({
  modelValue: Boolean,
  initialValue: {
    type: Object,
    default: null
  },
  categories: {
    type: Array,
    default: () => []
  },
  submitting: Boolean
})

const emit = defineEmits(['update:modelValue', 'submit'])
const specsError = ref('')
const introGenerating = ref(false)
const specsAiOpen = ref(false)
const specsAiPrompt = ref('')
const specsAiError = ref('')
const specsAiPreview = ref('')

const form = reactive({
  category_id: '',
  title: '',
  subtitle: '',
  pet_type: 'cat',
  price: 0,
  member_price: 0,
  original_price: 0,
  stock: 0,
  stock_status: 'inStock',
  badge: '',
  tags_text: '',
  specs_text: '[]',
  summary_text: '',
  suitable_text: '',
  cover_url: '',
  status: 'active',
  image_urls: []
})

const selectedCategory = computed(() => {
  return props.categories.find((item) => item.id === form.category_id) ?? null
})

const introContextReady = computed(() => {
  return Boolean(
    selectedCategory.value?.name &&
      form.pet_type &&
      form.title.trim() &&
      form.subtitle.trim()
  )
})

const introContextText = computed(() => {
  const categoryName = selectedCategory.value?.name || '未选择分类'
  const petTypeLabel = getPetTypeLabel(form.pet_type) || '未选择宠物类型'
  const title = form.title.trim() || '未填写标题'
  const subtitle = form.subtitle.trim() || '未填写副标题'

  return `${categoryName} / ${petTypeLabel} / ${title} / ${subtitle}`
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

function syncForm(value = null) {
  form.category_id = value?.category_id ?? props.categories[0]?.id ?? ''
  form.title = value?.title ?? ''
  form.subtitle = value?.subtitle ?? ''
  form.pet_type = value?.pet_type ?? 'cat'
  form.price = value?.price ?? 0
  form.member_price = value?.member_price ?? 0
  form.original_price = value?.original_price ?? 0
  form.stock = value?.stock ?? 0
  form.stock_status = value?.stock_status ?? 'inStock'
  form.badge = value?.badge ?? ''
  form.tags_text = (value?.tags || []).join(', ')
  form.specs_text = JSON.stringify(value?.specs || [], null, 2)
  form.summary_text = listToText(value?.summary)
  form.suitable_text = value?.suitable_text ?? ''
  form.cover_url = value?.cover_url ?? ''
  form.status = value?.status ?? 'active'
  form.image_urls = [...(value?.image_urls || [])]
  specsError.value = ''
  specsAiOpen.value = false
  specsAiPrompt.value = ''
  specsAiError.value = ''
  specsAiPreview.value = ''
}

watch(
  () => [props.modelValue, props.initialValue, props.categories.length],
  ([open, value]) => {
    if (open) {
      syncForm(value)
    }
  },
  { immediate: true }
)

function generateIntroDraft() {
  return {
    tags: ['低敏', '无谷', '鲜肉70%', '猫粮'],
    summary: [
      '鲜肉含量 70%，保留原始营养',
      '低敏配方，适合肠胃敏感猫咪',
      '自研冷鲜锁鲜工艺'
    ],
    suitableText: '适合 1-8 岁成猫 / 全品种'
  }
}

function generateIntro() {
  if (!introContextReady.value || introGenerating.value) {
    return
  }

  introGenerating.value = true
  const draft = generateIntroDraft()
  form.tags_text = draft.tags.join(', ')
  form.summary_text = listToText(draft.summary)
  form.suitable_text = draft.suitableText
  introGenerating.value = false
}

function extractOptionsAfterKeyword(prompt, keyword, nextKeywords = []) {
  const keywordIndex = prompt.indexOf(keyword)

  if (keywordIndex === -1) {
    return []
  }

  const start = keywordIndex + keyword.length
  let end = prompt.length

  nextKeywords.forEach((nextKeyword) => {
    const nextIndex = prompt.indexOf(nextKeyword, start)
    if (nextIndex !== -1 && nextIndex < end) {
      end = nextIndex
    }
  })

  return prompt
    .slice(start, end)
    .replace(/[，,。；;：:]/g, ' ')
    .replace(/\s+和\s*/g, ' ')
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function generateSpecsDraft(prompt) {
  const specOptions = extractOptionsAfterKeyword(prompt, '规格有', ['口味有'])
  const flavorOptions = extractOptionsAfterKeyword(prompt, '口味有', ['规格有'])
  const draft = []

  if (specOptions.length) {
    draft.push({
      group: '规格',
      options: specOptions
    })
  }

  if (flavorOptions.length) {
    draft.push({
      group: '口味',
      options: flavorOptions
    })
  }

  if (draft.length) {
    return draft
  }

  return [
    {
      group: '规格',
      options: ['默认规格']
    }
  ]
}

function openSpecsAiDialog() {
  specsAiOpen.value = true
  specsAiError.value = ''
  specsAiPreview.value = ''
}

function closeSpecsAiDialog() {
  specsAiOpen.value = false
  specsAiError.value = ''
}

function generateSpecsJson() {
  const prompt = specsAiPrompt.value.trim()

  if (!prompt) {
    specsAiError.value = '请输入规格描述'
    specsAiPreview.value = ''
    return
  }

  const specs = generateSpecsDraft(prompt)
  const text = JSON.stringify(specs, null, 2)
  form.specs_text = text
  specsAiPreview.value = text
  specsAiError.value = ''
}

function closeDialog() {
  emit('update:modelValue', false)
}

function submitForm() {
  let specs = []

  try {
    specs = JSON.parse(form.specs_text || '[]')
  } catch (_error) {
    specsError.value = '规格 JSON 格式不正确'
    return
  }

  specsError.value = ''

  emit('submit', {
    category_id: form.category_id,
    title: form.title.trim(),
    subtitle: form.subtitle.trim(),
    pet_type: form.pet_type,
    price: Number(form.price),
    member_price: Number(form.member_price),
    original_price: Number(form.original_price),
    stock: Number(form.stock),
    stock_status: form.stock_status,
    badge: form.badge.trim(),
    tags: splitValues(form.tags_text),
    specs,
    summary: splitValues(form.summary_text),
    suitable_text: form.suitable_text.trim(),
    cover_url: form.cover_url.trim(),
    status: form.status,
    image_urls: form.image_urls
  })
}
</script>

<template>
  <div v-if="modelValue" class="dialog-backdrop" @click.self="closeDialog">
    <section class="dialog-card dialog-card--wide">
      <div class="dialog-card__header">
        <h3>{{ initialValue?.id ? '编辑商品' : '新增商品' }}</h3>
        <button type="button" class="dialog-card__close" @click="closeDialog">关闭</button>
      </div>
      <div class="dialog-card__grid dialog-card__grid--two">
        <label>
          <span>分类</span>
          <select v-model="form.category_id">
            <option v-for="item in categories" :key="item.id" :value="item.id">{{ item.name }}</option>
          </select>
        </label>
        <label>
          <span>宠物类型</span>
          <select v-model="form.pet_type">
            <option v-for="item in petTypeOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
        </label>
        <label>
          <span>标题</span>
          <input v-model="form.title" />
        </label>
        <label>
          <span>副标题</span>
          <input v-model="form.subtitle" />
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
          <span>库存</span>
          <input v-model="form.stock" type="number" min="0" />
        </label>
        <label>
          <span>库存状态</span>
          <select v-model="form.stock_status">
            <option v-for="item in stockStatusOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
        </label>
        <label>
          <span>上下架状态</span>
          <select v-model="form.status">
            <option v-for="item in publishStatusOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
        </label>
        <label class="dialog-card__full">
          <span>角标文案</span>
          <input v-model="form.badge" />
        </label>
        <div class="dialog-card__full ai-helper">
          <div>
            <span class="ai-helper__eyebrow">AI 介绍生成</span>
            <p>{{ introContextReady ? introContextText : '请先填写分类、宠物类型、标题、副标题' }}</p>
            <small>会覆盖当前标签、摘要、适用描述</small>
          </div>
          <button
            type="button"
            class="button-secondary ai-helper__button"
            data-test="generate-intro"
            :disabled="!introContextReady || introGenerating"
            @click="generateIntro"
          >
            {{ introGenerating ? '生成中...' : 'AI 生成介绍' }}
          </button>
        </div>
        <label class="dialog-card__full">
          <span>标签</span>
          <textarea data-test="product-tags" v-model="form.tags_text" rows="2" placeholder="逗号或换行分隔" />
        </label>
        <label class="dialog-card__full">
          <span>摘要</span>
          <textarea data-test="product-summary" v-model="form.summary_text" rows="3" placeholder="每行一条" />
        </label>
        <label class="dialog-card__full">
          <span>适用描述</span>
          <textarea data-test="product-suitable" v-model="form.suitable_text" rows="2" />
        </label>
        <div class="dialog-card__full specs-field">
          <div class="field-toolbar">
            <span>规格 JSON</span>
            <button
              type="button"
              class="button-secondary field-toolbar__button"
              data-test="open-specs-ai"
              @click="openSpecsAiDialog"
            >
              AI 生成规格
            </button>
          </div>
          <textarea data-test="product-specs" v-model="form.specs_text" rows="6" />
        </div>
        <p v-if="specsError" class="dialog-card__error">{{ specsError }}</p>
        <UploadImageField v-model="form.cover_url" label="商品封面" class="dialog-card__full" />
        <UploadImageField v-model="form.image_urls" label="商品图集" multiple class="dialog-card__full" />
      </div>
      <footer class="dialog-card__footer">
        <button type="button" class="button-secondary" @click="closeDialog">取消</button>
        <button type="button" class="button-primary" :disabled="submitting" @click="submitForm">
          {{ submitting ? '保存中...' : '保存商品' }}
        </button>
      </footer>
    </section>
    <div
      v-if="specsAiOpen"
      class="ai-modal-backdrop"
      data-test="specs-ai-backdrop"
      @click="closeSpecsAiDialog"
    />
    <section v-if="specsAiOpen" class="ai-modal" aria-label="AI 生成规格">
      <div class="ai-modal__header">
        <h4>AI 生成规格</h4>
        <button type="button" class="dialog-card__close" @click="closeSpecsAiDialog">关闭</button>
      </div>
      <label>
        <span>自然语言描述</span>
        <textarea
          data-test="specs-ai-prompt"
          v-model="specsAiPrompt"
          rows="4"
          placeholder="例如：规格有 1.5kg 3kg 和 6kg，口味有鸡肉 三文鱼 和牛肉"
        />
      </label>
      <p v-if="specsAiError" class="dialog-card__error">{{ specsAiError }}</p>
      <pre v-if="specsAiPreview" class="ai-modal__preview">{{ specsAiPreview }}</pre>
      <footer class="ai-modal__footer">
        <button type="button" class="button-secondary" @click="closeSpecsAiDialog">取消</button>
        <button
          type="button"
          class="button-primary"
          data-test="generate-specs-json"
          @click="generateSpecsJson"
        >
          生成 JSON
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

.dialog-card__full,
.dialog-card__error {
  grid-column: 1 / -1;
}

.dialog-card__error {
  color: #b15b38;
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

.ai-helper,
.field-toolbar,
.ai-modal__header,
.ai-modal__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ai-helper {
  padding: 14px;
  border: 1px solid #e3d7c8;
  border-radius: 16px;
  background: #fbf4ea;
}

.ai-helper p {
  margin: 4px 0;
  color: #4a3a2d;
}

.ai-helper small,
.ai-helper__eyebrow {
  color: #866549;
}

.ai-helper__eyebrow {
  font-size: 12px;
  font-weight: 700;
}

.ai-helper__button,
.field-toolbar__button {
  flex: 0 0 auto;
}

.button-secondary:disabled,
.button-primary:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.specs-field {
  display: grid;
  gap: 8px;
}

.field-toolbar {
  font-weight: 600;
}

.ai-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1;
  background: rgba(32, 24, 16, 0.55);
}

.ai-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: 2;
  box-sizing: border-box;
  width: min(calc(100% - 32px), 560px);
  display: grid;
  gap: 16px;
  padding: 20px;
  border-radius: 20px;
  background: #fffdfa;
  box-shadow: 0 24px 80px rgba(32, 24, 16, 0.22);
  transform: translate(-50%, -50%);
}

.ai-modal label {
  display: grid;
  gap: 8px;
}

.ai-modal textarea {
  width: 90%;
  padding: 12px;
  border: 1px solid #d8cbbd;
  border-radius: 14px;
}

.ai-modal__header h4 {
  margin: 0;
}

.ai-modal__preview {
  max-height: 180px;
  overflow: auto;
  padding: 12px;
  border-radius: 14px;
  background: #29211b;
  color: #fffdfa;
  white-space: pre-wrap;
}

@media (max-width: 900px) {
  .dialog-card__grid--two {
    grid-template-columns: 1fr;
  }

  .ai-helper,
  .field-toolbar,
  .ai-modal__footer {
    align-items: stretch;
    flex-direction: column;
  }

  .ai-helper__button,
  .field-toolbar__button {
    width: 100%;
  }
}
</style>
