# AI 结构化商品推荐与聊天持久化设计

## 背景

当前 `/ai-consult` 已经接入服务端代理的 SiliconFlow/DeepSeek 非流式聊天接口。前端会把用户消息和页面内存中的历史消息发送给后端，后端再请求模型并返回纯文本回复。这个版本可以完成基础咨询，但还不能把“商品推荐”转化为可点击的商品卡，也不能在刷新页面后保留对话。

本次升级目标是让 AI 售前咨询更像真实导购：用户询问“有什么猫粮推荐”时，模型在自然语言回复之外返回结构化推荐信号和商品 ID；后端用真实数据库商品信息生成推荐卡数据；前端在 AI 回复下方显示小型竖向商品卡，点击进入商品详情。同时，聊天历史保存在浏览器 `localStorage` 中，刷新后可恢复，并提供“重置聊天”按钮。

## 范围

本次包含：

- 后端向模型提供压缩后的店铺商品目录，供模型判断是否推荐商品。
- 后端要求模型返回结构化 JSON，包含 `reply`、`hasRecommendation`、`recommendedProductIds` 和 `recommendationMode`。
- 后端只信任模型返回的商品 ID，再从数据库查询真实商品标题、图片、价格、简介和库存状态。
- 后端返回 `reply`、`recommendations`、`model`、`usage` 给前端。
- 前端把 AI 回复和推荐商品卡绑定到同一条 assistant 消息。
- 推荐卡采用竖向小卡：方形商品图为主，商品名、价格和短标签为辅。
- 默认只展示 1 个最推荐商品，最多展示 2 个商品。
- 前端用 `localStorage` 持久化当前咨询页的消息、推荐卡和必要元数据。
- 增加“重置聊天”按钮：清空聊天消息与推荐卡，但保留当前 `productId` 商品上下文。
- 补充前后端测试，覆盖结构化推荐、多轮历史、持久化恢复和重置行为。

本次不包含：

- 后端会话表、用户级跨设备同步或登录态隔离。
- 流式输出。
- 购物车加购、下单或推荐埋点。
- 管理端配置推荐规则。
- 服务类项目推荐卡；本次只做商品推荐卡。

## 核心方案

采用单次模型调用完成“回复 + 推荐判断”。后端构造提示词时包含：

- 系统身份和售前导购规则。
- 最近若干轮对话历史。
- 当前 `productId` 商品上下文，如果用户从商品详情进入。
- 压缩后的全店在售商品目录。
- 严格 JSON 输出要求。

模型返回 JSON 后，后端解析并校验。后端不会使用模型生成的商品名、价格或图片，只会读取 `recommendedProductIds`。这些 ID 必须存在于当前数据库、状态为 active，且最多保留前 2 个。最终返回给前端的推荐卡数据来自数据库。

如果模型没有推荐意图，`hasRecommendation` 为 `false` 或 `recommendedProductIds` 为空，前端只显示普通文本回复。如果模型返回格式错误，后端尽量提取可读文本作为 `reply`，推荐列表为空。

## 结构化返回格式

模型目标输出：

```json
{
  "reply": "可以先看鲜肉含量、适用年龄和预算。按你的需求，我最推荐这款成猫主粮。",
  "hasRecommendation": true,
  "recommendedProductIds": ["p-001"],
  "recommendationMode": "single"
}
```

字段规则：

- `reply`：必填，给用户看的中文回复。
- `hasRecommendation`：必填，布尔值。只有用户明确询问商品推荐、比较、搭配或适合购买时才为 `true`。
- `recommendedProductIds`：数组，最多 2 个商品 ID。默认 1 个，只有明确需要备选或搭配时返回 2 个。
- `recommendationMode`：`none`、`single`、`pair` 三选一。无推荐为 `none`；一个商品为 `single`；两个商品为 `pair`。

服务端返回给前端：

```json
{
  "reply": "可以先看鲜肉含量、适用年龄和预算。按你的需求，我最推荐这款成猫主粮。",
  "recommendations": [
    {
      "id": "p-001",
      "title": "鲜肉全价猫粮",
      "subtitle": "低敏冷鲜配方",
      "cover": "/images/products/cat-food.svg",
      "price": 268,
      "memberPrice": 248,
      "originalPrice": 298,
      "stockStatus": "inStock",
      "badge": "热卖",
      "tagline": "最推荐"
    }
  ],
  "model": "deepseek-ai/DeepSeek-V4-Flash",
  "usage": {
    "prompt_tokens": 0,
    "completion_tokens": 0,
    "total_tokens": 0
  }
}
```

`usage` 由模型服务返回；如果没有则为 `null`。`tagline` 由后端根据推荐位置生成，第一项为“最推荐”，第二项为“可选搭配”或“备选方案”。

## 商品目录上下文

当前种子数据约 14 个商品，适合把压缩目录直接放进提示词。目录只包含模型做推荐所需字段：

- `id`
- `title`
- `category`
- `petType`
- `price`
- `memberPrice`
- `stockStatus`
- `tags`
- `summary`
- `suitable`
- `subtitle`

后端会过滤非 active 商品，并优先提示模型不要推荐售罄商品。由于目录文本受商品数量影响，后端保留目录构建函数，后续商品数量变大时可以改为按关键词预筛选，但本次不引入额外检索层。

