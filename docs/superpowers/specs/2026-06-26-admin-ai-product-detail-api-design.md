# PetLife 后台商品详情 AI 真实 API 接入设计

## Goal

将 admin 端商品编辑弹窗中已有的两个 AI 辅助入口接入真实 DeepSeek/SiliconFlow Chat Completions API：

- `AI 生成介绍`：根据当前商品表单上下文生成并覆盖标签、摘要、适用描述。
- `AI 生成规格`：根据自然语言描述生成规格 JSON，并写入现有规格 JSON 文本域。

目标是替换当前前端 mock 生成逻辑，同时保持后台商品保存 payload、数据库字段和用户端展示逻辑不变。

## Approach

采用一个 admin-only 草稿接口：

`POST /api/admin/products/ai-draft`

请求体通过 `mode` 区分生成类型：

- `mode: "intro"` 生成 `{ tags, summary, suitable_text }`
- `mode: "specs"` 生成 `{ specs }`

选择单接口的原因：

- 复用 admin 鉴权、现有 AI 配置和通用模型调用客户端。
- 避免两个接口重复 prompt、JSON 解析、模型错误处理。
- 保持业务边界收敛，接口只返回商品表单可写入的草稿字段。

## Scope

涉及后端：

- 新增 admin 商品 AI 草稿 controller、service 或在现有 admin 商品 controller/service 中增加专用方法。
- 在 `server/src/routes/admin.js` 注册 `POST /products/ai-draft`，受现有 `adminAuth` 保护。
- 复用 `app.locals.aiChatClient`、`config.aiModel`、`AI_TIMEOUT_MS`、`DEEPSEEK/SILICONFLOW` 环境变量。

涉及前端：

- 新增 admin API client 方法，例如 `generateProductAiDraft(payload)`。
- `ProductFormDialog.vue` 将 mock 生成函数替换为异步 API 调用。
- 保持现有按钮、弹窗、字段写入位置和覆盖语义。

不涉及：

- 商品表结构或保存接口变更。
- 用户端商品详情页展示变更。
- SSE 或流式输出。
- 自动保存商品。

## Request Shape

介绍生成请求：

```json
{
  "mode": "intro",
  "product": {
    "category_id": "cat-food",
    "category_name": "主粮",
    "pet_type": "cat",
    "pet_type_label": "猫",
    "title": "鲜肉全价猫粮",
    "subtitle": "低敏冷鲜配方 · 成猫通用",
    "price": 268,
    "member_price": 248,
    "original_price": 298,
    "badge": "热卖",
    "tags": ["旧标签"],
    "summary": ["旧摘要"],
    "suitable_text": "旧适用描述"
  }
}
```

规格生成请求：

```json
{
  "mode": "specs",
  "prompt": "规格有 1.5kg 3kg 和 6kg，口味有鸡肉 三文鱼 和牛肉",
  "product": {
    "category_name": "主粮",
    "pet_type": "cat",
    "pet_type_label": "猫",
    "title": "鲜肉全价猫粮",
    "subtitle": "低敏冷鲜配方 · 成猫通用"
  }
}
```

字段会在后端裁剪长度并只取 prompt 所需信息。前端不发送图片、库存、状态等与文案生成无关的字段。

## Response Shape

介绍生成成功：

```json
{
  "draft": {
    "tags": ["低敏", "成猫", "鲜肉配方"],
    "summary": ["鲜肉配方，适合作为成猫日常主粮", "颗粒适口，兼顾营养和消化负担"],
    "suitable_text": "适合 1-8 岁成猫日常喂养"
  },
  "model": "deepseek-ai/DeepSeek-V4-Flash",
  "usage": null
}
```

规格生成成功：

```json
{
  "draft": {
    "specs": [
      {
        "group": "规格",
        "options": ["1.5kg", "3kg", "6kg"]
      },
      {
        "group": "口味",
        "options": ["鸡肉", "三文鱼", "牛肉"]
      }
    ]
  },
  "model": "deepseek-ai/DeepSeek-V4-Flash",
  "usage": null
}
```

## Prompt And Validation

后端要求模型输出 JSON 对象，不允许 Markdown 或额外解释。

`intro` 输出规则：

- `tags` 必须是 3-6 个短中文标签。
- `summary` 必须是 2-4 条商品摘要，每条不超过 40 个中文字符。
- `suitable_text` 必须是中文字符串，不超过 80 个中文字符。
- 不编造医疗功效、库存、优惠、认证、平台承诺或未提供的成分比例。

`specs` 输出规则：

- `specs` 必须是数组。
- 每项包含 `group` 和 `options`。
- `group` 必须是非空中文字符串。
- `options` 必须是 1-12 个非空字符串。
- 不确定时返回最保守的结构，但不能返回坏 JSON。

后端会解析模型返回内容并做结构校验。字段不合法时返回业务错误，前端显示错误，不写入表单。

## Frontend Flow

`AI 生成介绍`：

- 继续要求分类、宠物类型、标题、副标题齐备。
- 点击后按钮进入 `生成中...` 状态。
- 请求成功后覆盖 `tags_text`、`summary_text`、`suitable_text`。
- 请求失败时在介绍生成区域显示错误，保留原字段内容。

`AI 生成规格`：

- 继续使用现有小弹窗输入自然语言描述。
- prompt 为空时前端直接提示 `请输入规格描述`，不请求后端。
- 请求中禁用生成按钮并显示 `生成中...`。
- 请求成功后将 `specs` 格式化为 JSON，写入 `form.specs_text`，并显示预览。
- 请求失败时显示错误，保留原规格 JSON。

## Error Handling

后端错误：

- 缺少 `mode` 或 mode 非法：400。
- `intro` 缺少必要商品上下文：400。
- `specs` 缺少 prompt：400。
- AI 未配置：沿用现有 50010。
- AI 超时：沿用现有 50400。
- AI 请求失败或返回空内容：沿用现有 502 系列。
- AI 返回 JSON 不合法或字段校验失败：502，提示 `AI generated invalid draft`。

前端错误：

- 使用接口返回 message。
- 错误只显示在对应 AI 区域或规格弹窗内。
- 不关闭商品弹窗，不自动保存商品。

## Testing

后端测试：

- 未带 admin key 请求 `/api/admin/products/ai-draft` 返回 401。
- `intro` 请求会把商品上下文传入模型，并返回校验后的 `tags`、`summary`、`suitable_text`。
- `specs` 请求会把自然语言 prompt 传入模型，并返回校验后的 `specs`。
- 非 JSON 或结构错误的模型响应返回 502。
- 空 prompt、缺少必要上下文返回 400，且不调用模型。

前端测试：

- `AI 生成介绍` 成功后覆盖标签、摘要、适用描述。
- `AI 生成介绍` 失败后显示错误并保留原字段。
- `AI 生成规格` 成功后写入格式化 JSON 并显示预览。
- `AI 生成规格` 空 prompt 不调用 API。
- `AI 生成规格` 失败后显示错误并保留原规格 JSON。

验证命令：

- `npm --prefix server run test -- tests/admin-ai-product-draft.test.js`
- `npm --prefix admin run test -- src/tests/product-form-dialog.test.js`
- `npm --prefix server run test`
- `npm --prefix admin run test`
- `npm --prefix admin run build`
