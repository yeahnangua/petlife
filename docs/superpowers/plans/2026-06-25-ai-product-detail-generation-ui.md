# AI Product Detail Generation UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add admin product-edit UI for mock AI generation of product intro fields and specs JSON.

**Architecture:** Keep the change local to `ProductFormDialog.vue` because the feature only affects product form draft state and does not change the save payload. Add deterministic local generator functions as explicit future API replacement points. Cover the UI behavior with component tests before production edits.

**Tech Stack:** Vue 3 `<script setup>`, Vue Test Utils, Vitest, scoped CSS, existing admin Vite app.

---

## File Structure

- Modify: `admin/src/components/ProductFormDialog.vue`
  - Add intro-generation UI state and mock generator.
  - Add specs-generation modal state and mock parser.
  - Keep existing submit payload unchanged.
- Create: `admin/src/tests/product-form-dialog.test.js`
  - Mount the product form dialog with stubbed upload fields.
  - Verify intro generation overwrites existing fields.
  - Verify specs prompt generates and writes formatted JSON.

## Task 1: Add Failing Component Tests

**Files:**

- Create: `admin/src/tests/product-form-dialog.test.js`

- [ ] **Step 1: Write the failing tests**

Create `admin/src/tests/product-form-dialog.test.js` with:

```javascript
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ProductFormDialog from '@/components/ProductFormDialog.vue'

const categories = [
  {
    id: 'cat-food',
    name: '主粮'
  }
]

function mountDialog(initialValue = {}) {
  return mount(ProductFormDialog, {
    props: {
      modelValue: true,
      categories,
      initialValue: {
        id: 'p_001',
        category_id: 'cat-food',
        title: '鲜肉全价猫粮',
        subtitle: '低敏冷鲜配方 · 成猫通用',
        pet_type: 'cat',
        price: 268,
        member_price: 248,
        original_price: 298,
        stock: 42,
        stock_status: 'inStock',
        badge: '热卖',
        tags: ['旧标签'],
        specs: [],
        summary: ['旧摘要'],
        suitable_text: '旧适用描述',
        cover_url: '/uploads/product.jpg',
        status: 'active',
        image_urls: [],
        ...initialValue
      }
    },
    global: {
      stubs: {
        UploadImageField: {
          props: ['modelValue', 'label', 'multiple'],
          template: '<div class="upload-image-field-stub">{{ label }}</div>'
        }
      }
    }
  })
}

describe('ProductFormDialog AI helpers', () => {
  it('overwrites tags summary and suitable text from the filled product context', async () => {
    const wrapper = mountDialog()

    await wrapper.get('[data-test="generate-intro"]').trigger('click')

    const tags = wrapper.get('[data-test="product-tags"]').element
    const summary = wrapper.get('[data-test="product-summary"]').element
    const suitable = wrapper.get('[data-test="product-suitable"]').element

    expect(tags.value).toBe('低敏, 无谷, 鲜肉70%, 猫粮')
    expect(summary.value).toBe([
      '鲜肉含量 70%，保留原始营养',
      '低敏配方，适合肠胃敏感猫咪',
      '自研冷鲜锁鲜工艺'
    ].join('\n'))
    expect(suitable.value).toBe('适合 1-8 岁成猫 / 全品种')
  })

  it('generates formatted specs JSON from a natural language prompt', async () => {
    const wrapper = mountDialog()

    await wrapper.get('[data-test="open-specs-ai"]').trigger('click')
    await wrapper.get('[data-test="specs-ai-prompt"]').setValue('规格有 1.5kg 3kg 和 6kg ，口味有鸡肉 三文鱼 和牛肉')
    await wrapper.get('[data-test="generate-specs-json"]').trigger('click')

    const specs = wrapper.get('[data-test="product-specs"]').element

    expect(specs.value).toBe(JSON.stringify([
      {
        group: '规格',
        options: ['1.5kg', '3kg', '6kg']
      },
      {
        group: '口味',
        options: ['鸡肉', '三文鱼', '牛肉']
      }
    ], null, 2))
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
cd admin && npm test -- src/tests/product-form-dialog.test.js
```

Expected:

- Vitest runs `product-form-dialog.test.js`.
- Both tests fail because `[data-test="generate-intro"]` and `[data-test="open-specs-ai"]` do not exist yet.

## Task 2: Implement Product Intro Generation UI

**Files:**

- Modify: `admin/src/components/ProductFormDialog.vue`
- Test: `admin/src/tests/product-form-dialog.test.js`

