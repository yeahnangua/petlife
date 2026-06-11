# PetLife 双端 UI 重写实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> **REQUIRED SUB-SKILL（实现 UI 时）:** frontend-design:frontend-design——所有视觉代码必须在该技能的设计原则下创作。

**Goal:** 在 `redesign/ui` 分支上，保持功能与逻辑层完全不变，重写用户端（竖屏移动端）与管理后台（横屏桌面端）的全部 UI，达到"暖色品牌进化"的现代精美质感。

**Architecture:** 保留 api/adapters/stores/router/lib/content/mocks 与全部 store 级测试；删除重写 views/components/styles/外壳。设计系统先行（tokens → 图标 → 外壳 → 通用组件），页面按链路分批重写，最后实机走查。token 变量名与旧版兼容（只换值），使过渡期旧页面不至于全面崩坏。

**Tech Stack:** Vue 3 `<script setup>` + Pinia + Vue Router(hash) + 手写 scoped CSS + 全局 design tokens。零新依赖。

**对照规范:** `docs/superpowers/specs/2026-06-11-ui-redesign-design.md`

**计划体例说明:** 本计划锁定**数据契约、结构、业务规则与验证步骤**（全部精确给出）；页面的视觉创作（具体配色运用、排版、动效细节）由实现者按规范第 4 节视觉语言 + frontend-design 技能现场创作，不在计划中逐行预写装饰性 CSS。旧实现随时可用 `git show main:<path>` 回查。

---

## 数据契约总表（实现时唯一依据，禁止凭记忆编造字段）

### 用户端 store 形状（全部保留不动）

**useCatalogStore**（`src/stores/catalog.js`）
- state: `categories[]`, `homeProducts[]`, `homeServices[]`, `productList[]`, `productPagination{page,pageSize,total,totalPages}`, `productFilters{petType,categoryId,keyword,page,pageSize}`, `currentProduct`, `relatedProducts[]`, `serviceList[]`, `servicePagination`, `serviceFilters{petType,category,page,pageSize}`, `currentService`, `serviceStores[]`, `serviceDates[{date,label,weekday}]`, `serviceSlots[]`, `selectedStoreId`, `selectedSlotDate`, `loading.{home,products,productDetail,services,serviceDetail,slots}`, `error.{同}`
- getters: `categoriesByPetType(petType)`, `serviceHasBookableSlot`
- actions: `ensureCategories()`, `fetchHomeData(petType)`, `fetchProductList(filters)`, `fetchProductDetail(id)`, `fetchServiceList(filters)`, `fetchServiceDetail(id)`, `fetchServiceSlots({serviceId,storeId,date})`, `selectServiceStore(storeId)`, `selectServiceDate(date)`, `resolveCategoryId(value,petType)`

**useCartStore**：state `items[]`(适配后字段: `id,productId,specKey,specLabel,quantity,selected,valid,invalidReason,product`), `hydrated,loading,error,submitting`；getters `summary{selectedCount,invalidCount,subtotal,total}`, `selectedItems`, `invalidItems`；actions `fetchCart()`, `toggleSelection(id)`, `updateQuantity(id,delta)`, `setQuantity(id,qty)`, `addProduct(product,specLabel,quantity=1,specKey?)`, `removeItem(id)`, `clearInvalidItems()`

**useBookingStore**：state `serviceId,serviceTitle,serviceCover,servicePrice,serviceDuration,storeOptions[],timeSlots[],dateOptions[],petId,date,slotId,storeId,note,phone,loading,submitting,error,currentBooking,currentBookingDetail`；getters `isReady`(五项齐), `currentService`；actions `prepareFromService(service,selection?)`, `setPet(id)`, `setDate(date)`, `setSlot(id)`, `setStore(id)`, `fetchSlots()`, `submitBooking()`(payload: `pet_id,service_id,store_id,time_slot_id,booking_date,contact_phone,note`), `fetchBookingDetail(id)`, `cancelBooking(id)`

**useProfileStore**：state `profile,pets[],activePetType,selectedPetId,loading,saving,error`；getters `hasPets,filteredPets,selectedPet`；actions `setPetType(v)`, `setSelectedPet(id)`, `fetchProfile()`, `updateProfile({nickname,phone,avatar})`, `fetchPets()`, `savePet(payload)`, `deletePet(id)`。宠物 payload 字段：`name,type('cat'|'dog'),breed,gender,birthday,weight,neutered,allergies[],preferences[],avatar,color`

**useAccountStore**：state `productOrders[],serviceBookings[],loading,error`；getters `allOrders`, `pendingShipmentCount`, `pendingServiceCount`；action `fetchOrdersAndBookings()`

### 适配后的数据形状（视图直接消费）

- **product**: `id,categoryId,category(slug),title,subtitle,petType,price,memberPrice,originalPrice,stockStatus('inStock'|'soldOut'),badge,tags[],specs[],summary[],suitable,cover,rating,reviewCount,sold,gradient[2]`；detail 额外 `images[]`
- **service**: `id,category,title,tagline,subtitle,petType,price,memberPrice,originalPrice,duration(分钟),badge,includes[],suitable[],tips[],cover,rating,reviewCount,gradient`；detail 额外 `images[]`
- **store**: `id,name,phone,address,businessHours,cover,status`
- **slot**: `id,label,capacity,used,remaining,available`
- **order**(商品订单): `id,kind:'product',orderNo,status,statusLabel,createdAt,totalAmount,subtotalAmount,shippingAmount,payableAmount,itemCount,address,remark,items[{id,productId,title,cover,specLabel,quantity,unitPrice,totalAmount}]`
- **booking**(服务预约): `id,kind:'service',orderNo,status,statusLabel,createdAt,totalAmount,service{title,cover},pet{name,avatar},scheduledAt,store`
- **profile**: `id,nickname,avatar,phone,level,joinDate,points,couponCount,stats{orderCount,serviceCount,savedAmount}`
- **address**: `id,name,phone,region,detail,tag,isDefault,displayAddress`
- **pet**: `id,name,type,breed,gender,birthday,age(计算),weight,neutered,allergies[],preferences[],avatar,color`

