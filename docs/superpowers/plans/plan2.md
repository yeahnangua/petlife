# PetLife User Frontend API Integration Plan

  Goal: 在保留现有移动端视觉稿和页面结构的前提下，把用户端从 src/mocks 切到真实后端 API，补齐地址管
  理、真实下单、真实预约、真实个人中心数据流。

  Architecture: 继续使用现有 Vue 3 + Vite + Vue Router + Pinia。新增一层轻量 src/api 请求封装和 src/
  adapters 数据适配层，把后端返回的数据转换成当前页面能直接消费的 UI shape，避免把接口字段散落进每个
  页面。

  Tech Stack: Vue 3, Vite, Vue Router, Pinia, native fetch, Vitest

  ———

  ## File Structure

  - Create: src/api/http.js
  - Create: src/api/public.js
  - Create: src/api/user.js
  - Create: src/adapters/catalog.js
  - Create: src/adapters/profile.js
  - Create: src/adapters/order.js
  - Create: src/stores/catalog.js
  - Create: src/stores/account.js
  - Create: src/views/AddressListView.vue
  - Create: src/views/AddressFormView.vue
  - Create: src/views/OrderDetailView.vue
  - Create: src/views/BookingDetailView.vue
  - Create: src/tests/api-client.test.js
  - Create: src/tests/catalog-integration.test.js
  - Create: src/tests/cart-order-flow.test.js
  - Create: src/tests/profile-booking-flow.test.js
  - Modify: src/router/index.js
  - Modify: src/stores/cart.js
  - Modify: src/stores/booking.js
  - Modify: src/stores/profile.js
  - Modify: src/views/HomeView.vue
  - Modify: src/views/CategoryView.vue
  - Modify: src/views/ProductListView.vue
  - Modify: src/views/ProductDetailView.vue
  - Modify: src/views/ServiceView.vue
  - Modify: src/views/ServiceDetailView.vue
  - Modify: src/views/CartView.vue
  - Modify: src/views/OrderConfirmView.vue
  - Modify: src/views/BookingConfirmView.vue
  - Modify: src/views/OrderListView.vue
  - Modify: src/views/ProfileView.vue
  - Modify: src/views/PetProfileView.vue
  - Modify: src/views/MemberView.vue
  - Modify: src/components/ProductCard.vue
  - Modify: src/components/ServiceCard.vue
  - Modify: src/components/OrderCard.vue
  - Modify: src/components/EmptyState.vue

  ### Task 1: Add API client and response adapters

  Files:
  src/api/http.js, src/api/public.js, src/api/user.js, src/adapters/catalog.js, src/adapters/
  profile.js, src/adapters/order.js, src/tests/api-client.test.js

  Steps:

  1. 先写 api-client.test.js，验证统一处理 { code, message, data } 响应，并在 code !== 0 或非 2xx 时
     抛出可读错误。
  2. 在 http.js 封装 request(url, options)，默认 base = ''，直接走 Vite 代理后的 /api/...。
  3. 在 public.js 封装：
      - getCategories
      - getProducts
      - getProductDetail
      - getServices
      - getServiceDetail
      - getStores
      - getStoreSlots
  4. 在 user.js 封装：
      - getProfile
      - getAddresses/createAddress/updateAddress/deleteAddress
      - getPets/createPet/updatePet/deletePet
      - getCart/addCartItem/updateCartItem/deleteCartItem/clearInvalidCartItems
      - createOrder/getOrders/getOrderDetail/cancelOrder
      - createBooking/getBookings/getBookingDetail/cancelBooking
  5. 在 adapters 里把后端字段映射到现有 UI 结构。
     例：
      - avatar_url -> avatar
      - member_level -> level
      - cover_url -> cover
      - status_label -> statusLabel
      - product_images[].image_url -> images[]

  Verify:

  npm test -- src/tests/api-client.test.js

  Commit:

  git add src/api src/adapters src/tests/api-client.test.js
  git commit -m "feat: add user frontend api client"

  ### Task 2: Replace public catalog pages with real /api/public

  Files:
  src/stores/catalog.js, src/views/HomeView.vue, src/views/CategoryView.vue, src/views/
  ProductListView.vue, src/views/ProductDetailView.vue, src/views/ServiceView.vue, src/views/
  ServiceDetailView.vue, src/components/ProductCard.vue, src/components/ServiceCard.vue, src/tests/
  catalog-integration.test.js

  Steps:

  1. 先写 catalog-integration.test.js，验证：
      - 首页能拉到分类、商品、服务
      - 商品列表支持筛选和分页
      - 商品详情能显示图片与规格
      - 服务详情能显示门店和可预约入口
  2. 新增 useCatalogStore，集中维护：
      - categories
      - productList, productPagination, productFilters
      - serviceList, servicePagination
      - currentProduct
      - currentService
      - loading, error
  3. HomeView、CategoryView、ProductListView、ServiceView 改成页面加载时调用 store。
  4. ProductDetailView 去掉 findProduct(route.params.id)，改为异步加载详情。
  5. ServiceDetailView 去掉对 mock timeSlots/storeOptions 的直接依赖，改为根据门店与日期现查 /api/
     public/stores/:id/slots。
  6. 所有 catalog 页面补上 3 种状态：
      - loading
      - empty
      - request error

  Verify:

  npm test -- src/tests/catalog-integration.test.js

  Commit:

  git add src/stores/catalog.js src/views/HomeView.vue src/views/CategoryView.vue src/views/
  ProductListView.vue src/views/ProductDetailView.vue src/views/ServiceView.vue src/views/
  ServiceDetailView.vue src/components/ProductCard.vue src/components/ServiceCard.vue src/tests/
  catalog-integration.test.js
  git commit -m "feat: connect catalog pages to public apis"

  ### Task 3: Connect cart and order flow to real /api/user

  Files:
  src/stores/cart.js, src/views/CartView.vue, src/views/OrderConfirmView.vue, src/views/
  AddressListView.vue, src/views/AddressFormView.vue, src/views/OrderDetailView.vue, src/router/
  index.js, src/tests/cart-order-flow.test.js

  Steps:

  1. 先写 cart-order-flow.test.js，验证：
      - 加入购物车会调用真实接口
      - 相同商品规格合并数量
      - 购物车能展示无效商品
      - 下单前必须有地址
      - 提交订单成功后购物车刷新、跳转订单详情
  2. 重写 useCartStore，把本地 items 改为接口驱动：
      - fetchCart
      - addProduct
      - updateItem
      - removeItem
      - clearInvalidItems
  3. 新增地址管理页面：
      - /addresses
      - /addresses/new
      - /addresses/:id/edit
  4. OrderConfirmView 改为真实读取：
      - 地址列表
      - 已选购物车项
      - 金额汇总
  5. 提交订单调用 POST /api/user/orders，成功后跳转 /orders/:id。
  6. 新增订单详情页，直接接 GET /api/user/orders/:id。

  Verify:

  npm test -- src/tests/cart-order-flow.test.js

  Commit:

  git add src/stores/cart.js src/views/CartView.vue src/views/OrderConfirmView.vue src/views/
  AddressListView.vue src/views/AddressFormView.vue src/views/OrderDetailView.vue src/router/
  index.js src/tests/cart-order-flow.test.js
  git commit -m "feat: connect cart and order flow to user apis"

  ### Task 4: Connect profile, pets, booking, and member pages

  Files:
  src/stores/profile.js, src/stores/booking.js, src/stores/account.js, src/views/ProfileView.vue,
  src/views/PetProfileView.vue, src/views/BookingConfirmView.vue, src/views/OrderListView.vue, src/
  views/BookingDetailView.vue, src/views/MemberView.vue, src/components/OrderCard.vue, src/tests/
  profile-booking-flow.test.js

  Steps:

  1. 先写 profile-booking-flow.test.js，验证：
      - 个人页拉真实 profile
      - 宠物档案增删改查生效
      - 服务预约能创建与取消
      - 订单列表页能同时展示商品订单与服务预约
  2. useProfileStore 改成真实请求：
      - fetchProfile
      - fetchPets
      - createPet
      - updatePet
      - deletePet
  3. useBookingStore 改成接口驱动，不再从 mock 服务对象读 timeSlots/storeOptions。
  4. BookingConfirmView 提交到 POST /api/user/bookings。
  5. OrderListView 做成双 tab：
      - 商品订单
      - 服务预约
  6. MemberView 不新增后端接口，先用真实 profile + orders/bookings 统计值做展示。
     这里是一个明确约束：
     当前 backend plan 不包含优惠券/会员等级成长体系，所以这页只做“展示页 + 已有数据派生”，不扩后端
     范围。

  Verify:

  npm test -- src/tests/profile-booking-flow.test.js

  Commit:

  git add src/stores/profile.js src/stores/booking.js src/stores/account.js src/views/
  ProfileView.vue src/views/PetProfileView.vue src/views/BookingConfirmView.vue src/views/
  OrderListView.vue src/views/BookingDetailView.vue src/views/MemberView.vue src/components/
  OrderCard.vue src/tests/profile-booking-flow.test.js
  git commit -m "feat: connect profile and booking flow to user apis"

  ### Task 5: Remove runtime mock coupling and finish integration sweep

  Files:
  src/mocks/index.js, src/views/*, src/stores/*, src/tests/*

  Steps:

  1. 清掉运行时对 src/mocks 的直接依赖，保留 mocks 只给测试夹具或视觉回退用。
  2. 检查所有页面的 loading、error、empty、submit pending 状态。
  3. 确认底部 tab、详情页底部操作栏、异步切页没有回归。
  4. 跑完整前端测试和生产构建。

  Verify:

  npm test
  npm run build

  Commit:

  git add src
  git commit -m "feat: complete user frontend api integration"
