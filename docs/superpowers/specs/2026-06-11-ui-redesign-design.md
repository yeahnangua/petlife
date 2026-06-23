# PetLife 双端 UI 全面重写设计（暖色品牌进化）

日期：2026-06-11
分支：`redesign/ui`（自 main 新建）

## 1. 背景与目标

PetLife 现有用户端（`src/`）与管理后台（`admin/`）功能已完整接通真实后端（`server/`，Express + SQLite），但界面质感停留在第一版。本次工作在**保持现有功能完全不变**的前提下，将两端 UI 推倒重写，目标：

- 更现代、更精美，具备真实品牌产品的视觉完成度
- 用户端：只做**竖屏移动端**界面；在桌面浏览器中以约 430px 限宽居中呈现（两侧为素雅品牌底色），不再渲染装饰性手机壳
- 管理后台：只做**横屏电脑端**界面，最低适配 1280px 宽，不做移动端适配
- 后端 `server/` 一行代码不改

成功标准：

- 三端测试全绿：用户端、admin 的 store 级测试原样通过；server 测试通过
- 用户端 18 个页面视图（19 条路由，新增/编辑地址共用表单页）、后台 9 个页面全部重写完成，无功能缺失
- 两条核心链路实机可跑通：商品加购→下单；选宠物→预约服务
- 实机走查（移动 390×844 / 桌面 1440×900）无明显视觉缺陷

## 2. 已确认的决策

| 决策点 | 结论 |
| --- | --- |
| 视觉方向 | 暖色品牌进化：保留鼠尾草绿/奶油色品牌基因，用现代手法重做 |
| 样式方案 | 手写 scoped CSS + 全新全局 design tokens，不引入 UI 组件库/Tailwind |
| 桌面打开用户端 | 限宽约 430px 居中，无手机壳装饰 |
| 重写策略 | 保留逻辑层（api/adapters/stores/router/lib/content/mocks），删除重写全部视图层 |
| 文案（实现默认，非用户指定） | 重写时可一并打磨表述，但不得改变功能含义 |

## 3. 范围与架构

### 3.1 完全不动

- `server/` 全部
- 根目录与 `admin/` 的 `vite.config.js`（端口 5173/5174、`/api` 与 `/uploads` proxy → 8787）
- store 级测试（必须全程保持绿色，是"功能不变"的安全网）：
  - 用户端：`src/tests/api-client.test.js`、`cart-order-flow.test.js`、`catalog-integration.test.js`、`catalog.test.js`、`pricing.test.js`、`profile-booking-flow.test.js`
  - 后台：`admin/src/tests/catalog-admin.test.js`、`operations-admin.test.js`、`session-auth.test.js`

### 3.2 保留的逻辑层（不重写，新视图必须对齐其形状）

- 用户端：`src/api/`、`src/adapters/`、`src/stores/`（account/booking/cart/catalog/profile）、`src/lib/`、`src/content/`、`src/mocks/`、`src/router/index.js`（路由表与 meta 结构不变）、`src/main.js`
- 后台：`admin/src/api/`、`admin/src/stores/`（catalog/operations/session）、`admin/src/utils/enumLabels.js`、`admin/src/router/index.js`、`admin/src/main.js`

### 3.3 删除重写（全新文件）

- 用户端：`src/views/`（18 页）、`src/components/`（组件体系重新设计）、`src/styles/`（tokens/base/index 全新）、`src/App.vue`、`index.html`（保留 Google Fonts 的 Fraunces + Manrope 引入，可调整字重子集）
- 后台：`admin/src/views/`（9 页）、`admin/src/components/`、`admin/src/layouts/`、`admin/src/App.vue`、`admin/index.html`（新增字体引入与新 tokens）
- UI 耦合测试重写（断言意图保持不变）：`src/tests/router-shell.test.js`（tab 显隐与外壳结构）、`src/tests/submit-bar-layout.test.js`（确认页提交栏布局）