### 关键 API payload（snake_case，禁止改）

- 加购：`{product_id, spec_key, spec_label, quantity}`（store 已封装）
- 下单：`createOrder({address_id, remark})`——商品项由服务端取购物车选中项
- 地址：`{receiver_name, receiver_phone, region, detail_address, tag, is_default}`
- 上传：`uploadImage(file)` → POST FormData(`file`) → 返回 `data.url`（实现时用 `git show main:src/components/ImageUploadField.vue` 核对返回字段名）
- 订单状态: `pendingPayment? → 实际枚举见 enumLabels`；用户端取消：`cancelOrder(id)/cancelBooking(id)`

### 静态内容（content/，视图直接渲染）

- `quickEntries[8]`: `{id,label,icon,tone}`，icon ∈ bowl,bone,ball,drop,bath,scissor,home,gift
- `serviceCategories[4]`: bath/beauty/health/boarding + icon,tone
- `primaryCategories[3]`: cat/dog/all
- `bundles[3]`: `{id,title,subtitle,petType,price,originalPrice,itemCount,tag,productIds,gradient,image}`
- `memberBenefits[6]`: `{id,title,desc,icon(price,gift,calendar,leaf,star,chat),tone}`；`newbiePack{title,subtitle,items[{label,desc}]}`

### 后台契约

- **useSessionStore**: state `adminKey`；getter `isAuthenticated`；actions `login(value)`, `logout()`；key 存 localStorage `petlife.admin.key`；401 → `handleUnauthorized()` → 路由守卫回 /login
- **admin useCatalogStore**: state `categories/products/services/stores/timeSlots` + `loading.{categories,products,services,stores,timeSlots}` + `saving.{category,product,service,store,timeSlot}` + `error` + `dialogs.{category,product,service,store,timeSlot}={open,item}`；actions `openDialog(type,item?)`, `closeDialog(type)`, `fetch×5`, `save×5(payload,id?)`, `remove×5(id)`；getter `enabledCategories`
- **useOperationsStore**: state `orders[],bookings[],currentOrder,currentBooking,loading.{orders,bookings,orderDetail,bookingDetail},submitting,error`；actions `fetchOrders(status='')`, `fetchOrderDetail(id)`, `changeOrderStatus(id,status)`, `fetchBookings(status='')`, `fetchBookingDetail(id)`, `changeBookingStatus(id,status)`（fetch 列表后若无 current 自动加载第一条详情）
- **后台表单字段（与旧版完全一致，逐字段照搬）**：
  - 分类: `name, slug, pet_type, sort_order, is_enabled, cover_url`
  - 商品: `category_id, title, subtitle, pet_type, price, member_price, original_price, stock, stock_status, badge, tags_text→tags[], specs_text(JSON)→specs, summary_text(每行一条)→summary[], suitable_text, cover_url, status, image_urls[]`
  - 服务: `title, subtitle, pet_type, status, price, member_price, original_price, duration_minutes, badge, highlights_text→highlights[], summary_text→summary[], notice_text→notice[], cover_url, image_urls[]`
  - 门店: `name, phone, address, business_hours, status, cover_url`
  - 时段: `label, start_time(time), end_time(time), capacity, sort_order, is_enabled`
  - 序列化逻辑（text→数组、JSON 解析、数字化）**必须**从 `git show main:admin/src/components/<X>FormDialog.vue` 照搬，不得重新发明
- **enumLabels**（保留文件）：petType(猫咪/狗狗/通用)、publishStatus(active 启用中/inactive 已停用)、stockStatus(inStock/soldOut)、orderStatus(pendingShipment 待发货/completed/cancelled)、bookingStatus(pendingService 待服务/completed/cancelled)、`getDisplayStatusLabel(status,label)`
- Dashboard 数据源：并行 `listCategories/listProducts/listServices/listStores/listOrders({status:'pendingShipment'})/listBookings({status:'pendingService'})`，取各 `list.length` 计数

### 全局禁改清单

`server/**`、`src/{api,adapters,stores,lib,content,mocks}/**`、`src/router/index.js`、`src/main.js`、`admin/src/{api,stores,utils}/**`、`admin/src/router/index.js`、`admin/src/main.js`、两个 `vite.config.js`、3.1 节列出的 9 个 store 级测试文件。

---

## Phase 0 · 基线

### Task 0: 基线测试

- [ ] 确认在 `redesign/ui` 分支：`git branch --show-current`
- [ ] 跑三套测试记录基线：
  - `npm test`（根目录，用户端）→ 期望全绿
  - `npm run test:admin` → 期望全绿
  - `npm run test:server` → 期望全绿
- [ ] 若基线即有红测，停下来排查环境（依赖未装则 `npm install`），不得带病开工

## Phase 1 · 用户端设计系统地基

### Task 1: 全新 design tokens + 基础样式 + index.html

**Files:** 重写 `src/styles/tokens.css`、`src/styles/base.css`、`src/styles/index.css`、`index.html`

- [ ] **Step 1: 写入新 tokens.css**（变量名保持旧版兼容，值全面升级；以下为完整基准，实现时可微调色值但不得改名）：

