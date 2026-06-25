# AI 售前商品咨询 UI 设计

## 背景

PetLife 前台已经有商品浏览、商品详情、购物车和订单确认流程。本次先做前端 UI，不接真实 AI 服务，目标是在售前阶段给用户一个可演示的商品咨询入口：用户可以从首页直接咨询，也可以在商品详情页带着当前商品上下文进入咨询。

## 范围

本次包含：

- 首页新增“AI 售前咨询”入口，采用区块式卡片，不使用悬浮按钮。
- 商品详情页新增悬浮 AI 咨询按钮，位置在底部购买操作栏上方，避免遮挡“加入购物车”和“立即购买”。
- 新增统一咨询页 `/ai-consult`。
- 从商品详情进入时，通过 `productId` 查询参数自动带入当前商品信息。
- 咨询页提供欢迎语、商品上下文卡、快捷问题、消息列表、输入框和本地模拟回复。
- 补充前端组件/路由测试，覆盖入口跳转、商品上下文和模拟回复。

本次不包含：

- 后端接口、数据库表或管理端功能。
- 真实 AI 模型调用、流式输出、会话持久化。
- 多轮推荐算法或真实库存/用户画像推理。

## 用户路径

首页路径：

1. 用户在首页看到“AI 售前咨询”卡片。
2. 点击后进入 `/ai-consult`。
3. 页面展示通用欢迎语和快捷问题，例如“给猫咪选主粮”“挑选清洁用品”“怎么搭配新手礼包”。
4. 用户点击快捷问题或输入内容后，页面追加用户消息和一条本地模拟 AI 回复。

商品详情路径：

1. 用户在 `/product/:id` 查看商品。
2. 页面右下方、购买栏上方显示小型悬浮 AI 按钮。
3. 点击后进入 `/ai-consult?productId=<当前商品ID>`。
4. 咨询页加载商品详情并展示商品上下文卡片。
5. 快捷问题围绕当前商品生成，例如“适合我家宠物吗”“成分有什么特点”“怎么搭配购买”。

## 页面与组件设计

### 路由

新增路由：

- `path: '/ai-consult'`
- `name: 'ai-consult'`
- `component: () => import('@/views/AiConsultView.vue')`
- `meta: { title: 'AI客服' }`

该页面不是 tab route，因此沿用现有 `App.vue` 的 `TopBar` 行为。

### 首页入口

在 `HomeView.vue` 的快捷入口之后、现有“AI 营销推荐”之前插入咨询卡片。该位置靠前，和 AI 能力相关内容相邻，但不会干扰顶部品牌、搜索、购物车和商品推荐。

卡片内容：

- 标题：`AI 售前咨询`
- 文案：`不知道怎么选？告诉我宠物情况，帮你快速筛选商品。`
- 入口按钮：`开始咨询`
- 视觉上使用现有品牌色、圆角、线性 `chat` 或 `service` 图标。

点击行为：

- `router.push('/ai-consult')`

### 商品详情入口

在 `ProductDetailView.vue` 中新增悬浮按钮，不改变现有底部购买栏按钮结构。按钮固定在视口右下角，但底部偏移必须基于现有 `--action-bar-height` 和 safe area，保证不遮挡购买栏。

按钮内容：

- `IconSvg name="chat"`
- 文案可短：`AI咨询`
- 使用小型胶囊或圆形按钮，保持触控区域足够大。

点击行为：

- `router.push({ path: '/ai-consult', query: { productId: product.id } })`

当商品不存在或加载中时不展示该按钮。

### AI 咨询页

新增 `src/views/AiConsultView.vue`。页面本地维护消息状态，不新增 store。

页面结构：

- 顶部说明区：AI 助手头像/图标、服务说明和在线状态。
- 商品上下文卡：仅当 URL 带 `productId` 且商品加载成功时展示。
- 快捷问题区：根据是否有商品上下文切换问题列表。
- 消息区：展示 AI 和用户气泡。
- 输入区：底部固定输入框和发送按钮。

商品上下文卡展示字段：

- 商品封面
- 商品标题
- 会员价或售价
- 副标题/适用说明中的一项简短信息

本地模拟回复规则：

- 用户点击快捷问题或输入非空内容后追加用户消息。
- 延迟一个短暂状态可选，但不要求真实异步等待。
- AI 回复使用固定模板，结合商品标题或通用购物场景生成，避免假装真实模型能力。

示例：

- 带商品：`我先按「鲜肉全价猫粮」帮你看。可以重点确认宠物年龄、体重、是否挑食或过敏，再决定规格和搭配。`
- 不带商品：`可以告诉我宠物类型、年龄、预算和想解决的问题，我会按主粮、零食、清洁或出行用品帮你筛选。`

## 数据流

首页入口：

```text
HomeView -> router.push('/ai-consult') -> AiConsultView
```

商品详情入口：

```text
ProductDetailView(product.id)
  -> router.push('/ai-consult?productId=product.id')
  -> AiConsultView reads route.query.productId
  -> catalogStore.fetchProductDetail(productId)
  -> display catalogStore.currentProduct as context
```

注意：咨询页调用 `fetchProductDetail` 会复用 `catalogStore.currentProduct`。这是可接受的，因为当前前台已有商品详情全局当前商品模型；本次不引入新的咨询 store。

## 状态与错误处理

- `productId` 不存在：进入通用咨询模式。
- 商品加载中：展示小型 skeleton 或文案，不阻塞通用聊天。
- 商品加载失败：隐藏商品卡，展示通用快捷问题，保留咨询能力。
- 输入为空：发送按钮禁用或点击无效果。
- 消息状态仅在页面实例内保留，离开页面后清空。

## 测试计划

新增或修改以下测试：

- `src/tests/router-shell.test.js`：验证 `/ai-consult` 属于二级页面，显示 `TopBar` 且标题为 `AI客服`。
- `src/tests/home-view.test.js`：验证首页渲染“AI 售前咨询”入口，点击后跳转 `/ai-consult`。
- 新增 `src/tests/product-detail-ai-consult.test.js`：验证商品详情页显示 AI 咨询悬浮按钮，点击后跳转 `/ai-consult?productId=<id>`。
- 新增 `src/tests/ai-consult-view.test.js`：验证通用模式快捷问题、带商品模式商品卡、发送消息后的本地模拟回复。

## 验证命令

实现后至少运行：

```bash
npm run test:client -- src/tests/home-view.test.js src/tests/router-shell.test.js src/tests/product-detail-ai-consult.test.js src/tests/ai-consult-view.test.js
npm run build
```

如果启动本地页面检查：

```bash
npm run dev
```

再用浏览器检查：

- 首页入口位置与视觉密度。
- 商品详情悬浮按钮不遮挡底部购买栏。
- `/ai-consult` 在移动宽度下消息、商品卡、输入框不重叠。
