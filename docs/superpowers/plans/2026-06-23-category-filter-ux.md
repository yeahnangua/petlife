# Category Filter UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the category chips draggable horizontally and prevent product cards from flashing away during category switches.

**Architecture:** Keep the category page route query as the single shareable filter state. Preserve page components on same-path query changes in `App.vue`, then keep refresh behavior local to `CategoryView.vue` for drag-scroll chips and product-list updates.

**Tech Stack:** Vue 3 Composition API, Vue Router, Pinia catalog store, Vitest with Vue Test Utils.

---

### Task 1: Cover Category Page Refresh Behavior

**Files:**
- Create: `src/tests/category-view.test.js`

- [ ] **Step 1: Write the component tests**

Create `src/tests/category-view.test.js` with tests that mount `CategoryView`, mock the catalog store state, verify the chips expose a draggable scroll region, and verify existing product cards stay visible when `loading.products` becomes true after the first load.

- [ ] **Step 2: Run the focused test**

Run: `npm run test -- src/tests/category-view.test.js`

Expected: FAIL before implementation because the chips do not yet expose the drag-scroll attributes and the template still replaces cards with skeletons during every product load.

### Task 2: Implement Drag-Scrollable Chips

**Files:**
- Modify: `src/views/CategoryView.vue`

- [ ] **Step 1: Add drag state and pointer handlers**

Add refs for the chip scroller, drag state, pointer origin, and scroll origin. Implement `startChipDrag`, `dragChips`, `endChipDrag`, and `scrollActiveChipIntoView`.

- [ ] **Step 2: Wire handlers into the chips container**

Add `ref`, `role`, `aria-label`, pointer handlers, and drag-active class binding to `.category__chips`.

- [ ] **Step 3: Update chip CSS**

Set `cursor: grab`, `touch-action: pan-y`, `scroll-behavior: smooth`, `overscroll-behavior-x: contain`, and active dragging styles. Add a subtle after fade to indicate horizontal overflow.

### Task 3: Keep Cards Visible During Filter Refresh

**Files:**
- Modify: `src/views/CategoryView.vue`

- [ ] **Step 1: Track whether the first product load has rendered**

Add a computed `isInitialProductLoad` using `catalogStore.loading.products` and `catalogStore.productList.length`.

- [ ] **Step 2: Render skeletons only for initial load**

Change the skeleton branch to use `isInitialProductLoad`.

- [ ] **Step 3: Add a lightweight refresh indicator**

Keep the existing grid rendered while `catalogStore.loading.products` is true and `productList` is non-empty. Show a small `category__refreshing` status above the cards instead of replacing the cards.

### Task 4: Verify and Commit

**Files:**
- Test: `src/tests/category-view.test.js`
- Test: `src/tests/router-shell.test.js`
- Verify: `src/views/CategoryView.vue`
- Verify: `src/App.vue`

- [ ] **Step 1: Run the focused test**

Run: `npm run test -- src/tests/router-shell.test.js src/tests/category-view.test.js`

Expected: PASS.

- [ ] **Step 2: Run the client test suite**

Run: `npm run test`

Expected: PASS.

- [ ] **Step 3: Build the frontend**

Run: `npm run build`

Expected: PASS. The existing TensorFlow/MobileNet chunk size warning may remain.

- [ ] **Step 4: Commit**

Run:

```bash
git add src/App.vue src/views/CategoryView.vue src/tests/router-shell.test.js src/tests/category-view.test.js docs/superpowers/plans/2026-06-23-category-filter-ux.md
git commit -m "fix: smooth category filter switching"
```
