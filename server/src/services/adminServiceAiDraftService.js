import { AppError } from '../utils/appError.js'
import { requireString } from '../utils/validators.js'

const MAX_CONTEXT_TEXT_LENGTH = 200
const MAX_LIST_ITEMS = 5
const MAX_HIGHLIGHT_LENGTH = 10
const MAX_SUMMARY_NOTICE_LENGTH = 20

const BASE_SYSTEM_PROMPT = [
  '你是 PetLife 宠物生活馆后台服务资料编辑助手。',
  '你只为后台服务表单生成草稿字段，不要输出 Markdown 或额外解释。',
  '必须输出 JSON 对象。',
  '不要编造医疗功效、优惠、认证、平台承诺或未提供的服务项目。',
  '涉及疾病、治疗、严重异常时，只能使用温和的日常护理描述。'
].join('\n')

const SERVICE_OUTPUT_PROMPT = [
  '生成服务资料草稿。',
  '输出 JSON 格式：',
  '{"highlights":["亮点1","亮点2","亮点3"],"summary":["摘要1","摘要2"],"notice":["注意事项1","注意事项2"]}',
  '字段规则：',
  '- highlights 必须是 3-5 条中文亮点，亮点不超过 10 个汉字。',
  '- summary 必须是 2-4 条中文摘要，摘要和注意事项每条不超过 20 个汉字，10 个汉字左右最好，末尾不要有句号。',
  '- notice 必须是 2-5 条中文注意事项，摘要和注意事项每条不超过 20 个汉字，10 个汉字左右最好，末尾不要有句号。',
  '- 每个数组项会写入表单的一行，也就是一行一条。',
  '- 只能基于提供的服务上下文生成。'
].join('\n')

function trimText(value, maxLength = MAX_CONTEXT_TEXT_LENGTH) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim().slice(0, maxLength)
}

function trimStringList(value, maxItems, maxItemLength = 60) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => trimText(item, maxItemLength))
    .filter(Boolean)
    .slice(0, maxItems)
}

function normalizeDraftLine(value, maxItemLength) {
  return trimText(value, maxItemLength).replace(/[。．.]+$/g, '')
}

function normalizeDraftList(value, maxItems, maxItemLength) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => normalizeDraftLine(item, maxItemLength))
    .filter(Boolean)
    .slice(0, maxItems)
}

function normalizeServiceContext(value = {}) {
  return {
    title: trimText(value.title, 120),
    subtitle: trimText(value.subtitle, 160),
    pet_type: trimText(value.pet_type, 40),
    pet_type_label: trimText(value.pet_type_label, 40),
    price: Number.isFinite(Number(value.price)) ? Number(value.price) : null,
    member_price: Number.isFinite(Number(value.member_price)) ? Number(value.member_price) : null,
    original_price: Number.isFinite(Number(value.original_price)) ? Number(value.original_price) : null,
    duration_minutes: Number.isFinite(Number(value.duration_minutes)) ? Number(value.duration_minutes) : null,
    badge: trimText(value.badge, 40),
    highlights: trimStringList(value.highlights, 8, 40),
    summary: trimStringList(value.summary, 6, 80),
    notice: trimStringList(value.notice, 8, 80)
  }
}

function requireServiceContext(service) {
  requireString(service.title, 'service.title')
  requireString(service.subtitle, 'service.subtitle')
  requireString(service.pet_type, 'service.pet_type')
}

function formatServiceContext(service) {
  const lines = [
    `宠物类型：${service.pet_type_label || service.pet_type}`,
    `标题：${service.title}`,
    `副标题：${service.subtitle}`,
    service.price != null ? `价格：${service.price}` : '',
    service.member_price != null ? `会员价：${service.member_price}` : '',
    service.original_price != null ? `原价：${service.original_price}` : '',
    service.duration_minutes != null ? `时长：${service.duration_minutes} 分钟` : '',
    service.badge ? `角标：${service.badge}` : '',
    service.highlights.length ? `已有亮点：${service.highlights.join('；')}` : '',
    service.summary.length ? `已有摘要：${service.summary.join('；')}` : '',
    service.notice.length ? `已有注意事项：${service.notice.join('；')}` : ''
  ]

  return lines.filter(Boolean).join('\n')
}

function parseJsonObject(content) {
  const text = trimText(content, 6000)

  if (!text) {
    throw new AppError(502, 50202, 'AI generated invalid draft')
  }

  try {
    const parsed = JSON.parse(text)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('not object')
    }
    return parsed
  } catch {
    throw new AppError(502, 50202, 'AI generated invalid draft')
  }
}

function normalizeBoundedList(value, { min, max, itemLength }) {
  const items = normalizeDraftList(value, max, itemLength)

  if (items.length < min) {
    throw new AppError(502, 50202, 'AI generated invalid draft')
  }

  return items
}

function normalizeServiceDraft(parsed) {
  return {
    highlights: normalizeBoundedList(parsed.highlights, {
      min: 3,
      max: MAX_LIST_ITEMS,
      itemLength: MAX_HIGHLIGHT_LENGTH
    }),
    summary: normalizeBoundedList(parsed.summary, {
      min: 2,
      max: 4,
      itemLength: MAX_SUMMARY_NOTICE_LENGTH
    }),
    notice: normalizeBoundedList(parsed.notice, {
      min: 2,
      max: MAX_LIST_ITEMS,
      itemLength: MAX_SUMMARY_NOTICE_LENGTH
    })
  }
}

function buildMessages(service) {
  return [
    { role: 'system', content: BASE_SYSTEM_PROMPT },
    { role: 'system', content: SERVICE_OUTPUT_PROMPT },
    {
      role: 'user',
      content: ['服务上下文：', formatServiceContext(service), '请生成服务资料草稿。'].join('\n')
    }
  ]
}

export async function createAdminServiceAiDraft({ config, chatClient, body = {} }) {
  const service = normalizeServiceContext(body.service)
  requireServiceContext(service)

  const result = await chatClient({
    model: config.aiModel,
    messages: buildMessages(service),
    responseFormat: { type: 'json_object' }
  })
  const draft = normalizeServiceDraft(parseJsonObject(result.content))

  return {
    draft,
    model: result.model ?? config.aiModel,
    usage: result.usage ?? null
  }
}