```css
:root {
  /* Surface */
  --color-bg: #FAF8F3;
  --color-bg-deep: #F3EFE6;
  --color-surface: #FFFFFF;
  --color-surface-soft: #FCFBF7;
  --color-surface-warm: #F4F0E7;
  /* Brand */
  --color-primary: #4A6B57;
  --color-primary-deep: #28402F;
  --color-primary-soft: #DFE9E0;
  --color-primary-tint: #F0F4EE;
  /* Accent */
  --color-coral: #D9714E;
  --color-coral-soft: #F8E3D8;
  --color-amber: #C99A45;
  --color-amber-soft: #F4E7CC;
  --color-clay: #B58463;
  --color-sky: #87A0B2;
  /* Text */
  --color-text: #23211C;
  --color-text-soft: #57544C;
  --color-text-mute: #8B867C;
  --color-text-tint: #BBB5A9;
  --color-text-invert: #F7F4EC;
  /* Border */
  --color-border: #E9E3D6;
  --color-border-soft: #F0EBE0;
  --color-divider: #EDE8DC;
  /* State */
  --color-success: #4F7F60;
  --color-warning: #C99A45;
  --color-danger: #C25B49;
  --color-info: #87A0B2;
  --color-disabled: #C9C3B7;
  /* Radius */
  --radius-xs: 8px; --radius-sm: 12px; --radius-md: 16px;
  --radius-lg: 20px; --radius-xl: 26px; --radius-2xl: 32px; --radius-full: 999px;
  /* Spacing 4pt */
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-7: 28px; --space-8: 32px;
  --space-10: 40px; --space-12: 48px; --space-14: 56px; --space-16: 64px;
  /* Shadow（低调单层为主） */
  --shadow-xs: 0 1px 2px rgba(35, 33, 28, 0.05);
  --shadow-sm: 0 2px 6px rgba(35, 33, 28, 0.06);
  --shadow-md: 0 6px 16px rgba(35, 33, 28, 0.07);
  --shadow-lg: 0 14px 32px rgba(35, 33, 28, 0.10);
  --shadow-float: 0 10px 26px rgba(40, 64, 47, 0.16);
  --shadow-brand: 0 8px 20px rgba(40, 64, 47, 0.22);
  --shadow-coral: 0 8px 20px rgba(217, 113, 78, 0.22);
  --shadow-inset: inset 0 0 0 1px rgba(35, 33, 28, 0.05);
  /* Typography */
  --font-display: 'Fraunces', 'Noto Serif SC', 'Songti SC', serif;
  --font-body: 'Manrope', -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  --font-mono: 'SF Mono', Menlo, ui-monospace, monospace;
  --text-2xs: 10px; --text-xs: 11px; --text-sm: 12px; --text-base: 13px;
  --text-md: 14px; --text-body: 15px; --text-lg: 16px; --text-xl: 18px;
  --text-2xl: 22px; --text-3xl: 26px; --text-4xl: 32px; --text-display: 40px;
  --weight-regular: 400; --weight-medium: 500; --weight-semibold: 600; --weight-bold: 700;
  --leading-tight: 1.2; --leading-snug: 1.35; --leading-normal: 1.5; --leading-relaxed: 1.7;
  --tracking-tight: -0.02em; --tracking-normal: 0; --tracking-wide: 0.04em; --tracking-wider: 0.1em;
  /* Layout */
  --mobile-max: 430px;
  --page-padding: 20px;
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-top: env(safe-area-inset-top, 0px);
  --tabbar-height: 62px;
  --action-bar-height: 64px;
  /* Motion */
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-spring: cubic-bezier(0.34, 1.3, 0.5, 1);
  --dur-fast: 140ms; --dur-base: 220ms; --dur-slow: 360ms;
  /* Z */
  --z-header: 40; --z-sticky: 50; --z-modal: 70; --z-toast: 90;
}
```

- [ ] **Step 2: 重写 base.css**：现代 reset、`body` 用 `--font-body`/`--color-text`/`--color-bg`、`-webkit-tap-highlight-color: transparent`、全局滚动条隐藏（移动端观感）、`img` 块级默认、按钮/输入框样式归零、`.font-display` 工具类、骨架屏 shimmer keyframes、通用渐入 keyframes
- [ ] **Step 3: index.css** 仅做 `@import './tokens.css'; @import './base.css';`
- [ ] **Step 4: 重写 index.html**：保留 viewport/fonts 引入（Fraunces+Manrope+新增 Noto Serif SC），`theme-color` 改为 `#FAF8F3`，title 不变
- [ ] **Step 5: 验证**：`npm test` 全绿（store 测试不受影响）；`npm run dev` 启动确认无编译错误（旧页面允许观感过渡）
- [ ] **Step 6: Commit** `git add -A && git commit -m "feat(client): new design tokens and base styles"`

### Task 2: IconSvg 图标系统

**Files:** 重写 `src/components/IconSvg.vue`

- [ ] **Step 1:** 新组件契约：`props: { name: String(required), size: [Number,String](default 20), stroke: [Number,String](default 1.8) }`，渲染 24×24 viewBox 的 stroke 线性圆角图标（`stroke-linecap/linejoin: round`，`currentColor`）
- [ ] **Step 2:** 必须覆盖的图标名（内容文件引用 + 导航 + 通用操作，缺一不可）：
  `bowl, bone, ball, drop, bath, scissor, home, gift, price, calendar, leaf, star, chat, paw, home-fill, grid, spa, receipt, user, cart, search, back, chevron-right, chevron-down, chevron-left, plus, minus, close, check, location, phone, clock, edit, trash, camera, heart, shield, truck, wallet, coupon, settings, logout, image, empty`
- [ ] **Step 3:** 验证：临时在任意页渲染全部图标肉眼检查（或写一次性 demo 路由后删除）；`npm test` 全绿
- [ ] **Step 4: Commit** `feat(client): redraw linear icon set`

### Task 3: 应用外壳（App/TopBar/TabBar）+ 外壳测试

