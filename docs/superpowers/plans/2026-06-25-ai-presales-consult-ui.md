# AI 售前商品咨询 UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a front-end-only AI customer service UI for pre-sales product consultation, with a homepage entry, product-detail contextual entry, and a reusable consultation page.

**Architecture:** Add one secondary Vue route (`/ai-consult`) and one new view (`AiConsultView.vue`). Entry points stay inside existing page boundaries: homepage uses an inline card, product detail uses a floating button above the purchase bar. Conversation state remains local to the consultation page; product context reuses `catalogStore.fetchProductDetail(productId)`.

**Tech Stack:** Vue 3 `<script setup>` + Vue Router hash mode + Pinia catalog store + Vitest + Vue Test Utils + existing CSS tokens/components.

**Spec:** `docs/superpowers/specs/2026-06-25-ai-presales-consult-design.md`

---

## File Structure

- Modify `src/router/index.js`: register `/ai-consult` as a non-tab secondary route with title `AI客服`.
- Modify `src/tests/search-route.test.js`: add real router registration coverage for `/ai-consult`.
- Modify `src/tests/router-shell.test.js`: add shell coverage for `/ai-consult`.
- Modify `src/views/HomeView.vue`: add the homepage inline AI consultation card and route push.
- Modify `src/tests/home-view.test.js`: add homepage entry rendering and navigation coverage.
- Modify `src/views/ProductDetailView.vue`: add product-detail floating AI consultation entry and route push with `productId`.
- Create `src/tests/product-detail-ai-consult.test.js`: cover contextual entry on product detail.
- Create `src/views/AiConsultView.vue`: implement the consultation UI and local simulated replies.
- Create `src/tests/ai-consult-view.test.js`: cover generic mode, product-context mode, quick questions, input sending, and empty input behavior.

---

### Task 1: Register The AI Consultation Route

**Files:**
- Modify: `src/tests/search-route.test.js`
- Modify: `src/tests/router-shell.test.js`
- Modify: `src/router/index.js`

- [ ] **Step 1: Write the failing real-router registration test**

Add this test inside `describe('search route', () => { ... })` in `src/tests/search-route.test.js`:

```javascript
  it('registers the AI customer service page as a secondary route', () => {
    const route = router.getRoutes().find((item) => item.name === 'ai-consult')

    expect(route?.path).toBe('/ai-consult')
    expect(route?.meta.title).toBe('AI客服')
    expect(route?.meta.tab).toBeUndefined()
  })
```

- [ ] **Step 2: Run the route registration test to verify it fails**

Run:

```bash
npm run test:client -- src/tests/search-route.test.js
```

Expected: FAIL because route `ai-consult` is not registered and `route?.path` is `undefined`.

- [ ] **Step 3: Add the real route**

In `src/router/index.js`, insert this route after the `/product/:id` route and before `/service`:

```javascript
  {
    path: '/ai-consult',
    name: 'ai-consult',
    component: () => import('@/views/AiConsultView.vue'),
    meta: { title: 'AI客服' }
  },
```

- [ ] **Step 4: Run the route registration test to verify it passes**

Run:

```bash
npm run test:client -- src/tests/search-route.test.js
```

Expected: PASS.

- [ ] **Step 5: Add the route shell regression test**

Add this test inside `describe('app shell', () => { ... })` in `src/tests/router-shell.test.js`:

```javascript
  it('shows the AI customer service page as a secondary route', async () => {
    const wrapper = await mountApp(
      [{ path: '/ai-consult', component: { template: '<section>consult</section>' }, meta: { title: 'AI客服' } }],
      '/ai-consult'
    )

    expect(wrapper.find('.tab-bar').exists()).toBe(false)
    expect(wrapper.find('.top-bar').exists()).toBe(true)
    expect(wrapper.find('.top-bar').text()).toContain('AI客服')
    expect(wrapper.find('.app').attributes('style')).toContain('--shell-bottom-offset: var(--safe-bottom)')
  })
```

- [ ] **Step 6: Run the route shell test**

Run:

```bash
npm run test:client -- src/tests/router-shell.test.js
```

Expected: PASS.

- [ ] **Step 7: Run both route tests**

Run:

```bash
npm run test:client -- src/tests/search-route.test.js src/tests/router-shell.test.js
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/router/index.js src/tests/search-route.test.js src/tests/router-shell.test.js
git commit -m "feat: add ai consult route"
```