### 3.4 必须原样保留的业务规则

- 服务预约不进购物车，从服务详情直达预约确认
- 无宠物档案时，预约流程引导新增档案
- 商品规格未选齐时禁止加购/购买
- 预约未选齐门店+日期+时段时禁止提交
- 购物车仅承载商品；失效商品可一键清理
- 订单与预约可取消（走现有 cancel 接口）
- 后台所有写操作携带 `x-admin-key`（localStorage 持久化，401 时登出回登录页）
- 订单/预约状态流转走 `POST /api/admin/{orders|bookings}/:id/status`

## 4. 视觉语言

关键词：**现代暖色、编辑杂志式排版、安静的精致**。

### 4.1 色彩（全新 token，方向性取值，实现时允许微调）

- 底色：暖米白 `#FAF8F3` 区间；卡片纯白，去除旧版泛黄感
- 主色：深苔绿 `#2E4A3A` 区间，担任主 CTA、tab 选中、深色块；中间调 sage 做辅助、浅 sage 做选中底
- 强调色：珊瑚橙仅用于价格/促销；琥珀金仅用于会员；单屏可见色相控制在 2-3 个
- 深色块层次：底部 tab bar、首页 hero、会员卡、后台侧边栏使用深苔绿底 + 米白字

### 4.2 排版

- 显示字体：Fraunces（已有）+ Noto Serif SC 兜底；用于大标题、区块标题、价格数字
- 正文：Manrope + PingFang SC 系兜底
- 明确 5 级字阶（约 display 40/32 · title 22/18 · body 15/13 · caption 11），标题紧字距

### 4.3 形状、层次与动效

- 圆角分级：大卡 24 / 标准卡 16 / 输入框 12 / 按钮胶囊
- 弃用大面积泛光阴影：1px 暖色细描边 + 单层低调阴影 + 色块对比
- 图标：全套自绘线性圆角 SVG（重画 IconSvg 体系）
- 动效（纯 CSS）：页面转场 fade-slide 平滑化、按钮按压 scale 0.97、列表渐进入场、骨架屏、购物车角标弹跳

## 5. 用户端设计（竖屏移动端，18 页）

### 5.1 外壳与导航

- 限宽 430px 居中；一级 tab 页（首页/分类/服务/订单/我的）顶部用品牌头或页面大标题，二级页用统一返回导航条
- 底部深苔绿圆角 tab bar，选中项米白胶囊高亮；订单 tab 以 account store 的 `pendingShipmentCount`/`pendingServiceCount` 显示提示圆点
- 购物车入口位于首页/分类/商品详情顶部及商品详情悬浮栏

### 5.2 新组件体系

TopBar、TabBar、ProductCard、ServiceCard、OrderCard、PetCard、SectionHeading、ChipSwitch（猫/狗）、Stepper、PriceText、StatusBadge、EmptyState、Skeleton、BottomSheet、StickyActionBar、FormField、Toast、ConfirmDialog、IconSvg。同类信息复用同一卡片组件，token 全局统一。

### 5.3 页面要点

