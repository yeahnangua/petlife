# PetLife MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recover the partially generated PetLife frontend, make the app buildable, and implement the missing pages, shared shell, and core product / booking logic against local mock data.

**Architecture:** Keep Claude's visual system and mock data, then layer in a thin application shell, route-aware page layout, and Pinia stores for cart, order confirmation, booking confirmation, and pet profile selection. Treat the mock files as the source of truth, expose derived selectors through focused helpers, and keep pages mostly presentational.

**Tech Stack:** Vue 3, Vite, Vue Router, Pinia, Vitest

---

## File Structure

- Create: `src/components/AppShell.vue`
- Create: `src/components/PageHeader.vue`
- Create: `src/components/BottomTabBar.vue`
- Create: `src/components/PetChipSwitch.vue`
- Create: `src/components/ProductCard.vue`
- Create: `src/components/ServiceCard.vue`
- Create: `src/components/OrderCard.vue`
- Create: `src/components/EmptyState.vue`
- Create: `src/lib/catalog.js`
- Create: `src/lib/pricing.js`
- Create: `src/stores/cart.js`
- Create: `src/stores/booking.js`
- Create: `src/stores/profile.js`
- Create: `src/views/HomeView.vue`
- Create: `src/views/CategoryView.vue`
- Create: `src/views/ProductListView.vue`
- Create: `src/views/ProductDetailView.vue`
- Create: `src/views/ServiceView.vue`
- Create: `src/views/ServiceDetailView.vue`
- Create: `src/views/CartView.vue`
- Create: `src/views/OrderConfirmView.vue`
- Create: `src/views/BookingConfirmView.vue`
- Create: `src/views/OrderListView.vue`
- Create: `src/views/ProfileView.vue`
- Create: `src/views/PetProfileView.vue`
- Create: `src/views/MemberView.vue`
- Create: `src/tests/catalog.test.js`
- Create: `src/tests/pricing.test.js`
- Create: `src/tests/router-shell.test.js`
- Modify: `package.json`
- Modify: `src/main.js`
- Modify: `src/router/index.js`

### Task 1: Recover the runtime shell and test harness

**Files:**
- Modify: `package.json`
- Modify: `src/main.js`
- Create: `src/components/AppShell.vue`
- Create: `src/components/PageHeader.vue`
- Create: `src/components/BottomTabBar.vue`
- Create: `src/tests/router-shell.test.js`

- [ ] **Step 1: Write the failing shell test**

```js
import { describe, expect, it } from 'vitest'
import { createRouter, createWebHashHistory } from 'vue-router'
import { mount } from '@vue/test-utils'
import App from '../App.vue'

describe('App shell', () => {
  it('shows the active tab label for tab routes', async () => {
    const router = createRouter({
      history: createWebHashHistory(),
      routes: [{ path: '/', component: { template: '<div>home</div>' }, meta: { tab: 'home', title: '首页' } }]
    })
    router.push('/')
    await router.isReady()

    const wrapper = mount(App, { global: { plugins: [router] } })

    expect(wrapper.text()).toContain('首页')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/tests/router-shell.test.js`
Expected: FAIL because `AppShell.vue` does not exist and Vitest is not configured yet.

- [ ] **Step 3: Add the test toolchain and minimal shell**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "pinia": "^2.1.7",
    "vue": "^3.4.21",
    "vue-router": "^4.3.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.4",
    "@vue/test-utils": "^2.4.5",
    "jsdom": "^24.0.0",
    "vite": "^5.2.8",
    "vitest": "^1.5.0"
  }
}
```

```vue
<template>
  <div class="app-shell">
    <main class="app-shell__viewport">
      <slot />
    </main>
    <BottomTabBar />
  </div>
</template>
```

- [ ] **Step 4: Run the shell test again**

Run: `npm test -- src/tests/router-shell.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json src/main.js src/components/AppShell.vue src/components/PageHeader.vue src/components/BottomTabBar.vue src/tests/router-shell.test.js
git commit -m "feat: recover petlife app shell"
```

### Task 2: Add deterministic selectors for products, services, and pricing

**Files:**
- Create: `src/lib/catalog.js`
- Create: `src/lib/pricing.js`
- Create: `src/tests/catalog.test.js`
- Create: `src/tests/pricing.test.js`

- [ ] **Step 1: Write the failing catalog test**

```js
import { describe, expect, it } from 'vitest'
import { getFeaturedProducts, getRecommendedBundles } from '../lib/catalog'

describe('catalog helpers', () => {
  it('filters featured products by pet type and preserves all-type products', () => {
    const catProducts = getFeaturedProducts('cat')
    expect(catProducts.every((item) => item.petType === 'cat' || item.petType === 'all')).toBe(true)
  })
})
```

- [ ] **Step 2: Write the failing pricing test**

```js
import { describe, expect, it } from 'vitest'
import { getCartSummary } from '../lib/pricing'
import { cartItems } from '../mocks'