---

### Task 2: Add The Homepage AI Consultation Entry

**Files:**
- Modify: `src/tests/home-view.test.js`
- Modify: `src/views/HomeView.vue`

- [ ] **Step 1: Write the failing homepage entry test**

In `src/tests/home-view.test.js`, change `mountHomeView()` so it returns both wrapper and router:

```javascript
  const wrapper = mount(HomeView, {
    global: {
      plugins: [router, pinia],
      stubs: {
        ProductCard: {
          props: ['product'],
          template: '<article>{{ product.title }}</article>'
        },
        ServiceCard: {
          props: ['service'],
          template: '<article>{{ service.title }}</article>'
        },
        SkeletonBlock: true
      }
    }
  })

  return { wrapper, router }
```

Update the existing test to destructure `wrapper`:

```javascript
    const { wrapper } = await mountHomeView()
```

Add this route stub in the router `routes` array:

```javascript
      { path: '/ai-consult', name: 'ai-consult', component: { template: '<div />' } },
```

Add this test after the existing homepage test:

```javascript
  it('opens the AI pre-sales consultation page from the homepage card', async () => {
    const { wrapper, router } = await mountHomeView()

    const entry = wrapper.get('[data-test="home-ai-consult"]')
    expect(entry.text()).toContain('AI 售前咨询')
    expect(entry.text()).toContain('不知道怎么选')

    await entry.trigger('click')

    expect(router.currentRoute.value.path).toBe('/ai-consult')
  })
```

- [ ] **Step 2: Run the homepage test to verify it fails**

Run:

```bash
npm run test:client -- src/tests/home-view.test.js
```

Expected: FAIL with `Unable to get [data-test="home-ai-consult"]`.

- [ ] **Step 3: Add the homepage card markup**

In `src/views/HomeView.vue`, insert this section immediately after the `home__quick` section and before the `home__section home__ai` section:

```vue
      <section class="home__consult anim-fade-up">
        <button type="button" class="home__consult-card" data-test="home-ai-consult" @click="router.push('/ai-consult')">
          <span class="home__consult-icon">
            <IconSvg name="chat" :size="22" :stroke="1.9" />
          </span>
          <span class="home__consult-copy">
            <span class="home__consult-eyebrow">AI 购物助手</span>
            <strong>AI 售前咨询</strong>
            <span>不知道怎么选？告诉我宠物情况，帮你快速筛选商品。</span>
          </span>
          <span class="home__consult-action">
            开始咨询
            <IconSvg name="arrow-right" :size="13" :stroke="2.4" />
          </span>
        </button>
      </section>
```

- [ ] **Step 4: Add homepage card styles**

In `src/views/HomeView.vue`, add these styles after the quick-entry styles and before `/* ---------- 区块 ---------- */`:

```css
/* ---------- AI 售前咨询入口 ---------- */
.home__consult-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-4);
  border: 1px solid rgba(217, 113, 78, 0.22);
  border-radius: var(--radius-xl);
  background:
    linear-gradient(135deg, rgba(217, 113, 78, 0.12), rgba(106, 133, 114, 0.10)),
    var(--color-surface);
  text-align: left;
  box-shadow: var(--shadow-xs);
  transition: transform var(--dur-fast) var(--ease-spring), box-shadow var(--dur-base) var(--ease-out);
}

.home__consult-card:active {
  transform: scale(0.98);
  box-shadow: none;
}

.home__consult-icon {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 18px;
  background: var(--color-primary-deep);
  color: var(--color-text-invert);
}

.home__consult-copy {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.home__consult-eyebrow {
  color: var(--color-coral);
  font-size: var(--text-2xs);
  font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-wider);
}

.home__consult-copy strong {
  color: var(--color-text);
  font-size: var(--text-lg);
  font-weight: var(--weight-bold);
}

.home__consult-copy span:last-child {
  color: var(--color-text-mute);
  font-size: var(--text-xs);
  line-height: var(--leading-relaxed);
}

.home__consult-action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  align-self: stretch;
  padding-left: var(--space-3);
  border-left: 1px solid rgba(217, 113, 78, 0.18);
  color: var(--color-primary-deep);
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
  white-space: nowrap;
}
```

- [ ] **Step 5: Run the homepage test to verify it passes**