## 前端消息模型

前端 `messages` 从纯文本消息升级为：

```javascript
{
  id: 'ai-1782399000000-1',
  role: 'assistant',
  content: '可以先看鲜肉含量、适用年龄和预算。按你的需求，我最推荐这款成猫主粮。',
  recommendations: [
    {
      id: 'p-001',
      title: '鲜肉全价猫粮',
      subtitle: '低敏冷鲜配方',
      cover: '/images/products/cat-food.svg',
      memberPrice: 248,
      price: 268,
      stockStatus: 'inStock',
      tagline: '最推荐'
    }
  ]
}
```

用户消息不包含 `recommendations`。发送给后端的历史消息仍只包含 `role` 和 `content`，避免把商品卡完整数据重复塞回模型。模型需要的商品目录由后端统一提供。

## 推荐卡 UI

推荐卡显示在对应 assistant 文本气泡下方，跟随这条消息滚动。卡片竖向排列，不横滑。

卡片规则：

- 卡片宽度约 190px，在聊天气泡左侧对齐区域内展示。
- 图片区域为 1:1 方形，占卡片主要面积。
- 文本只显示商品名、会员价或售价、短标签。
- 第一张卡标签为“最推荐”。
- 第二张卡只在需要时出现，标签为“可选搭配”或“备选方案”。
- 点击卡片跳转 `product-detail` 路由。

如果推荐商品已售罄但仍被模型返回，后端默认过滤；前端一般不会收到售罄推荐。若后续业务希望展示售罄替代，则另行设计。

## 多轮对话

多轮对话由前端保存并随每次请求发送最近历史，后端继续调用 `normalizeMessages` 限制历史长度。推荐卡不参与上下文，只让模型看到文本对话。

当用户追问“那第二个呢”“有没有便宜点的”时，后端仍会带全量商品目录和最近文本历史，模型可以基于之前的意图返回新的 `recommendedProductIds`。新推荐卡绑定到新的 assistant 消息，不覆盖旧消息。

## localStorage 持久化

持久化 key 使用固定前缀和上下文区分：

- 通用咨询：`petlifeAiConsult:general`
- 商品上下文咨询：`petlifeAiConsult:product:<productId>`

保存内容：

```javascript
{
  version: 1,
  productId: 'p-001',
  messages: [],
  updatedAt: '2026-06-25T12:00:00.000Z'
}
```

页面加载时按当前 `productId` 读取对应 key。`productId` 变化时切换到另一个持久化会话。保存失败时不阻塞聊天，只在控制台保持安静失败，用户仍可继续当前页面内存对话。

为了避免无限增长，前端最多保存最近 30 条消息。超出后丢弃最早的消息。

## 重置聊天

咨询页顶部或快捷问题附近增加“重置聊天”按钮。点击后：

- 清空当前上下文 key 下的 `messages`。
- 清空页面内消息和推荐卡。
- 保留当前 `productId` 和商品上下文卡。
- 不清空商品详情 store。
- 不发后端请求。

重置后欢迎语仍会根据是否有 `productId` 显示商品上下文欢迎语或通用欢迎语。

## 错误处理

- 用户输入为空：不发送。
- 模型 JSON 解析失败：后端返回可读 `reply`，`recommendations: []`。
- 模型返回不存在商品 ID：后端过滤。
- 过滤后无推荐商品：`recommendations: []`，前端只显示文本。
- AI 请求失败：前端显示当前已有的服务不可用提示，不写入推荐卡。
- localStorage 读取失败：忽略坏数据并从空消息开始。
- localStorage 写入失败：保留内存状态，不打断用户。

## 测试计划

后端测试：

- `server/tests/ai-consult-api.test.js` 覆盖模型收到压缩商品目录。
- 覆盖模型返回结构化推荐 ID 后，接口返回真实数据库商品卡数据。
- 覆盖模型返回不存在或售罄商品 ID 时被过滤。
- 覆盖模型返回非 JSON 内容时退化为纯文本回复。
- 覆盖默认最多返回 2 个推荐商品。

前端测试：

- `src/tests/api-client.test.js` 覆盖 `sendAiConsultMessage` 返回 `recommendations`。
- `src/tests/ai-consult-view.test.js` 覆盖 assistant 消息下渲染竖向小推荐卡。
- 覆盖点击推荐卡跳转商品详情。
- 覆盖刷新/重新挂载时从 `localStorage` 恢复消息和推荐卡。
- 覆盖“重置聊天”清空消息但保留当前商品上下文。
- 覆盖推荐失败时显示普通错误提示。

验证命令：

```bash
npm --prefix server run test -- tests/ai-consult-api.test.js
npm run test:client -- src/tests/api-client.test.js src/tests/ai-consult-view.test.js
npm --prefix server run test
npm run test:client
npm run build
```

实现后还需要浏览器验证：

- 打开 `/ai-consult`，输入“有什么猫粮推荐”，确认出现 1 个竖向小商品卡。
- 点击商品卡进入对应商品详情页。
- 刷新咨询页后消息和商品卡仍存在。
- 点击“重置聊天”后消息消失，商品上下文卡保留。