describe('pricing helpers', () => {
  it('only totals selected and valid cart items', () => {
    const summary = getCartSummary(cartItems)
    expect(summary.selectedCount).toBe(3)
    expect(summary.invalidCount).toBe(1)
    expect(summary.total).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm test -- src/tests/catalog.test.js src/tests/pricing.test.js`
Expected: FAIL because helper modules do not exist.

- [ ] **Step 4: Implement the minimal selectors**

```js
export function getFeaturedProducts(petType, products) {
  return products.filter((item) => item.petType === petType || item.petType === 'all').slice(0, 4)
}

export function getCartSummary(items) {
  const validSelected = items.filter((item) => item.valid && item.selected)
  return {
    selectedCount: validSelected.reduce((sum, item) => sum + item.quantity, 0),
    invalidCount: items.filter((item) => !item.valid).length,
    total: validSelected.reduce((sum, item) => sum + item.quantity * item.product.memberPrice, 0)
  }
}
```

- [ ] **Step 5: Run the helper tests again**

Run: `npm test -- src/tests/catalog.test.js src/tests/pricing.test.js`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/catalog.js src/lib/pricing.js src/tests/catalog.test.js src/tests/pricing.test.js
git commit -m "feat: add petlife catalog helpers"
```

### Task 3: Add Pinia stores for cart, booking, and profile flows

**Files:**
- Create: `src/stores/cart.js`
- Create: `src/stores/booking.js`
- Create: `src/stores/profile.js`
- Modify: `src/main.js`
- Test: `src/tests/pricing.test.js`

- [ ] **Step 1: Extend tests with one failing store behavior**

```js
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from '../stores/cart'

it('toggles cart item selection and recalculates totals', () => {
  setActivePinia(createPinia())
  const store = useCartStore()
  store.toggleSelection('ci-3')
  expect(store.summary.selectedCount).toBe(4)
})
```

- [ ] **Step 2: Run the store test to verify it fails**

Run: `npm test -- src/tests/pricing.test.js`
Expected: FAIL because `useCartStore` does not exist yet.

- [ ] **Step 3: Implement the stores**

```js
export const useCartStore = defineStore('cart', {
  state: () => ({ items: structuredClone(cartItems) }),
  getters: { summary: (state) => getCartSummary(state.items) },
  actions: {
    toggleSelection(id) {
      const item = this.items.find((entry) => entry.id === id)
      if (item?.valid) item.selected = !item.selected
    }
  }
})
```

```js
export const useBookingStore = defineStore('booking', {
  state: () => ({ serviceId: null, petId: null, date: null, slotId: null, storeId: null, note: '', phone: user.phone.replace(' **** ', '') })
})
```

- [ ] **Step 4: Re-run the store test**

Run: `npm test -- src/tests/pricing.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/main.js src/stores/cart.js src/stores/booking.js src/stores/profile.js src/tests/pricing.test.js
git commit -m "feat: add petlife pinia stores"
```

### Task 4: Implement the page set and route-connected interactions

**Files:**
- Create: `src/views/HomeView.vue`
- Create: `src/views/CategoryView.vue`
- Create: `src/views/ProductListView.vue`
- Create: `src/views/ProductDetailView.vue`
- Create: `src/views/ServiceView.vue`
- Create: `src/views/ServiceDetailView.vue`
- Create: `src/views/CartView.vue`
- Create: `src/views/OrderConfirmView.vue`
- Create: `src/views/BookingConfirmView.vue`
- Create: `src/views/OrderListView.vue`
- Create: `src/views/ProfileView.vue`
- Create: `src/views/PetProfileView.vue`
- Create: `src/views/MemberView.vue`
- Create: `src/components/PetChipSwitch.vue`
- Create: `src/components/ProductCard.vue`
- Create: `src/components/ServiceCard.vue`
- Create: `src/components/OrderCard.vue`
- Create: `src/components/EmptyState.vue`
- Modify: `src/router/index.js`

- [ ] **Step 1: Write one failing route integration test**

```js
import { mount } from '@vue/test-utils'
import { createRouter, createWebHashHistory } from 'vue-router'
import { describe, expect, it } from 'vitest'
import HomeView from '../views/HomeView.vue'

describe('Home view', () => {
  it('renders the service section entry point', () => {
    const wrapper = mount(HomeView)
    expect(wrapper.text()).toContain('热门服务')
  })
})
```

- [ ] **Step 2: Run the integration test to verify it fails**

Run: `npm test -- src/tests/router-shell.test.js`
Expected: FAIL because the view and its dependent components do not exist yet.

- [ ] **Step 3: Implement the views with mock-driven interactions**

```vue
<script setup>
import { computed, ref } from 'vue'
import { products, bundles, services, quickEntries } from '@/mocks'

const petType = ref('cat')
const featuredProducts = computed(() => getFeaturedProducts(petType.value, products))
</script>
```

```vue
<template>
  <section>
    <SectionHeader title="热门服务" action-label="查看全部" />
    <ServiceCard v-for="service in featuredServices" :key="service.id" :service="service" />
  </section>
</template>
```

- [ ] **Step 4: Run the route integration test and then the full test suite**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components src/views src/router/index.js src/tests/router-shell.test.js
git commit -m "feat: add petlife mvp views"
```

### Task 5: Verify the end-to-end MVP build

**Files:**
- Modify: any files touched in previous tasks if verification exposes layout or state defects

- [ ] **Step 1: Run the automated tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 2: Run the production build**

Run: `npm run build`
Expected: PASS with generated assets under `dist/`

- [ ] **Step 3: Manually verify the two primary flows**

Run: `npm run dev`
Expected:
- Home -> Product detail -> Cart -> Order confirm is navigable
- Home -> Service detail -> Booking confirm is navigable
- Orders and Profile tabs render without missing component errors

- [ ] **Step 4: Commit**

```bash
git add src package.json vite.config.js
git commit -m "feat: finish petlife mvp"
```