Run:

```bash
npm run test:client -- src/tests/home-view.test.js
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/views/HomeView.vue src/tests/home-view.test.js
git commit -m "feat: add homepage ai consult entry"
```

---

### Task 3: Add The Product Detail Contextual AI Entry

**Files:**
- Create: `src/tests/product-detail-ai-consult.test.js`
- Modify: `src/views/ProductDetailView.vue`

- [ ] **Step 1: Write the failing product-detail test**

Create `src/tests/product-detail-ai-consult.test.js`:

```javascript
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import { useCartStore } from '@/stores/cart'
import { useCatalogStore } from '@/stores/catalog'
import ProductDetailView from '@/views/ProductDetailView.vue'

const product = {
  id: 'p-001',
  title: '鲜肉全价猫粮',
  subtitle: '低敏冷鲜配方',
  petType: 'cat',
  stockStatus: 'inStock',
  cover: '/images/products/cat-food.svg',
  images: ['/images/products/cat-food.svg'],
  price: 268,
  memberPrice: 248,
  originalPrice: 298,
  badge: '热卖',
  tags: ['低敏'],
  specs: [{ group: '规格', options: ['1.5kg', '3kg'] }],
  summary: ['鲜肉含量 70%'],
  suitable: '适合 1-8 岁成猫 / 全品种',
  rating: 4.9,
  reviewCount: 1283,
  sold: 12800
}

async function mountProductDetail() {
  const pinia = createPinia()
  setActivePinia(pinia)

  const catalogStore = useCatalogStore()
  catalogStore.fetchProductDetail = vi.fn()
  catalogStore.$patch({
    currentProduct: product,
    relatedProducts: [],
    loading: {
      ...catalogStore.loading,
      productDetail: false
    },
    error: {
      ...catalogStore.error,
      productDetail: ''
    }
  })

  const cartStore = useCartStore()
  cartStore.fetchCart = vi.fn()
  cartStore.$patch({
    hydrated: true,
    items: []
  })

  const router = createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/product/:id', name: 'product-detail', component: ProductDetailView },
      { path: '/ai-consult', name: 'ai-consult', component: { template: '<div />' } },
      { path: '/cart', name: 'cart', component: { template: '<div />' } },
      { path: '/order/confirm', name: 'order-confirm', component: { template: '<div />' } },
      { path: '/products', name: 'product-list', component: { template: '<div />' } }
    ]
  })

  router.push('/product/p-001')
  await router.isReady()

  const wrapper = mount(ProductDetailView, {
    global: {
      plugins: [router, pinia],
      stubs: {
        ProductCard: true,
        BottomSheet: {
          props: ['open', 'title'],
          template: '<div v-if="open"><slot /></div>'
        },
        SkeletonBlock: true
      }
    }
  })

  await wrapper.vm.$nextTick()
  return { wrapper, router }
}

describe('ProductDetailView AI consultation entry', () => {
  it('opens AI consultation with the current product id', async () => {
    const { wrapper, router } = await mountProductDetail()

    const entry = wrapper.get('[data-test="detail-ai-consult"]')
    expect(entry.text()).toContain('AI咨询')

    await entry.trigger('click')

    expect(router.currentRoute.value.path).toBe('/ai-consult')
    expect(router.currentRoute.value.query.productId).toBe('p-001')
  })
})
```

- [ ] **Step 2: Run the product-detail test to verify it fails**

Run:

```bash
npm run test:client -- src/tests/product-detail-ai-consult.test.js
```

Expected: FAIL with `Unable to get [data-test="detail-ai-consult"]`.

- [ ] **Step 3: Add the navigation helper**

In `src/views/ProductDetailView.vue`, add this function after `handleAction(action)` and before `confirmSheet()`:

```javascript
function openAiConsult() {
  if (!product.value) return
  router.push({ path: '/ai-consult', query: { productId: product.value.id } })
}
```

- [ ] **Step 4: Add the floating button markup**

In `src/views/ProductDetailView.vue`, add this button after the `detail__action-bar` block and before the `BottomSheet`:

```vue
    <button type="button" class="detail__ai-consult" data-test="detail-ai-consult" @click="openAiConsult">
      <IconSvg name="chat" :size="18" :stroke="2" />
      <span>AI咨询</span>
    </button>
```