- [ ] **Step 1: Add intro helper imports and computed state**

Change the script import from:

```javascript
import { reactive, ref, watch } from 'vue'
```

to:

```javascript
import { computed, reactive, ref, watch } from 'vue'
```

Change enum imports from:

```javascript
import { petTypeOptions, publishStatusOptions, stockStatusOptions } from '@/utils/enumLabels'
```

to:

```javascript
import {
  getPetTypeLabel,
  petTypeOptions,
  publishStatusOptions,
  stockStatusOptions
} from '@/utils/enumLabels'
```

Add this state after `const specsError = ref('')`:

```javascript
const introGenerating = ref(false)
```

Add these computed helpers after the `form` reactive object:

```javascript
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
```

- [ ] **Step 2: Add the mock intro generator and click handler**

Add these functions before `closeDialog()`:

```javascript
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
```

- [ ] **Step 3: Add the intro UI before the tags field**

In the template, insert this block immediately before the existing tags `<label class="dialog-card__full">`:

```vue
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
```

Add `data-test` attributes to existing textareas:

```vue
<textarea data-test="product-tags" v-model="form.tags_text" rows="2" placeholder="逗号或换行分隔" />
<textarea data-test="product-summary" v-model="form.summary_text" rows="3" placeholder="每行一条" />
<textarea data-test="product-suitable" v-model="form.suitable_text" rows="2" />
```

- [ ] **Step 4: Run the focused tests**

Run:

```bash
cd admin && npm test -- src/tests/product-form-dialog.test.js
```

Expected:

- The intro generation test passes.
- The specs generation test still fails because specs modal UI is not implemented yet.

## Task 3: Implement Specs JSON Generation Modal

**Files:**

- Modify: `admin/src/components/ProductFormDialog.vue`
- Test: `admin/src/tests/product-form-dialog.test.js`

- [ ] **Step 1: Add specs modal state**

Add this state after `const introGenerating = ref(false)`:

```javascript
const specsAiOpen = ref(false)
const specsAiPrompt = ref('')
const specsAiError = ref('')
const specsAiPreview = ref('')
```

Update `syncForm()` by adding these reset lines before the function ends:

```javascript
specsAiOpen.value = false
specsAiPrompt.value = ''
specsAiError.value = ''
specsAiPreview.value = ''
```

- [ ] **Step 2: Add specs parser and modal handlers**

Add these functions before `closeDialog()`:

```javascript
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
    .replace(/\s+和\s+/g, ' ')
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
```

- [ ] **Step 3: Replace the specs JSON label with a toolbar**

Replace the existing specs label:

```vue
<label class="dialog-card__full">
  <span>规格 JSON</span>
  <textarea v-model="form.specs_text" rows="6" />
</label>
```

with:

```vue
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
```

- [ ] **Step 4: Add the specs AI modal**

Insert this modal block after the closing `</section>` of the main dialog card and before the closing backdrop `</div>`:

```vue
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
```

- [ ] **Step 5: Run the focused tests**

Run:

```bash
cd admin && npm test -- src/tests/product-form-dialog.test.js
```

Expected:

- Both product form dialog tests pass.

## Task 4: Add Scoped Styles And Full Verification

**Files:**

- Modify: `admin/src/components/ProductFormDialog.vue`

- [ ] **Step 1: Add scoped CSS for the AI helper UI**

Add these styles before the existing media query:

```css
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

.ai-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: 2;
  width: min(100%, 560px);
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
  width: 100%;
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
```

Extend the media query with:

```css
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
```

- [ ] **Step 2: Run all admin tests**

Run:

```bash
cd admin && npm test
```

Expected:

- Existing admin tests pass, with skipped tests remaining skipped.
- New `product-form-dialog.test.js` passes.

- [ ] **Step 3: Build the admin app**

Run:

```bash
cd admin && npm run build
```

Expected:

- Vite build completes successfully.
- No Vue template compile errors.

- [ ] **Step 4: Review the git diff**

Run:

```bash
git diff -- admin/src/components/ProductFormDialog.vue admin/src/tests/product-form-dialog.test.js
```

Expected:

- Diff only touches the product form dialog and its new component test.
- Existing submit payload fields remain unchanged.

- [ ] **Step 5: Commit the implementation**

Run:

```bash
git add admin/src/components/ProductFormDialog.vue admin/src/tests/product-form-dialog.test.js
git commit -m "feat: add admin product ai generation ui"
```

Expected:

- Git creates an implementation commit on `feature/ai-product-detail-generation`.