1. 首页：深苔绿 hero 大卡（衬线品牌大字 + 宠物摄影 + 主 CTA）→ 猫/狗切换 → 快捷入口宫格 → 热门服务横滑大卡 → 场景组合推荐 → 热卖商品双列 → 会员深色卡
2. 分类页：左侧一级分类竖栏 + 右侧二级分类 chip + 商品卡列表，顶部搜索
3. 商品列表：筛选 chip + 排序 + 双列商品卡
4. 商品详情：通栏大图轮播、衬线大字价格 + 会员价徽标、规格选择 BottomSheet（未选齐禁购）、图文详情、底部悬浮操作栏（加购/立即买）
5. 服务页：服务专题 hero + 分类入口 + 服务大卡列表（横图/时长/价格/评分）+ 服务保障条
6. 服务详情：主视觉大图、包含内容清单卡、注意事项、门店信息、底部"立即预约"
7. 购物车：分组卡 + 勾选 + 步进器、失效商品折叠区（一键清理）、深色结算栏、空状态推荐入口
8. 确认订单：地址卡（无地址引导）、商品摘要、配送方式、优惠券、备注、金额明细、提交
9. 预约确认：分步分区——选宠物（无档案引导新增）→ 选门店 → 日期横滑条 → 时段宫格（满员禁用）→ 电话/备注 → 提交
10. 订单列表：状态 tab（全部/待支付/待发货/待收货/待服务/已完成）+ 商品订单卡与服务预约卡两种卡型 + 空状态
11. 订单详情：状态进度、商品清单、金额明细、地址、取消操作
12. 预约详情：状态、服务/门店/时段/宠物信息、取消操作
13. 我的：用户头部 + 资产入口（积分/优惠券，静态内容沿用 `src/content/member.js`）+ 宠物档案横滑卡 + 订单入口（带计数）+ 地址等功能组
14. 编辑资料：头像上传 + 昵称/电话表单
15. 宠物档案：宠物大卡列表 + 新增/编辑表单（类型/生日/体重/过敏）+ 删除确认
16. 会员权益：深色+琥珀金会员卡、积分、权益说明卡（静态内容沿用）
17. 地址列表：地址卡 + 默认标签 + 编辑/删除 + 新增
18. 地址表单：字段与现状一致（姓名/电话/地区/详细地址/默认开关）

## 6. 管理后台设计（横屏桌面，9 页）

### 6.1 布局

固定左侧 230px 深苔绿侧边栏：衬线 logo 字标 + 分组导航（概览 / 目录管理：分类·商品·服务·门店·时段 / 运营：订单·预约）+ 底部退出。右侧工作区：顶栏（页面标题 + 管理员身份）+ 内容卡。

### 6.2 页面要点

- 登录页：左右分屏，左侧品牌视觉（深苔绿 + 衬线标语），右侧登录卡（Admin Key 密码框 + 内联错误提示）
- Dashboard：统计卡一行（分类/商品/服务/门店/待发货/待服务，衬线大数字）+ 两列待办（最近待发货订单、即将到来的预约，可点击跳转对应管理页）+ 刷新
- 5 个 CRUD 页（分类/商品/服务/门店/时段）统一模式：工具栏（搜索/筛选 + 新增按钮）→ 白卡数据表（缩略图、状态标签、行内编辑/删除）→ 居中表单对话框（字段与现有 FormDialog 完全一致，含图片上传）→ 删除二次确认 → 空状态/骨架屏
- 订单/预约管理：状态筛选 tab + 表格 + 详情抽屉 + 状态流转按钮；状态文案沿用 `enumLabels`，标签用语义色系统

## 7. 状态、错误处理与验收

- 三态全覆盖：列表页骨架屏/空状态/错误态（重试），消费 store 现有 `loading`/`error`
- 表单：沿用现有校验规则，内联提示 + 提交中禁用 + 失败 Toast
- 图片：统一占位底色 + `onerror` 兜底
- 验收流程：
  1. `npm test`（根）、`npm run test:admin`、`npm run test:server` 全绿
  2. 起 server + 双前端，Playwright 实机走查：移动 390×844 逐页走查用户端 18 页 + 两条核心链路；桌面 1440×900 走查后台 9 页 + 登录 + 一次完整 CRUD + 一次状态流转
  3. 截图自查（溢出/对比度/间距/对齐）并修复
- 红线：不改 `server/`；不改 store/api 层；如视图与 API 实际响应不符，以 API 实际为准调整视图

## 8. 非目标

- 不新增业务功能（不加新页面、新接口、新字段）
- 不做用户端横屏/桌面响应式布局，不做后台移动端适配
- 不引入 UI 组件库、CSS 框架、动画库、图标库
- 不做深色模式
- 不改进后端（性能、安全、数据结构均维持现状）