- [ ] **Step 5: Add product-detail floating button styles**

In `src/views/ProductDetailView.vue`, add these styles after the `.detail__buy-btn` rule and before `/* ---------- 规格弹层 ---------- */`:

```css
.detail__ai-consult {
  position: fixed;
  right: max(var(--space-4), calc((100vw - var(--mobile-max)) / 2 + var(--space-4)));
  bottom: calc(var(--shell-bottom-offset) + var(--action-bar-height) + var(--space-6));
  z-index: calc(var(--z-sticky) + 1);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 0 var(--space-3);
  border: 1px solid rgba(217, 113, 78, 0.28);
  border-radius: var(--radius-full);
  background: var(--color-coral);
  color: #fff;
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
  box-shadow: 0 10px 24px rgba(217, 113, 78, 0.28);
  transition: transform var(--dur-fast) var(--ease-spring), box-shadow var(--dur-base) var(--ease-out);
}

.detail__ai-consult:active {
  transform: scale(0.94);
  box-shadow: 0 6px 14px rgba(217, 113, 78, 0.22);
}
```

- [ ] **Step 6: Run the product-detail test to verify it passes**

Run:

```bash
npm run test:client -- src/tests/product-detail-ai-consult.test.js
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/views/ProductDetailView.vue src/tests/product-detail-ai-consult.test.js
git commit -m "feat: add product ai consult entry"
```

---

### Task 4: Build The AI Consultation Page

**Files:**
- Create: `src/tests/ai-consult-view.test.js`
- Create: `src/views/AiConsultView.vue`

- [ ] **Step 1: Write the failing consultation page tests**

Create `src/tests/ai-consult-view.test.js`:

```javascript
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCatalogStore } from '@/stores/catalog'
import AiConsultView from '@/views/AiConsultView.vue'

const product = {
  id: 'p-001',
  title: '鲜肉全价猫粮',
  subtitle: '低敏冷鲜配方',
  suitable: '适合 1-8 岁成猫 / 全品种',
  cover: '/images/products/cat-food.svg',
  price: 268,
  memberPrice: 248
}

async function mountAiConsult(path = '/ai-consult') {
  const pinia = createPinia()
  setActivePinia(pinia)

  const catalogStore = useCatalogStore()
  catalogStore.fetchProductDetail = vi.fn(async (id) => {
    if (id === product.id) {
      catalogStore.currentProduct = product
    }
  })
  catalogStore.$patch({
    currentProduct: null,
    loading: {
      ...catalogStore.loading,
      productDetail: false
    },
    error: {
      ...catalogStore.error,
      productDetail: ''
    }
  })

  const router = createRouter({
    history: createWebHashHistory(),
    routes: [{ path: '/ai-consult', name: 'ai-consult', component: AiConsultView }]
  })

  router.push(path)
  await router.isReady()

  const wrapper = mount(AiConsultView, {
    attachTo: document.body,
    global: {
      plugins: [router, pinia]
    }
  })

  await vi.dynamicImportSettled()
  await wrapper.vm.$nextTick()
  return { wrapper, catalogStore }
}

describe('AiConsultView', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('renders generic pre-sales questions without product context', async () => {
    const { wrapper, catalogStore } = await mountAiConsult()

    expect(catalogStore.fetchProductDetail).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('AI 售前咨询')
    expect(wrapper.text()).toContain('给猫咪选主粮')
    expect(wrapper.find('[data-test="consult-product-card"]').exists()).toBe(false)
  })

  it('loads and renders product context when productId is present', async () => {
    const { wrapper, catalogStore } = await mountAiConsult('/ai-consult?productId=p-001')

    expect(catalogStore.fetchProductDetail).toHaveBeenCalledWith('p-001')
    expect(wrapper.get('[data-test="consult-product-card"]').text()).toContain('鲜肉全价猫粮')
    expect(wrapper.text()).toContain('适合我家宠物吗')
  })

  it('adds user messages and simulated AI replies from quick questions', async () => {
    const { wrapper } = await mountAiConsult('/ai-consult?productId=p-001')

    await wrapper.get('[data-test="quick-question-0"]').trigger('click')

    expect(wrapper.text()).toContain('适合我家宠物吗')
    expect(wrapper.text()).toContain('我先按「鲜肉全价猫粮」帮你看')
  })

  it('sends typed messages and ignores empty input', async () => {
    const { wrapper } = await mountAiConsult()

    await wrapper.get('[data-test="consult-input"]').setValue('预算 200 怎么选')
    await wrapper.get('[data-test="consult-send"]').trigger('click')

    expect(wrapper.text()).toContain('预算 200 怎么选')
    expect(wrapper.text()).toContain('可以告诉我宠物类型、年龄、预算和想解决的问题')

    const messageCount = wrapper.findAll('.consult__message').length
    await wrapper.get('[data-test="consult-send"]').trigger('click')

    expect(wrapper.findAll('.consult__message')).toHaveLength(messageCount)
  })
})
```