**Files:** 重写 `src/App.vue`；新建 `src/components/TopBar.vue`、`src/components/TabBar.vue`；删除 `src/components/AppShell.vue`、`PageHeader.vue`、`BottomTabBar.vue`；重写 `src/tests/router-shell.test.js`

**契约：**
- `App.vue`：`.app` 容器（桌面限宽居中：`max-width: var(--mobile-max); margin: 0 auto`，外层 `.app-stage` 铺品牌底色）；内部结构 `TopBar`（仅二级页，`route.meta.tab` 不存在时显示，含返回按钮+标题）→ `<main class="app__viewport">`（router-view + transition `fade-slide`）→ `TabBar`（仅 `route.meta.tab` 存在时）；在根元素上绑定 `:style="{ '--shell-bottom-offset': ... }"`，tab 页为 `calc(var(--tabbar-height) + var(--safe-bottom))`，否则 `var(--safe-bottom)`
- `TopBar`：props `title`；返回按钮 `router.back()`；类名 `.top-bar`
- `TabBar`：5 项（首页 `/`、分类 `/category`、服务 `/service`、订单 `/orders`、我的 `/profile`），图标+文字，激活态由 `route.meta.tab` 匹配；类名 `.tab-bar`、`.tab-bar__item`、激活 `.tab-bar__item--active`；订单项渲染 `.tab-bar__dot`（当 `pendingShipmentCount + pendingServiceCount > 0`）；**只读 store state，不发起请求**（fetch 由页面负责）——这是测试不打网络的前提

- [ ] **Step 1: 先写失败测试** —— 重写 `src/tests/router-shell.test.js` 为以下完整内容：

```js
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import { describe, expect, it } from 'vitest'
import App from '@/App.vue'

function makeRouter(routes) {
  return createRouter({ history: createWebHashHistory(), routes })
}

async function mountApp(routes, path) {
  const router = makeRouter(routes)
  router.push(path)
  await router.isReady()
  return mount(App, { global: { plugins: [router, createPinia()] } })
}

describe('app shell', () => {
  it('renders the bottom tab bar on primary tab routes', async () => {
    const wrapper = await mountApp(
      [{ path: '/', component: { template: '<section>home</section>' }, meta: { tab: 'home', title: '首页' } }],
      '/'
    )
    expect(wrapper.find('.tab-bar').exists()).toBe(true)
    expect(wrapper.attributes('style')).toContain('--shell-bottom-offset: calc(var(--tabbar-height) + var(--safe-bottom))')
  })

  it('hides the tab bar and shows the top bar on secondary routes', async () => {
    const wrapper = await mountApp(
      [{ path: '/product/demo', component: { template: '<section>detail</section>' }, meta: { title: '商品详情' } }],
      '/product/demo'
    )
    expect(wrapper.find('.tab-bar').exists()).toBe(false)
    expect(wrapper.find('.top-bar').exists()).toBe(true)
    expect(wrapper.find('.top-bar').text()).toContain('商品详情')
    expect(wrapper.attributes('style')).toContain('--shell-bottom-offset: var(--safe-bottom)')
  })
})
```

- [ ] **Step 2:** `npx vitest run src/tests/router-shell.test.js` → 期望 FAIL（新结构未实现）
- [ ] **Step 3:** 实现 App.vue/TopBar/TabBar（按上方契约），删除三个旧外壳组件
- [ ] **Step 4:** `npx vitest run src/tests/router-shell.test.js` → PASS；`npm test` 检查无其他破坏（注意：旧视图不 import 这三个外壳组件，删除安全；若 grep 发现引用则该视图任务提前处理）
- [ ] **Step 5:** `grep -rn "AppShell\|PageHeader\|BottomTabBar" src/ || true` → 无结果
- [ ] **Step 6: Commit** `feat(client): new app shell with top bar and tab bar`

## Phase 2 · 用户端通用组件

### Task 4: 基础组件批

**Files:** 新建 `src/components/`：`SectionHeading.vue`、`ChipSwitch.vue`、`PriceText.vue`、`StatusBadge.vue`、`SkeletonBlock.vue`、`EmptyState.vue`（重写旧文件）、`Toast.vue` + `src/composables/useToast.js`、`ConfirmDialog.vue`、`BottomSheet.vue`、`StickyActionBar.vue`、`Stepper.vue`、`FormField.vue`

**契约（props/emits 必须按此实现）：**
- `SectionHeading`: props `{eyebrow?, title, more?}` emit `more`（右侧"查看全部"）
- `ChipSwitch`: props `{modelValue, options:[{value,label,icon?}]}` emit `update:modelValue`（猫/狗切换等通用 chip 单选；替代旧 PetChipSwitch）
- `PriceText`: props `{value, size?('sm'|'md'|'lg'|'xl'), original?, prefix?='¥'}`，衬线数字，原价删除线
- `StatusBadge`: props `{status, label?}`；色调映射：`pendingPayment/pendingShipment/pendingService→warning`、`pendingReceipt/upcoming/inService→info`、`completed→success`、`cancelled→neutral`、`soldOut→danger`；label 缺省用 statusLabel 直接传入
- `SkeletonBlock`: props `{variant:('text'|'card'|'avatar'|'image'), lines?}`
- `EmptyState`: props `{icon?, title, desc?, actionLabel?}` emit `action`
- `Toast`/`useToast()`: `toast(message, type?('info'|'success'|'error'))`，单例挂载于 App.vue，自动消失
- `ConfirmDialog`: props `{open, title, desc?, confirmLabel?='确认', danger?}` emits `confirm,cancel`
- `BottomSheet`: props `{open, title?}` emit `close`，底部弹层 + 遮罩 + 上滑动画，内容用 slot
- `StickyActionBar`: 无 props，固定于外壳底部（`bottom: var(--shell-bottom-offset)` 之上的 sticky 容器），类名 `.sticky-bar`，slot 排布
- `Stepper`: props `{modelValue, min?=1, max?}` emit `update:modelValue`
- `FormField`: props `{label, required?, error?, hint?}`，slot 放控件，统一表单行布局

