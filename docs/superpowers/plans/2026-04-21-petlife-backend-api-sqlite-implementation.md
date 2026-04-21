# PetLife Backend API + SQLite Implementation Plan

  Goal: 先把 PetLife 做成一个可独立运行的后端子项目，提供用户端 API、管理员 API、本地图片上传、
  SQLite 持久化，以及和现有 Vite 前端联调所需的代理配置。

  Architecture: 在仓库根目录保留现有前端，新增 server/ 作为独立 Node.js 服务。后端采用 routes ->
  controllers -> services -> repositories -> SQLite 分层，用户端固定为 demo user，管理员端通过 x-
  admin-key 保护。

  Tech Stack: Node.js, Express, better-sqlite3, multer, dotenv, Vitest, Supertest, SQLite, Vite
  proxy

  ———

  ## File Structure

  - server/package.json：后端依赖与脚本
  - server/vitest.config.js：后端测试配置
  - server/.env.example：本地环境变量模板
  - server/src/app.js：Express app 装配
  - server/src/server.js：服务启动入口
  - server/src/config/env.js：环境变量解析
  - server/src/db/index.js：SQLite 连接工厂
  - server/src/db/migrate.js：迁移执行器
  - server/src/db/seed.js：确定性种子数据
  - server/src/db/migrations/001_initial.sql：首个完整 schema
  - server/src/middleware/adminAuth.js：管理员 key 校验
  - server/src/middleware/attachDemoUser.js：挂载 demo user
  - server/src/middleware/uploadImage.js：图片上传解析
  - server/src/middleware/errorHandler.js：统一错误处理
  - server/src/middleware/notFound.js：404 处理
  - server/src/routes/public.js：公开 API 路由
  - server/src/routes/user.js：用户 API 路由
  - server/src/routes/admin.js：管理员 API 路由
  - server/src/controllers/*.js：每组接口一个 controller
  - server/src/services/catalogService.js：公开目录/门店/时段业务
  - server/src/services/profileService.js：用户资料/地址/宠物业务
  - server/src/services/cartService.js：购物车业务
  - server/src/services/orderService.js：订单业务
  - server/src/services/bookingService.js：预约业务
  - server/src/services/uploadService.js：图片上传 URL 生成
  - server/src/services/adminCatalogService.js：后台内容 CRUD
  - server/src/services/adminOperationsService.js：后台订单/预约操作
  - server/src/repositories/*.js：每张核心表一个 repository
  - server/src/utils/apiResponse.js：统一响应结构
  - server/src/utils/appError.js：业务错误类
  - server/src/utils/validators.js：校验工具
  - server/tests/helpers/createTestContext.js：测试 DB / uploads 临时上下文
  - server/tests/*.test.js：后端 API 与业务测试
  - .gitignore：忽略 sqlite、uploads、node_modules、dist、env

  ———

  ## Task 1: Scaffold backend workspace and app shell

  Files:
  server/package.json, server/vitest.config.js, server/.env.example, .gitignore, server/src/app.js,
  server/src/server.js, server/src/config/env.js, server/src/utils/apiResponse.js, server/src/utils/
  appError.js, server/src/utils/validators.js, server/src/middleware/adminAuth.js, server/src/
  middleware/attachDemoUser.js, server/src/middleware/errorHandler.js, server/src/middleware/
  notFound.js, server/src/routes/public.js, server/src/routes/user.js, server/src/routes/admin.js,
  server/tests/helpers/createTestContext.js, server/tests/app-shell.test.js

  Steps:

  1. 先建后端包和测试壳，脚本至少包含 dev、start、test、db:migrate、db:seed。
  2. 写 app-shell.test.js，先验证两件事：
      - GET /api/public/categories 返回统一 envelope
      - 未携带 x-admin-key 访问 /api/admin/categories 返回 401
  3. 实现最小可运行 app：
      - express.json()
      - /uploads 静态托管
      - /api/public、/api/user、/api/admin 三套路由先挂空壳
      - 统一 notFound 和 errorHandler
  4. 安装依赖并跑测试。

  Verify:

  npm --prefix server install
  npm --prefix server run test -- server/tests/app-shell.test.js

  Expected:

  - 测试通过
  - server/package-lock.json 生成
  - createApp() 可被 Supertest 直接挂载

  Commit:

  git add .gitignore server
  git commit -m "feat: scaffold petlife backend shell"

  ———

  ## Task 2: Add SQLite bootstrap, migrations, and deterministic seed

  Files:
  server/src/db/index.js, server/src/db/migrate.js, server/src/db/seed.js, server/src/db/
  migrations/001_initial.sql, server/tests/db-bootstrap.test.js, server/tests/helpers/
  createTestContext.js

  Schema scope:
  users, addresses, pets, categories, products, product_images, services, service_images, stores,
  time_slots, cart_items, orders, order_items, bookings

  Steps:

  1. 先写 db-bootstrap.test.js，验证：
      - migration 后核心表都存在
      - seed 后 demo user、分类、商品、服务、门店、时段、地址、宠物、购物车、订单、预约都有数据
      - 连续执行两次 seed 结果仍稳定
  2. 实现 createDatabase(dbPath)，打开 better-sqlite3 并启用 foreign_keys = ON。
  3. 实现 migrate()，执行 001_initial.sql。
  4. 实现 seed()，固定使用一组作品集演示数据，例如：
      - demo user: u_demo_001
      - address: addr_001
      - pets: pet_001, pet_002
      - products: 2 个可买 + 1 个已售罄
      - services: 2 个可约
      - stores: 2 家门店
      - time slots: 3 个时段
      - 1 笔历史订单
      - 1 笔历史预约
  5. 测试临时环境统一走 createTestContext()，自动创建临时 sqlite 和 uploads 目录。

  Verify:

  npm --prefix server run test -- server/tests/db-bootstrap.test.js

  Expected:

  - 通过
  - 测试数据库和开发数据库完全分离
  - seed 重跑不漂移

  Commit:

  git add server/src/db server/tests/db-bootstrap.test.js server/tests/helpers/createTestContext.js
  git commit -m "feat: add sqlite schema and seed data"

  ———

  ## Task 3: Implement public catalog and slot APIs

  Files:
  server/src/repositories/categoryRepository.js, productRepository.js, serviceRepository.js,
  storeRepository.js, timeSlotRepository.js, bookingRepository.js, server/src/services/
  catalogService.js, server/src/controllers/publicController.js, server/src/routes/public.js,
  server/tests/public-api.test.js

  APIs:

  - GET /api/public/categories
  - GET /api/public/products
  - GET /api/public/products/:id
  - GET /api/public/services
  - GET /api/public/services/:id
  - GET /api/public/stores
  - GET /api/public/stores/:id/slots

  Steps:

  1. 先写 public-api.test.js，覆盖：
      - 只返回启用分类
      - 商品列表支持 categoryId、keyword、petType、page、pageSize
      - 商品详情返回图片列表
      - 服务列表/详情只返回 active
      - 门店时段返回 capacity, used, remaining, isAvailable
  2. 在 repository 层实现查询，不在 controller 里写 SQL。
  3. catalogService 负责：
      - 解析分页
      - 校验 serviceId 与门店状态
      - 计算 slot availability
  4. controller 统一输出：
      - 普通列表：{ code, message, data: { list } }
      - 分页列表：{ code, message, data: { list, pagination } }

  Verify:

  npm --prefix server run test -- server/tests/public-api.test.js

  Expected:

  - 所有公开接口直接读 SQLite，不再依赖前端 mock
  - slot 可用性由 bookings 实时计算

  Commit:

  git add server/src/repositories server/src/services/catalogService.js server/src/controllers/
  publicController.js server/src/routes/public.js server/tests/public-api.test.js
  git commit -m "feat: add public catalog apis"

  ———

  ## Task 4: Implement user profile, address, and pet APIs

  Files:
  server/src/repositories/userRepository.js, addressRepository.js, petRepository.js, server/src/
  services/profileService.js, server/src/controllers/userProfileController.js,
  userAddressController.js, userPetController.js, server/src/routes/user.js, server/tests/user-
  profile-address-pet.test.js

  APIs:

  - GET /api/user/profile
  - GET/POST/PUT/DELETE /api/user/addresses
  - GET/POST/PUT/DELETE /api/user/pets

  Steps:

  1. 先写测试：
      - GET /profile 返回 demo user
      - 新建默认地址会清掉旧默认地址
      - 更新地址也能切换默认值
      - 宠物可新增、编辑、删除
  2. attachDemoUser 固定挂 req.user.id = 'u_demo_001'。
  3. profileService 负责：
      - 地址默认项唯一性
      - 仅允许操作当前 demo user 的记录
      - 宠物 JSON 字段如 allergies_json、preferences_json 的序列化与反序列化
  4. validators.js 加入：
      - 必填字符串
      - 枚举值
      - 日期
      - 数组字段校验

  Verify:

  npm --prefix server run test -- server/tests/user-profile-address-pet.test.js

  Commit:

  git add server/src/repositories/userRepository.js server/src/repositories/addressRepository.js
  server/src/repositories/petRepository.js server/src/services/profileService.js server/src/
  controllers/userProfileController.js server/src/controllers/userAddressController.js server/src/
  controllers/userPetController.js server/src/routes/user.js server/tests/user-profile-address-
  pet.test.js
  git commit -m "feat: add user profile address and pet apis"

  ———

  ## Task 5: Implement cart persistence and invalid-item handling

  Files:
  server/src/repositories/cartRepository.js, server/src/services/cartService.js, server/src/
  controllers/userCartController.js, server/src/routes/user.js, server/tests/cart-api.test.js

  APIs:

  - GET /api/user/cart
  - POST /api/user/cart/items
  - PUT /api/user/cart/items/:id
  - DELETE /api/user/cart/items/:id
  - DELETE /api/user/cart/invalid-items

  Steps:

  1. 先写测试：
      - 相同 productId + specKey 重复加入时合并数量
      - 已下架或售罄商品在购物车中标记为 isValid: false
      - 可一次清除全部无效商品
      - 可以修改 quantity 和 selected
  2. cartService 负责：
      - 合并规则
      - 根据当前商品表判断有效性
      - 输出 invalidReason
  3. GET /cart 响应建议包含：
      - list
      - summary.selectedCount
      - summary.invalidCount
      - summary.totalAmount

  Verify:

  npm --prefix server run test -- server/tests/cart-api.test.js

  Commit:

  git add server/src/repositories/cartRepository.js server/src/services/cartService.js server/src/
  controllers/userCartController.js server/src/routes/user.js server/tests/cart-api.test.js
  git commit -m "feat: add cart persistence apis"

  ———

  ## Task 6: Implement order creation, query, and cancel with transactions

  Files:
  server/src/repositories/orderRepository.js, server/src/services/orderService.js, server/src/
  controllers/userOrderController.js, server/src/routes/user.js, server/tests/user-orders.test.js

  APIs:

  - POST /api/user/orders
  - GET /api/user/orders
  - GET /api/user/orders/:id
  - POST /api/user/orders/:id/cancel

  Steps:

  1. 先写测试：
      - 从已勾选且有效的购物车项创建订单
      - 写入 orders 和 order_items 快照
      - 商品库存事务性扣减
      - 已购买购物车项会被移除
      - 库存不足返回 409
      - 用户取消后状态变 cancelled
  2. orderService 用 SQLite transaction 处理整条链路。
  3. 新订单状态固定为 pendingShipment，status_label 同步写入。
  4. 订单详情接口返回：
      - 订单主信息
      - items
      - 地址快照字段
  5. 取消订单时恢复库存，避免演示数据越跑越空。

  Verify:

  npm --prefix server run test -- server/tests/user-orders.test.js

  Commit:

  git add server/src/repositories/orderRepository.js server/src/services/orderService.js server/src/
  controllers/userOrderController.js server/src/routes/user.js server/tests/user-orders.test.js
  git commit -m "feat: add user order apis"

  ———

  ## Task 7: Implement booking creation, query, and cancel

  Files:
  server/src/services/bookingService.js, server/src/controllers/userBookingController.js, server/
  src/routes/user.js, server/tests/user-bookings.test.js

  APIs:

  - POST /api/user/bookings
  - GET /api/user/bookings
  - GET /api/user/bookings/:id
  - POST /api/user/bookings/:id/cancel

  Steps:

  1. 先写测试：
      - 合法宠物/服务/门店/时段/日期可创建预约
      - 已满时段返回 409
      - 预约列表和详情可查询
      - 取消预约后状态为 cancelled
  2. bookingService 负责：
      - 校验 pet/service/store/timeSlot 是否存在且可用
      - 按 store_id + booking_date + time_slot_id 统计已占用量
      - 生成 booking_no
      - 写入快照字段
  3. phase one 规则直接落地：
      - 所有 active service 都允许在所有 active store 预约
      - serviceId 只做存在性和状态校验，不做门店映射表

  Verify:

  npm --prefix server run test -- server/tests/user-bookings.test.js

  Commit:

  git add server/src/services/bookingService.js server/src/controllers/userBookingController.js
  server/src/routes/user.js server/tests/user-bookings.test.js
  git commit -m "feat: add user booking apis"

  ———

  ## Task 8: Implement admin upload and catalog CRUD APIs

  Files:
  server/src/middleware/uploadImage.js, server/src/services/uploadService.js, server/src/services/
  adminCatalogService.js, server/src/controllers/adminUploadController.js,
  adminCategoryController.js, adminProductController.js, adminServiceController.js,
  adminStoreController.js, adminTimeSlotController.js, server/src/routes/admin.js, server/tests/
  admin-catalog.test.js

  APIs:

  - POST /api/admin/uploads/images
  - GET/POST/PUT/DELETE /api/admin/categories
  - GET/POST/PUT/DELETE /api/admin/products
  - GET/POST/PUT/DELETE /api/admin/services
  - GET/POST/PUT/DELETE /api/admin/stores
  - GET/POST/PUT/DELETE /api/admin/time-slots

  Steps:

  1. 先写测试：
      - 未带 x-admin-key 继续返回 401
      - 非图片上传返回 400
      - 图片上传成功返回 /uploads/...
      - 商品、服务可创建与更新
      - 被历史订单/预约引用时，删除操作转为保守禁用而不是硬删
      - 门店、时段、分类 CRUD 正常
  2. uploadImage.js 用 multer.diskStorage：
      - 目录按 YYYY/MM
      - 文件名用时间戳 + randomUUID()
      - 限制 MIME 和大小
  3. adminCatalogService 负责保守删除策略：
      - category 有在售商品时返回 409
      - product 被订单引用时改为 status = inactive
      - service 被预约引用时改为 status = inactive
      - time slot 被预约引用时改为 is_enabled = 0

  Verify:

  npm --prefix server run test -- server/tests/admin-catalog.test.js

  Commit:

  git add server/src/middleware/uploadImage.js server/src/services/uploadService.js server/src/
  services/adminCatalogService.js server/src/controllers/adminUploadController.js server/src/
  controllers/adminCategoryController.js server/src/controllers/adminProductController.js server/
  src/controllers/adminServiceController.js server/src/controllers/adminStoreController.js server/
  src/controllers/adminTimeSlotController.js server/src/routes/admin.js server/tests/admin-
  catalog.test.js
  git commit -m "feat: add admin upload and catalog apis"

  ———

  ## Task 9: Implement admin order/booking operations and frontend dev proxy

  Files:
  server/src/services/adminOperationsService.js, server/src/controllers/adminOrderController.js,
  server/src/controllers/adminBookingController.js, server/src/routes/admin.js, server/tests/admin-
  operations.test.js, package.json, vite.config.js

  APIs:

  - GET /api/admin/orders
  - GET /api/admin/orders/:id
  - POST /api/admin/orders/:id/status
  - GET /api/admin/bookings
  - GET /api/admin/bookings/:id
  - POST /api/admin/bookings/:id/status

  Steps:

  1. 先写测试：
      - 管理员能查看订单列表/详情
      - 管理员能查看预约列表/详情
      - 可更新订单状态到 completed / cancelled
      - 可更新预约状态到 completed / cancelled
  2. 实现 adminOperationsService，复用 repository，不重复 SQL。
  3. 修改根目录 package.json，新增：
      - dev:client
      - dev:server
      - test:client
      - test:server
  4. 修改 vite.config.js，把 /api 和 /uploads 代理到 http://127.0.0.1:8787。

  建议脚本：

  {
    "scripts": {
      "dev": "vite",
      "dev:client": "vite",
      "dev:server": "npm --prefix server run dev",
      "build": "vite build",
      "preview": "vite preview",
      "test": "vitest run",
      "test:client": "vitest run",
      "test:server": "npm --prefix server run test"
    }
  }

  Verify:

  npm --prefix server run test -- server/tests/admin-operations.test.js

  Commit:

  git add server/src/services/adminOperationsService.js server/src/controllers/
  adminOrderController.js server/src/controllers/adminBookingController.js server/src/routes/
  admin.js server/tests/admin-operations.test.js package.json vite.config.js
  git commit -m "feat: add admin operations and dev proxy"

  ———

  ## Task 10: Final verification sweep

  Steps:

  1. 跑完整后端测试。
  2. 跑前端现有测试，确保代理改动没破坏客户端。
  3. 手动启动前后端，检查：
      - GET /api/public/products
      - GET /api/user/cart
      - GET /api/admin/orders with x-admin-key
      - /uploads/... 能直接访问
  4. 若验证中出现问题，只修当前失败点，不顺手扩 scope。

  Verify:

  npm --prefix server run test
  npm run test:client
  npm run dev:server
  npm run dev:client

  Expected:

  - 后端测试全绿
  - 前端测试不回归
  - 本地能通过 Vite 直接访问后端接口与图片
  - 项目达到“除支付外完整业务闭环”

  Final commit:

  git add .
  git commit -m "feat: complete petlife backend api with sqlite"

  ———

  ## Implementation rules

  - 所有 controller 只做参数解析和响应，不写 SQL。
  - 所有 SQL 只放 repository。
  - 事务只放 service，尤其是订单和预约。
  - 错误统一走 AppError，HTTP 码只用 400/401/404/409/500。
  - 成功响应统一：

  {
    "code": 0,
    "message": "ok",
    "data": {}
  }

  - 管理员 key 固定来自环境变量，不在源码里硬编码。
  - 用户端一律走 demo user，不接受客户端传 userId。

  ## Self-review checklist

  - spec 里的 public/user/admin API 都已经映射到任务
  - SQLite 全部核心表都已覆盖
  - local upload、seed、proxy、tests 都有对应任务
  - 没有把支付、真实登录、云存储带进第一阶段