- [ ] **Step 2: Run the consultation tests to verify they fail**

Run:

```bash
npm run test:client -- src/tests/ai-consult-view.test.js
```

Expected: FAIL because `src/views/AiConsultView.vue` does not exist.

- [ ] **Step 3: Implement `AiConsultView.vue` script and template**

Create `src/views/AiConsultView.vue` with this content:

```vue
<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import IconSvg from '@/components/IconSvg.vue'
import PriceText from '@/components/PriceText.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import { useCatalogStore } from '@/stores/catalog'

const route = useRoute()
const catalogStore = useCatalogStore()

const inputText = ref('')
const messages = ref([])
const productId = computed(() => route.query.productId || '')
const product = computed(() => {
  if (!productId.value) return null
  return catalogStore.currentProduct?.id === productId.value ? catalogStore.currentProduct : null
})
const hasProductContext = computed(() => Boolean(product.value))
const productHint = computed(() => product.value?.subtitle || product.value?.suitable || '已带入当前商品信息')

const genericQuestions = ['给猫咪选主粮', '挑选清洁用品', '怎么搭配新手礼包']
const productQuestions = ['适合我家宠物吗', '成分有什么特点', '怎么搭配购买']
const quickQuestions = computed(() => (hasProductContext.value ? productQuestions : genericQuestions))

watch(
  productId,
  (id) => {
    messages.value = []

    if (id) {
      catalogStore.fetchProductDetail(id)
    }
  },
  { immediate: true }
)

function buildReply() {
  if (hasProductContext.value) {
    return `我先按「${product.value.title}」帮你看。可以重点确认宠物年龄、体重、是否挑食或过敏，再决定规格和搭配。`
  }

  return '可以告诉我宠物类型、年龄、预算和想解决的问题，我会按主粮、零食、清洁或出行用品帮你筛选。'
}

function sendMessage(text = inputText.value) {
  const content = text.trim()

  if (!content) return

  messages.value.push({ id: `user-${Date.now()}-${messages.value.length}`, role: 'user', content })
  messages.value.push({ id: `ai-${Date.now()}-${messages.value.length}`, role: 'assistant', content: buildReply() })
  inputText.value = ''
}
</script>

<template>
  <div class="consult">
    <section class="consult__hero page-pad">
      <div class="consult__assistant">
        <span class="consult__avatar">
          <IconSvg name="chat" :size="24" :stroke="1.9" />
        </span>
        <div>
          <p class="consult__status">PetLife AI · 在线</p>
          <h1 class="consult__title font-display">AI 售前咨询</h1>
          <p class="consult__copy">告诉我宠物情况、预算和想解决的问题，先帮你把商品范围缩小。</p>
        </div>
      </div>
    </section>

    <div class="consult__body page-pad">
      <section v-if="catalogStore.loading.productDetail && productId" class="consult__product-loading">
        <SkeletonBlock variant="card" />
      </section>

      <section v-else-if="product" class="consult__product surface-card" data-test="consult-product-card">
        <img :src="product.cover" :alt="product.title" class="consult__product-cover" />
        <div class="consult__product-info">
          <span class="consult__product-label">正在咨询</span>
          <h2>{{ product.title }}</h2>
          <p>{{ productHint }}</p>
          <PriceText :value="product.memberPrice ?? product.price" size="md" />
        </div>
      </section>

      <section class="consult__quick">
        <p class="consult__section-label">快捷问题</p>
        <div class="consult__chips">
          <button
            v-for="(question, index) in quickQuestions"
            :key="question"
            type="button"
            class="consult__chip"
            :data-test="`quick-question-${index}`"
            @click="sendMessage(question)"
          >
            {{ question }}
          </button>
        </div>
      </section>

      <section class="consult__messages" aria-live="polite">
        <article class="consult__message consult__message--assistant">
          <span class="consult__message-avatar">
            <IconSvg name="service" :size="16" :stroke="1.9" />
          </span>
          <p>{{ hasProductContext ? `我看到你正在了解「${product.title}」。可以直接问适用、成分、规格或搭配。` : '欢迎咨询。你可以先告诉我宠物类型、年龄和预算。' }}</p>
        </article>

        <article
          v-for="message in messages"
          :key="message.id"
          class="consult__message"
          :class="`consult__message--${message.role}`"
        >
          <span v-if="message.role === 'assistant'" class="consult__message-avatar">
            <IconSvg name="service" :size="16" :stroke="1.9" />
          </span>
          <p>{{ message.content }}</p>
        </article>
      </section>
    </div>

    <form class="consult__composer" @submit.prevent="sendMessage()">
      <input
        v-model="inputText"
        data-test="consult-input"
        type="text"
        placeholder="输入你的问题"
        aria-label="输入咨询问题"
      />
      <button type="submit" data-test="consult-send" :disabled="!inputText.trim()">
        <IconSvg name="arrow-right" :size="18" :stroke="2.4" />
      </button>
    </form>
  </div>
</template>
```