- [ ] **Step 1:** 实现以上组件（视觉按 tokens；全部 `<script setup>` + scoped CSS）
- [ ] **Step 2:** `npm test` 全绿（旧 EmptyState 的消费者是旧视图，props `title/desc/actionLabel` 命名保持一致以免过渡期报错；用 `git show main:src/components/EmptyState.vue` 核对旧 props 名）
- [ ] **Step 3: Commit** `feat(client): base ui component kit`

### Task 5: 卡片与上传组件批

**Files:** 重写 `src/components/ProductCard.vue`、`ServiceCard.vue`、`OrderCard.vue`、`ImageUploadField.vue`；新建 `src/components/PetCard.vue`

**契约：**
- `ProductCard`: props `{product}`（消费 cover,title,subtitle,memberPrice,price,originalPrice,badge,tags,rating,sold,stockStatus）；整卡点击 `router.push({name:'product-detail',params:{id}})`；`soldOut` 置灰角标
- `ServiceCard`: props `{service, layout?('row'|'hero')}`；点击去 service-detail；展示 duration(`{n}分钟`)、rating、memberPrice
- `OrderCard`: props `{order}`，兼容两种 kind：product（首件商品图+标题+件数+金额+StatusBadge）/ service（service.cover+title+pet.name+scheduledAt+store+金额+StatusBadge）；点击分别去 order-detail / booking-detail
- `PetCard`: props `{pet, active?}` emit `select,edit`；展示 avatar(无则用 paw 图标+pet.color 底色)、name、breed、age、weight、neutered 标签
- `ImageUploadField`: 契约与旧版一致——props/emits 用 `git show main:src/components/ImageUploadField.vue` 核对后照搬（v-model、`uploadImage` API、上传中/失败态），只重写视觉

- [ ] **Step 1:** 实现 5 个组件
- [ ] **Step 2:** `npm test` 全绿
- [ ] **Step 3: Commit** `feat(client): card components and upload field`

## Phase 3 · 用户端页面（每任务：实现 → `npm test` 全绿 → commit）

> 每个页面任务开工前：`git show main:src/views/<X>.vue` 通读旧实现，列出其全部交互与数据绑定，新页面逐项对齐。下方"绑定"仅是锚点提示，不是完整清单。

### Task 6: 首页 HomeView

**Files:** 重写 `src/views/HomeView.vue`
- 绑定：`catalog.fetchHomeData(petType)`（onMounted + 切换宠物时）、`profile.activePetType/setPetType`、`content/catalog.js` 的 quickEntries/bundles、`cart` 角标（顶部购物车入口）
- 结构：品牌头（字标+搜索入口+购物车角标）→ 深苔绿 hero 大卡（衬线大字+CTA→/service）→ ChipSwitch 猫/狗 → 快捷入口宫格（8 项，icon+tone，点击跳分类/服务/会员）→ 热门服务横滑（homeServices, ServiceCard hero 布局）→ 场景组合 bundles 卡 → 热卖商品双列（homeProducts, ProductCard）→ 会员深色卡（→/member）
- 规则：快捷入口的跳转目标用 `git show main:src/views/HomeView.vue` 的 `openQuickEntry` 逐项照搬
- Commit: `feat(client): rewrite home view`

### Task 7: 分类页 + 商品列表页

**Files:** 重写 `src/views/CategoryView.vue`、`src/views/ProductListView.vue`
- CategoryView 绑定：`catalog.ensureCategories/categoriesByPetType/fetchProductList/productList/productFilters/loading.products/error.products`、`profile.activePetType`；左侧一级分类竖栏+右侧商品流+搜索框（keyword 过滤）
- ProductListView 绑定：`fetchProductList({petType,categoryId,keyword,page})`、`productPagination` 分页（上一页/下一页或加载更多，保持旧行为，用 git show 核对）、URL query 同步（旧版怎么传 categoryId/keyword 就怎么保留）
- 三态：骨架/空（EmptyState→清筛选）/错误（重试调同 action）
- Commit: `feat(client): rewrite category and product list views`

### Task 8: 商品详情

**Files:** 重写 `src/views/ProductDetailView.vue`
- 绑定：`catalog.fetchProductDetail(route.params.id)/currentProduct/relatedProducts/loading.productDetail/error.productDetail`、`cart.addProduct/submitting`
- 结构：通栏轮播(images,圆点指示,手势滚动 scroll-snap) → 标题区(badge/title/subtitle/PriceText xl+原价/会员价徽标/rating/sold) → 规格选择入口(已选 specLabel 摘要,点开 BottomSheet) → 适用标签(tags/suitable) → 卖点 summary 清单 → 图文详情(images) → 相关推荐(relatedProducts 横滑) → StickyActionBar(购物车图标带角标→/cart + 加入购物车 + 立即购买)
- 规格 BottomSheet：specs 数组每维一组 chip；**未选齐禁用两个主按钮**（旧版规则照搬：`git show main:src/views/ProductDetailView.vue` 核对 specs 结构与 specLabel 拼接 ` · `、specKey 拼接 `|`）；加购成功 toast；立即购买=加购后跳 `/order/confirm`（与旧版行为核对一致）
- Commit: `feat(client): rewrite product detail view`

### Task 9: 服务页 + 服务详情

