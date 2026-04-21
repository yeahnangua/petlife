# PetLife Admin Frontend Implementation Plan

  Goal: 新增一个独立的管理员后台前端，用来管理分类、商品、服务、门店、时段、订单、预约和图片上传，完
  整接入 backend 的 /api/admin。

  Architecture: 在仓库内新增 admin/ 作为单独的 Vite 应用，不和移动端用户前端混在一起。后台通过独立
  api 层统一注入 x-admin-key，采用一个简单的“管理员 key 登录页”做本地演示保护。

  Tech Stack: Vue 3, Vite, Vue Router, Pinia, Element Plus, native fetch, Vitest

  ———

  ## File Structure

  - Create: admin/package.json
  - Create: admin/vite.config.js
  - Create: admin/index.html
  - Create: admin/src/main.js
  - Create: admin/src/App.vue
  - Create: admin/src/router/index.js
  - Create: admin/src/api/http.js
  - Create: admin/src/api/auth.js
  - Create: admin/src/api/catalog.js
  - Create: admin/src/api/operations.js
  - Create: admin/src/api/upload.js
  - Create: admin/src/stores/session.js
  - Create: admin/src/stores/catalog.js
  - Create: admin/src/stores/operations.js
  - Create: admin/src/layouts/AdminLayout.vue
  - Create: admin/src/views/LoginView.vue
  - Create: admin/src/views/DashboardView.vue
  - Create: admin/src/views/CategoryAdminView.vue
  - Create: admin/src/views/ProductAdminView.vue
  - Create: admin/src/views/ServiceAdminView.vue
  - Create: admin/src/views/StoreAdminView.vue
  - Create: admin/src/views/TimeSlotAdminView.vue
  - Create: admin/src/views/OrderAdminView.vue
  - Create: admin/src/views/BookingAdminView.vue
  - Create: admin/src/components/AppSidebar.vue
  - Create: admin/src/components/AppHeader.vue
  - Create: admin/src/components/StatusTag.vue
  - Create: admin/src/components/UploadImageField.vue
  - Create: admin/src/components/ProductFormDialog.vue
  - Create: admin/src/components/ServiceFormDialog.vue
  - Create: admin/src/components/CategoryFormDialog.vue
  - Create: admin/src/components/StoreFormDialog.vue
  - Create: admin/src/components/TimeSlotFormDialog.vue
  - Create: admin/src/tests/session-auth.test.js
  - Create: admin/src/tests/catalog-admin.test.js
  - Create: admin/src/tests/operations-admin.test.js
  - Modify: package.json

  ### Task 1: Scaffold the admin app and login gate

  Files:
  admin/package.json, admin/vite.config.js, admin/src/main.js, admin/src/App.vue, admin/src/router/
  index.js, admin/src/stores/session.js, admin/src/views/LoginView.vue, admin/src/layouts/
  AdminLayout.vue, admin/src/tests/session-auth.test.js, package.json

  Steps:

  1. 先创建独立 admin/ 子应用，不复用当前移动端根应用。
  2. 根目录 package.json 新增：
      - dev:admin
      - build:admin
      - test:admin
  3. 先写 session-auth.test.js，验证：
      - 未设置 admin key 时只能访问登录页
      - 设置 key 后可进入后台
      - 清除 key 后自动回到登录页
  4. LoginView.vue 做一个最小登录页，只输入 x-admin-key，保存到 localStorage。
  5. session store 负责：
      - adminKey
      - isAuthenticated
      - login
      - logout
  6. router 加守卫，除 /login 外都要求已登录。

  Verify:

  npm --prefix admin install
  npm --prefix admin run test -- admin/src/tests/session-auth.test.js

  Commit:

  git add admin package.json
  git commit -m "feat: scaffold admin frontend shell"

  ### Task 2: Add shared admin API client and dashboard shell

  Files:
  admin/src/api/http.js, admin/src/api/auth.js, admin/src/api/catalog.js, admin/src/api/
  operations.js, admin/src/api/upload.js, admin/src/views/DashboardView.vue, admin/src/components/
  AppSidebar.vue, admin/src/components/AppHeader.vue

  Steps:

  1. http.js 给所有请求自动注入 x-admin-key。
  2. 遇到 401 时自动清 session 并跳回 /login。
  3. DashboardView 不新增后端 dashboard 接口，先通过已有列表接口拉取数量概览：
      - categories
      - products
      - services
      - stores
      - pendingShipment orders
      - pendingService bookings
  4. AdminLayout 提供：
      - 左侧导航
      - 顶部标题
      - 登出按钮
      - 主内容区
  5. 后台导航菜单固定为：
      - 概览
      - 分类
      - 商品
      - 服务
      - 门店
      - 时段
      - 订单
      - 预约

  Verify:

  npm --prefix admin run test -- admin/src/tests/session-auth.test.js

  Commit:

  git add admin/src/api admin/src/views/DashboardView.vue admin/src/components/AppSidebar.vue admin/
  src/components/AppHeader.vue
  git commit -m "feat: add admin api client and dashboard shell"

  ### Task 3: Implement category, product, and service management

  Files:
  admin/src/stores/catalog.js, admin/src/views/CategoryAdminView.vue, admin/src/views/
  ProductAdminView.vue, admin/src/views/ServiceAdminView.vue, admin/src/components/
  UploadImageField.vue, admin/src/components/CategoryFormDialog.vue, admin/src/components/
  ProductFormDialog.vue, admin/src/components/ServiceFormDialog.vue, admin/src/tests/catalog-
  admin.test.js

  Steps:

  1. 先写 catalog-admin.test.js，验证：
      - 分类可新增/编辑/删除
      - 商品可新增/编辑/下架
      - 服务可新增/编辑/下架
      - 上传图片成功后表单可回填 URL
  2. catalog store 维护：
      - 列表数据
      - 查询参数
      - dialog 状态
      - 提交 pending
  3. 商品和服务表单字段直接对齐 backend：
      - 标题、副标题、宠物类型、价格、原价、badge、封面、图集、摘要、状态
  4. 图片上传统一走 POST /api/admin/uploads/images。
  5. 删除逻辑严格按 backend 返回执行。
     如果后端因为历史数据改成“禁用/下架”，前端只展示操作结果，不自行猜测。

  Verify:

  npm --prefix admin run test -- admin/src/tests/catalog-admin.test.js

  Commit:

  git add admin/src/stores/catalog.js admin/src/views/CategoryAdminView.vue admin/src/views/
  ProductAdminView.vue admin/src/views/ServiceAdminView.vue admin/src/components/
  UploadImageField.vue admin/src/components/CategoryFormDialog.vue admin/src/components/
  ProductFormDialog.vue admin/src/components/ServiceFormDialog.vue admin/src/tests/catalog-
  admin.test.js
  git commit -m "feat: add admin catalog management"

  ### Task 4: Implement store and time-slot management

  Files:
  admin/src/views/StoreAdminView.vue, admin/src/views/TimeSlotAdminView.vue, admin/src/components/
  StoreFormDialog.vue, admin/src/components/TimeSlotFormDialog.vue, admin/src/tests/catalog-
  admin.test.js

  Steps:

  1. 扩展 catalog-admin.test.js，验证：
      - 门店可新增/编辑/删除
      - 时段可新增/编辑/启停
  2. 门店表单字段：
      - name
      - phone
      - address
      - business_hours
      - cover_url
      - status
  3. 时段表单字段：
      - label
      - start_time
      - end_time
      - capacity
      - sort_order
      - is_enabled
  4. 列表页默认支持按状态筛选与刷新。

  Verify:

  npm --prefix admin run test -- admin/src/tests/catalog-admin.test.js

  Commit:

  git add admin/src/views/StoreAdminView.vue admin/src/views/TimeSlotAdminView.vue admin/src/
  components/StoreFormDialog.vue admin/src/components/TimeSlotFormDialog.vue admin/src/tests/
  catalog-admin.test.js
  git commit -m "feat: add admin store and time slot management"

  ### Task 5: Implement order and booking operations pages

  Files:
  admin/src/stores/operations.js, admin/src/views/OrderAdminView.vue, admin/src/views/
  BookingAdminView.vue, admin/src/components/StatusTag.vue, admin/src/tests/operations-admin.test.js

  Steps:

  1. 先写 operations-admin.test.js，验证：
      - 订单列表/详情加载
      - 预约列表/详情加载
      - 状态更新后列表同步刷新
  2. 订单页支持：
      - 列表
      - 状态筛选
      - 查看详情 drawer
      - 更新为 completed / cancelled
  3. 预约页支持：
      - 列表
      - 状态筛选
      - 查看详情 drawer
      - 更新为 completed / cancelled
  4. StatusTag.vue 统一渲染状态样式，避免每页写判断。

  Verify:

  npm --prefix admin run test -- admin/src/tests/operations-admin.test.js

  Commit:

  git add admin/src/stores/operations.js admin/src/views/OrderAdminView.vue admin/src/views/
  BookingAdminView.vue admin/src/components/StatusTag.vue admin/src/tests/operations-admin.test.js
  git commit -m "feat: add admin order and booking operations"

  ### Task 6: Final admin verification

  Files:
  admin/src/*, admin/package.json, admin/vite.config.js, package.json

  Steps:

  1. 跑完整后台前端测试。
  2. 跑后台生产构建。
  3. 联调验证：
      - 登录
      - 上传图片
      - 商品 CRUD
      - 服务 CRUD
      - 门店 CRUD
      - 时段 CRUD
      - 订单状态更新
      - 预约状态更新
  4. 如果这里暴露出 backend 字段差异，只修接口适配层，不在页面里打补丁。

  Verify:

  npm --prefix admin run test
  npm --prefix admin run build

  Commit:

  git add admin
  git commit -m "feat: complete petlife admin frontend"