- [ ] **Step 4: Add `AiConsultView.vue` styles**

Append this style block to `src/views/AiConsultView.vue`:

```vue
<style scoped>
.consult {
  min-height: calc(100dvh - var(--shell-bottom-offset));
  padding-bottom: calc(var(--shell-bottom-offset) + 84px);
}

.consult__hero {
  padding-top: var(--space-4);
}

.consult__assistant {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-5);
  border-radius: var(--radius-xl);
  background:
    linear-gradient(135deg, rgba(46, 74, 56, 0.96), rgba(106, 133, 114, 0.82)),
    var(--color-primary-deep);
  color: var(--color-text-invert);
  box-shadow: var(--shadow-brand);
}

.consult__avatar {
  display: grid;
  place-items: center;
  flex: 0 0 52px;
  width: 52px;
  height: 52px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.14);
}

.consult__status {
  color: rgba(247, 244, 236, 0.72);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
}

.consult__title {
  margin-top: 2px;
  font-size: var(--text-2xl);
  font-weight: var(--weight-semibold);
}

.consult__copy {
  margin-top: 4px;
  color: rgba(247, 244, 236, 0.76);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

.consult__body {
  display: grid;
  gap: var(--space-4);
  padding-top: var(--space-4);
}

.consult__product {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-xl);
}

.consult__product-cover {
  flex: 0 0 76px;
  width: 76px;
  height: 76px;
  border-radius: var(--radius-md);
  object-fit: cover;
  background: var(--color-surface-warm);
}

.consult__product-info {
  display: grid;
  align-content: center;
  gap: 3px;
  min-width: 0;
}

.consult__product-label,
.consult__section-label {
  color: var(--color-primary);
  font-size: var(--text-2xs);
  font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-wider);
}

.consult__product-info h2 {
  color: var(--color-text);
  font-size: var(--text-md);
  font-weight: var(--weight-bold);
  line-height: var(--leading-snug);
}

.consult__product-info p {
  color: var(--color-text-mute);
  font-size: var(--text-xs);
  line-height: var(--leading-relaxed);
}

.consult__quick {
  display: grid;
  gap: var(--space-2);
}

.consult__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.consult__chip {
  min-height: 34px;
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  color: var(--color-text-soft);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  box-shadow: var(--shadow-xs);
}

.consult__messages {
  display: grid;
  gap: var(--space-3);
}

.consult__message {
  display: flex;
  align-items: flex-end;
  gap: var(--space-2);
}

.consult__message p {
  max-width: min(78%, 300px);
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

.consult__message--assistant {
  justify-content: flex-start;
}

.consult__message--assistant p {
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg) var(--radius-lg) var(--radius-lg) 6px;
  background: var(--color-surface);
  color: var(--color-text-soft);
}

.consult__message--user {
  justify-content: flex-end;
}

.consult__message--user p {
  border-radius: var(--radius-lg) var(--radius-lg) 6px var(--radius-lg);
  background: var(--color-primary-deep);
  color: var(--color-text-invert);
}

.consult__message-avatar {
  display: grid;
  place-items: center;
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  background: var(--color-primary-tint);
  color: var(--color-primary);
}

.consult__composer {
  position: fixed;
  right: max(var(--space-4), calc((100vw - var(--mobile-max)) / 2 + var(--space-4)));
  bottom: calc(var(--shell-bottom-offset) + var(--space-4));
  left: max(var(--space-4), calc((100vw - var(--mobile-max)) / 2 + var(--space-4)));
  z-index: var(--z-sticky);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--color-surface) 94%, transparent);
  box-shadow: var(--shadow-float);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.consult__composer input {
  flex: 1;
  min-width: 0;
  height: 42px;
  padding: 0 var(--space-4);
  border-radius: var(--radius-full);
  background: var(--color-surface-warm);
  color: var(--color-text);
  font-size: var(--text-sm);
}

.consult__composer input::placeholder {
  color: var(--color-text-tint);
}

.consult__composer button {
  display: grid;
  place-items: center;
  flex: 0 0 42px;
  width: 42px;
  height: 42px;
  border-radius: var(--radius-full);
  background: var(--color-coral);
  color: #fff;
  transition: transform var(--dur-fast) var(--ease-spring), opacity var(--dur-base) var(--ease-out);
}

.consult__composer button:active:not(:disabled) {
  transform: scale(0.92);
}

.consult__composer button:disabled {
  opacity: 0.45;
}
</style>
```