**Files:** 重写 `src/views/ServiceView.vue`、`src/views/ServiceDetailView.vue`
- ServiceView 绑定：`catalog.fetchServiceList({petType,category})/serviceList/loading.services`、`profile.activePetType`、`content/catalog.js serviceCategories`；hero + 分类 chip + ServiceCard 列表 + 保障条
- ServiceDetailView 绑定：`fetchServiceDetail(id)/currentService/serviceStores/serviceDates/serviceSlots/selectedStoreId/selectedSlotDate/selectServiceStore/selectServiceDate/serviceHasBookableSlot/loading.serviceDetail/loading.slots`
- 结构：大图 → 标题/时长/评分/PriceText → includes 清单卡 → suitable → tips 注意事项 → 门店选择卡(单选) → 日期横滑条(serviceDates) → 时段宫格(serviceSlots, `!available` 禁用+剩余名额) → StickyActionBar"立即预约"
- 预约按钮：将 `currentService` 与 `{storeId:selectedStoreId, date:selectedSlotDate, slotId}` 交给 `booking.prepareFromService(service, selection)` 后跳 `/booking/confirm`（旧版传参方式照搬）；无可约时段时按钮禁用文案"该日时段已满"
- Commit: `feat(client): rewrite service views`

### Task 10: 购物车 + 确认订单 + 地址两页 + 提交栏测试

**Files:** 重写 `src/views/CartView.vue`、`OrderConfirmView.vue`、`AddressListView.vue`、`AddressFormView.vue`；重写 `src/tests/submit-bar-layout.test.js`
- CartView 绑定：`cart.fetchCart/items/summary/selectedItems/invalidItems/toggleSelection/updateQuantity/removeItem/clearInvalidItems/loading/error/submitting`
  - 结构：商品组卡(勾选+图+title+specLabel+PriceText+Stepper+左滑或按钮删除) → 失效区(置灰+invalidReason+一键清理) → 深色结算栏(StickyActionBar: 合计 summary.total + 去结算 disabled when selectedCount===0 → /order/confirm) → 空态(EmptyState→/category)
- OrderConfirmView 绑定：`cart.selectedItems/summary`、`getAddresses()`、`lib/pricing.getOrderPriceBreakdown`、提交 `createOrder({address_id, remark})` 后行为照旧版（清购物车？跳订单详情/列表？`git show main:src/views/OrderConfirmView.vue` 核对成功后的路由与提示）
  - 结构：地址卡(选中地址,无地址→引导去新增) → 商品摘要列 → 配送方式(静态展示,照旧) → 优惠券(照旧静态) → 备注输入 → 金额明细(subtotal/shipping/discount/payable) → StickyActionBar 提交(无地址或空购物车禁用)
- AddressListView：`getAddresses` 渲染、默认标签、编辑/删除(`deleteAddress`+ConfirmDialog)、新增按钮；若从确认页进入需支持选择后返回（旧版有无此逻辑以 git show 为准，保持一致）
- AddressFormView：字段 `name,phone,region,detail,tag,isDefault` → payload `{receiver_name,receiver_phone,region,detail_address,tag,is_default}`；新增/编辑双模式（route.params.id）；校验照旧版
- [ ] 重写 `src/tests/submit-bar-layout.test.js`：保持旧文件的 mock 结构（`vi.mock('@/api/user')`/`@/api/public`、makeCartResponse 等，从 `git show main:src/tests/submit-bar-layout.test.js` 取数据构造），断言改为：两个确认页都渲染 `.sticky-bar`；OrderConfirm 在无地址时提交按钮 `disabled`；BookingConfirm 在 `isReady=false` 时提交按钮 `disabled`。先写测试看它失败（BookingConfirmView 未重写前对其断言会失败，故本测试在 Task 11 完成后才要求全绿；本任务内先让 OrderConfirm 部分通过）
- Commit: `feat(client): rewrite cart, order confirm and address views`

### Task 11: 预约确认 + 预约详情 + 订单列表 + 订单详情

**Files:** 重写 `src/views/BookingConfirmView.vue`、`BookingDetailView.vue`、`OrderListView.vue`、`OrderDetailView.vue`
- BookingConfirmView 绑定：`booking.*`（serviceTitle/serviceCover/servicePrice/serviceDuration/storeOptions/dateOptions/timeSlots/petId/date/slotId/storeId/note/phone/isReady/setPet/setDate/setSlot/setStore/fetchSlots/submitBooking/submitting/error）、`profile.fetchPets/pets/hasPets`
  - 结构（分步分区卡）：服务摘要卡 → 选宠物(PetCard 横滑单选；无档案 EmptyState→/pets) → 选门店(storeOptions 单选卡) → 日期横滑(dateOptions) → 时段宫格(timeSlots) → 电话(可改,默认 phone) → 备注 → StickyActionBar 提交(`!isReady||submitting` 禁用)；成功后跳 `bookings/:id`（旧版行为核对）
- BookingDetailView：`booking.fetchBookingDetail(id)/currentBooking/currentBookingDetail/cancelBooking`；状态卡+服务信息+宠物+门店/时间+金额+取消按钮(status==='pendingService' 时显示,ConfirmDialog 确认；旧版条件照搬)
- OrderListView 绑定：`account.fetchOrdersAndBookings/allOrders/loading/error`；状态 tab（全部/待支付/待发货/待收货/待服务/已完成——过滤逻辑照旧版 git show）+ OrderCard 列表 + 空态
- OrderDetailView：`getOrderDetail(id)` 或经 store（旧版怎么取照搬）；状态区+items 清单+金额明细(subtotal/shipping/payable)+地址+remark+取消按钮(条件照旧)
- [ ] `npx vitest run src/tests/submit-bar-layout.test.js` → 全 PASS
- Commit: `feat(client): rewrite booking and order views`

### Task 12: 我的 + 编辑资料 + 宠物档案 + 会员

