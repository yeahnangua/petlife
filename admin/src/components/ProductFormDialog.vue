<script setup>
import { reactive, ref, watch } from 'vue'
import UploadImageField from '@/components/UploadImageField.vue'
import { petTypeOptions, publishStatusOptions, stockStatusOptions } from '@/utils/enumLabels'

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
        <label class="dialog-card__full">
          <span>标签</span>
          <textarea v-model="form.tags_text" rows="2" placeholder="逗号或换行分隔" />
        </label>
        <label class="dialog-card__full">
          <span>摘要</span>
          <textarea v-model="form.summary_text" rows="3" placeholder="每行一条" />
        </label>
        <label class="dialog-card__full">
          <span>适用描述</span>
          <textarea v-model="form.suitable_text" rows="2" />
        </label>
        <label class="dialog-card__full">
          <span>规格 JSON</span>
          <textarea v-model="form.specs_text" rows="6" />
        </label>
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

@media (max-width: 900px) {
  .dialog-card__grid--two {
    grid-template-columns: 1fr;
  }
}
</style>
