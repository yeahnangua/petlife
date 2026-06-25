# PetLife 后台商品详情 AI 生成 UI 设计

## Goal

在 admin 端商品编辑弹窗中加入两类 AI 辅助 UI：

- 通过已填写的分类、宠物类型、标题、副标题，生成并覆盖商品的标签、摘要、适用描述。
- 通过自然语言描述生成规格 JSON，并写入现有规格 JSON 文本域。

本阶段只实现前端 UI 与确定性的 mock 生成逻辑，不接入真实大模型 API。

## Scope

涉及文件：

- `admin/src/components/ProductFormDialog.vue`
- `admin/src/tests/product-form-dialog.test.js`

不涉及内容：

- 后端接口、鉴权、数据库字段。
- 商品保存 payload 结构变化。
- 用户端商品详情页展示逻辑。

## User Flow

商家打开商品新增或编辑弹窗后，先填写分类、宠物类型、标题、副标题。

在标签、摘要、适用描述区域上方，商家点击“AI 生成介绍”。前端根据当前表单上下文模拟生成内容，并直接覆盖以下字段：

- 标签
- 摘要
- 适用描述

在规格 JSON 字段标题旁，商家点击“AI 生成规格”。系统打开一个对话框，商家输入自然语言，例如“规格有 1.5kg 3kg 和 6kg，口味有鸡肉 三文鱼 和牛肉”。点击生成后，前端将 mock 解析出的 JSON 格式化写入规格 JSON 文本域，并关闭或保留弹窗结果预览。

## UI Design

商品介绍生成区域沿用现有表单样式，在“标签”字段前加入一个横向工具条：

- 左侧说明当前生成依据：分类、宠物类型、标题、副标题。
- 右侧放置“AI 生成介绍”按钮。
- 当必填上下文缺失时，按钮禁用，并显示“请先填写分类、宠物类型、标题、副标题”。
- 按钮点击后显示短暂“生成中...”状态。
- 生成会覆盖当前标签、摘要、适用描述，按钮旁显示“会覆盖当前介绍内容”。

规格 JSON 区域改为带标题工具条：

- 左侧标题“规格 JSON”。
- 右侧按钮“AI 生成规格”。
- 点击后展示一个小型弹窗，包含自然语言输入框、生成按钮、取消按钮、错误提示和 JSON 预览区域。
- 生成成功后，把格式化 JSON 写入现有 `form.specs_text`。

## Data Flow

现阶段新增两个本地函数：

- `generateIntroDraft(context)`：输入分类名称、宠物类型 label、标题、副标题，返回 `{ tags, summary, suitableText }`。
- `generateSpecsDraft(prompt)`：输入自然语言，返回规格数组并格式化为 JSON 文本。

这些函数是后续 API 接入的替换点。未来接入真实 API 时，组件事件和字段写入逻辑保持不变，只替换生成函数为异步 API 调用。

## Validation And Errors

“AI 生成介绍”按钮在缺少分类、宠物类型、标题、副标题时禁用。

“AI 生成规格”弹窗校验自然语言输入：

- 输入为空时显示错误，不写入规格 JSON。
- mock 无法解析时生成一个保守的示例结构，避免 UI 流程中断。

保存商品时继续使用现有 JSON 校验逻辑。如果规格 JSON 格式不正确，仍显示“规格 JSON 格式不正确”。

## Testing

新增 `ProductFormDialog` 组件测试：

- 打开表单后，点击“AI 生成介绍”会覆盖已有标签、摘要、适用描述。
- 点击“AI 生成规格”打开弹窗，输入自然语言后生成格式化 JSON，并写入规格 JSON 文本域。

运行验证：

- `cd admin && npm test -- src/tests/product-form-dialog.test.js`
- `cd admin && npm run build`