**Files:** 重写 `src/views/ProfileView.vue`、`ProfileEditView.vue`、`PetProfileView.vue`、`MemberView.vue`
- ProfileView 绑定：`profile.fetchProfile/profile/fetchPets/pets`、`account.fetchOrdersAndBookings/pendingShipmentCount/pendingServiceCount`；头部(avatar/nickname/level/joinDate)→资产行(points/couponCount→/member)→订单入口组(待发货/待服务计数,→/orders)→宠物横滑(PetCard,+新增→/pets)→功能组(地址/会员/编辑资料)
- ProfileEditView：`profile.updateProfile({nickname,phone,avatar})` + ImageUploadField 头像；校验照旧
- PetProfileView：列表态(PetCard+选中高亮 selectedPetId)+表单态(新增/编辑)：字段 `name,type(ChipSwitch cat/dog),breed,gender,birthday(date),weight(number),neutered(switch),allergies(标签输入),preferences(标签输入),avatar(ImageUploadField)`；`savePet`/`deletePet`(ConfirmDialog)；旧版表单交互细节(标签输入方式)以 git show 为准重做
- MemberView：`profile.profile` + `content/member.js`（memberBenefits 6 卡 + newbiePack）；深色会员卡(琥珀金点缀,points/level) + 权益宫格 + 新人礼包卡
- Commit: `feat(client): rewrite profile, pet and member views`

### Task 13: 用户端收尾

- [ ] `grep -rn "PetChipSwitch" src/` → 旧组件无引用后删除 `src/components/PetChipSwitch.vue`（及其他确认无引用的旧件）
- [ ] `npm test` 全绿（8 个测试文件全部）
- [ ] `npm run build` 成功
- [ ] Commit: `chore(client): remove legacy components`

## Phase 4 · 管理后台

### Task 14: 后台地基 + 登录页

**Files:** 新建 `admin/src/styles/tokens.css`（内容同 Task 1 + 后台补充变量：`--admin-sidebar-width: 232px; --admin-topbar-height: 64px;` 工作区底色 `--color-workspace: #F6F3EC;`）、`admin/src/styles/base.css`；重写 `admin/index.html`（引入字体同用户端、title "PetLife Admin"）、`admin/src/App.vue`（router-view + Toast 挂载）、`admin/src/views/LoginView.vue`
- LoginView：左右分屏（左：深苔绿品牌面，衬线标语+装饰；右：登录卡）；表单：Admin Key 密码框（v-model 同旧版逻辑：`session.login(key)` 后 `router.replace('/')`，校验非空；旧版有无"试连验证"用 `git show main:admin/src/views/LoginView.vue` 核对——若旧版仅存 key 不验证则保持一致）
- main.js 不动；检查 `admin/src/main.js` 是否 import 样式路径（如路径变化需同步——若旧版样式在别处，保持新文件路径与 main.js 引用一致，必要时仅改 import 行，这是允许的装配性修改）
- [ ] `npm run test:admin` 全绿（session-auth 测试不动）
- Commit: `feat(admin): new tokens, base styles and login view`

### Task 15: 后台布局框架

**Files:** 重写 `admin/src/layouts/AdminLayout.vue`、`admin/src/components/AppSidebar.vue`、`admin/src/components/AppHeader.vue`
- AdminLayout：grid `[sidebar][main]`，sidebar 固定深苔绿，main = AppHeader + content 白卡区；最低 1280 设计，不写移动断点
- AppSidebar：衬线 logo 字标 "PetLife" + 小字 "Admin Console"；分组导航（概览：dashboard / 目录：categories,products,services,stores,time-slots / 运营：orders,bookings），router-link 激活态米白胶囊；底部退出按钮（`session.logout()` + `router.replace('/login')`，逻辑照旧版位置——旧版退出在 AppHeader 还是 Sidebar 用 git show 核对，功能保留即可）
- AppHeader：当前页标题（route.meta.title）+ 右侧管理员身份徽标
- Commit: `feat(admin): new admin layout, sidebar and header`

### Task 16: 后台通用组件

**Files:** 重写 `admin/src/components/StatusTag.vue`、`UploadImageField.vue`；新建 `admin/src/components/AdminModal.vue`、`DataToolbar.vue`、`AdminEmpty.vue`、`ConfirmDialog.vue`
- StatusTag：props `{status, label?}`，色调映射同用户端 StatusBadge + `active→success/inactive→neutral`，文案走 `getDisplayStatusLabel`
- UploadImageField：props/emits 与旧版完全一致（`git show main:admin/src/components/UploadImageField.vue` 核对：v-model 单图 string / multiple 数组、调用 `@/api/upload`），重写视觉（拖拽/预览网格/删除）
- AdminModal：props `{open,title,width?}` emit `close`；居中对话框+遮罩
- DataToolbar：slot 布局（左筛选右动作）
- ConfirmDialog：同用户端契约
- [ ] `npm run test:admin` 全绿
- Commit: `feat(admin): shared admin components`

### Task 17: 五个表单对话框

**Files:** 重写 `admin/src/components/CategoryFormDialog.vue`、`ProductFormDialog.vue`、`ServiceFormDialog.vue`、`StoreFormDialog.vue`、`TimeSlotFormDialog.vue`
- 外壳换 AdminModal + 新表单样式（两列 grid，全宽项 span 2）
- **字段、默认值、回填逻辑、payload 序列化逐行照搬旧版**（契约总表"后台表单字段"+ git show）；TimeSlotFormDialog 的 props（是否接收 store 列表）照旧
- props/emits 与旧版一致（消费方 store dialogs 结构不变：`dialogs.<type>.{open,item}`，save 调 store action）
- [ ] `npm run test:admin` 全绿（catalog-admin 测试盖到 store 流程）
- Commit: `feat(admin): rewrite form dialogs`

### Task 18: Dashboard