- [ ] **Step 5: Run the consultation tests to verify they pass**

Run:

```bash
npm run test:client -- src/tests/ai-consult-view.test.js
```

Expected: PASS.

- [ ] **Step 6: Run all targeted client tests**

Run:

```bash
npm run test:client -- src/tests/home-view.test.js src/tests/router-shell.test.js src/tests/product-detail-ai-consult.test.js src/tests/ai-consult-view.test.js
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/views/AiConsultView.vue src/tests/ai-consult-view.test.js
git commit -m "feat: build ai consult page"
```

---

### Task 5: Final Verification And Visual Check

**Files:**
- No planned source edits unless verification finds a defect.

- [ ] **Step 1: Run the production build**

Run:

```bash
npm run build
```

Expected: PASS. Vite should build the new route chunk without unresolved imports.

- [ ] **Step 2: Run the full client test suite**

Run:

```bash
npm run test:client
```

Expected: PASS.

- [ ] **Step 3: Start the dev server**

Run:

```bash
npm run dev
```

Expected: Vite prints a local URL, usually `http://localhost:5173/`.

- [ ] **Step 4: Browser-check mobile UI**

Use the browser at a mobile-sized viewport around `390x844` and check:

- `/#/` shows the homepage AI consultation card below quick entries.
- Tapping the homepage card opens `/#/ai-consult`.
- `/#/product/p-001` shows the floating `AI咨询` button above the bottom purchase bar.
- Tapping the product-detail AI button opens `/#/ai-consult?productId=p-001`.
- On `/#/ai-consult?productId=p-001`, the product card, quick chips, messages, and composer do not overlap.

- [ ] **Step 5: Stop any dev server session**

If the dev server was started in a long-running terminal session, stop it before finishing.

- [ ] **Step 6: Commit fixes only if verification required source changes**

If Step 1-4 required code or test changes, run `git status --short`, add only the changed source/test files from this feature, and commit them:

```bash
git add src/router/index.js src/views/HomeView.vue src/views/ProductDetailView.vue src/views/AiConsultView.vue src/tests/search-route.test.js src/tests/router-shell.test.js src/tests/home-view.test.js src/tests/product-detail-ai-consult.test.js src/tests/ai-consult-view.test.js
git commit -m "fix: polish ai consult ui verification"
```

If no files changed, do not create an empty commit.

---

## Self-Review

- Spec coverage: The plan covers homepage inline entry, product-detail floating entry, `/ai-consult`, product context via `productId`, local messages, quick questions, tests, build, and visual verification.
- Placeholder scan: No `TBD`, `TODO`, or "implement later" placeholders are present.
- Type consistency: Route name is consistently `ai-consult`; query key is consistently `productId`; test selectors are consistently `home-ai-consult`, `detail-ai-consult`, `consult-product-card`, `quick-question-N`, `consult-input`, and `consult-send`.