**Files:** 重写 `admin/src/views/DashboardView.vue`
- 数据：并行 6 个 list 接口取计数（照旧版 loadDashboard）；统计卡 6 张（衬线大数字+图标+点击跳对应管理页）；下方两列待办：待发货订单前 5（orderNo/金额/时间，点击→/orders）、待服务预约前 5（bookingNo/服务/时段，→/bookings）；刷新按钮重跑加载；加载骨架+错误重试
- Commit: `feat(admin): rewrite dashboard`

### Task 19: 分类/门店/时段管理页

**Files:** 重写 `admin/src/views/CategoryAdminView.vue`、`StoreAdminView.vue`、`TimeSlotAdminView.vue`
- 统一模式：DataToolbar(筛选项照旧版：分类有 pet_type/is_enabled 筛选与否以 git show 为准) + 表格(列照旧版数据：分类: cover 缩略/name/slug/petType 标签/sort_order/StatusTag(is_enabled)/操作；门店: cover/name/phone/address/business_hours/StatusTag(status)/操作；时段: label/start-end/capacity/sort_order/StatusTag(is_enabled)/操作) + 行内"编辑"(openDialog(type,item))/"删除"(ConfirmDialog→remove×) + 新增按钮(openDialog(type)) + 空态/骨架/错误条
- [ ] `npm run test:admin` 全绿
- Commit: `feat(admin): rewrite category, store and time-slot views`

### Task 20: 商品/服务管理页

**Files:** 重写 `admin/src/views/ProductAdminView.vue`、`ServiceAdminView.vue`
- 同 Task 19 模式；商品表列：cover/title(+subtitle)/分类名(由 category_id 映射 categories)/petType/price/member_price/stock(+stock_status Tag)/status Tag/操作；服务表列：cover/title/petType/duration_minutes/price/member_price/status/操作；筛选（旧版有的搜索/筛选项照搬）
- 软删除表现照旧：remove 后 status 变 inactive 的项保留在表中（store 已处理）
- [ ] `npm run test:admin` 全绿
- Commit: `feat(admin): rewrite product and service views`

### Task 21: 订单/预约管理页

**Files:** 重写 `admin/src/views/OrderAdminView.vue`、`BookingAdminView.vue`
- 布局：状态筛选 tab（orderStatusFilterOptions / bookingStatusFilterOptions）→ 主表（订单: order_no/用户(快照字段以实际响应为准)/item_count/total_amount/StatusTag/created_at；预约: booking_no/service_title_snapshot/pet_name_snapshot/store_name_snapshot/booking_date+time_slot_label_snapshot/StatusTag/created_at）→ 行点击 `fetchOrderDetail/fetchBookingDetail` → 右侧详情面板（订单含 items 清单与地址快照；预约含完整快照信息）→ 状态流转按钮（订单 pendingShipment→"标记发货完成"(completed)/"取消订单"(cancelled)；预约 pendingService→"完成服务"(completed)/"取消预约"(cancelled)；具体可用流转以旧版按钮+`enumLabels` 为准，ConfirmDialog 二次确认）
- [ ] `npm run test:admin` 全绿（operations-admin）
- Commit: `feat(admin): rewrite order and booking views`

### Task 22: 后台收尾

- [ ] `grep -rn "dialog-card\|旧类名残留" admin/src/`（确认无旧样式引用）；删除确认无引用的旧文件
- [ ] `npm run test:admin` 全绿；`npm run build:admin` 成功
- Commit: `chore(admin): cleanup legacy styles`

## Phase 5 · 集成验证与收尾

### Task 23: 三端测试 + 实机走查

- [ ] `npm test && npm run test:admin && npm run test:server` 三套全绿
- [ ] 后台起服务：`npm run dev:server`（8787）、`npm run dev`（5173）、`npm run dev:admin`（5174）均后台运行
- [ ] Playwright 用户端走查（viewport 390×844）：依次访问 `http://localhost:5173/#/`、`#/category`、`#/products`、`#/product/<种子id>`、`#/service`、`#/service/<id>`、`#/cart`、`#/order/confirm`、`#/addresses`、`#/addresses/new`、`#/booking/confirm`、`#/orders`、`#/profile`、`#/profile/edit`、`#/pets`、`#/member`，每页截图检查：无溢出/无未样式化元素/三态正常/中文不溢出换行错误
- [ ] Playwright 核心链路：①首页→商品详情→选规格→加购→购物车→确认订单→提交→订单详情/列表；②服务→详情→选门店日期时段→预约确认→选宠物→提交→预约详情；③取消一笔订单与一笔预约
- [ ] Playwright 后台走查（viewport 1440×900）：登录（key `petlife-admin-demo`）→ dashboard → 7 个管理页逐页截图 → 新增+编辑+删除一个分类 → 商品上传图走一遍 → 订单标记完成 → 预约完成
- [ ] 发现的视觉/交互问题逐项修复并重跑相应检查；修复提交 `fix(ui): ...`
- [ ] 最终 commit

### Task 24: 分支收尾

- [ ] `git log --oneline main..redesign/ui` 概览全部提交
- [ ] 调用 superpowers:finishing-a-development-branch 决定合并方式（用户已授权自主决策：保留分支并汇报，不主动 merge/push）
- [ ] 向用户汇报：完成内容、测试证据、走查截图要点、分支状态

---

## 自审记录（写计划时已核）

1. **Spec 覆盖**：18 页面视图(Task 6-12)、9 后台页(Task 14,18-21)、外壳/导航(Task 3,15)、组件体系(Task 4-5,16-17)、三态(各页任务内)、测试策略(Task 0,3,10,11,13,22,23)、视觉语言(Task 1 tokens+各页)、红线(契约总表禁改清单)——全覆盖
2. **占位符**：无 TBD；"以 git show 为准"均为对既有实现的引用而非空指令
3. **一致性**：组件名/类名（`.tab-bar/.top-bar/.sticky-bar`）在 Task 3/4/10/11 与测试代码一致；token 变量名旧名兼容策略全文一致
