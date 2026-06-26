import { createHash, timingSafeEqual } from 'node:crypto'
import { AppError } from '../utils/appError.js'

const DEFAULT_WELCOME_MESSAGE = '欢迎关注 PetLife，点击菜单可进入商城。'

function getField(xml, fieldName) {
  const match = String(xml || '').match(new RegExp(`<${fieldName}>\\s*(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))\\s*<\\/${fieldName}>`))
  return (match?.[1] ?? match?.[2] ?? '').trim()
}

function escapeCdata(value) {
  return String(value ?? '').replaceAll(']]>', ']]]]><![CDATA[>')
}

function sign({ token, timestamp, nonce }) {
  return createHash('sha1')
    .update([token, timestamp, nonce].sort().join(''))
    .digest('hex')
}

function safeCompare(a, b) {
  const left = Buffer.from(String(a || ''), 'utf8')
  const right = Buffer.from(String(b || ''), 'utf8')

  return left.length === right.length && timingSafeEqual(left, right)
}

function requireCallbackToken(config) {
  const token = config.wechatOfficialAccountToken

  if (!token) {
    throw new AppError(500, 50022, 'WeChat callback token is not configured')
  }

  return token
}

export function verifyWechatCallbackSignature(config, query = {}) {
  const token = requireCallbackToken(config)
  const { signature, timestamp, nonce } = query

  if (!signature || !timestamp || !nonce) {
    throw new AppError(403, 40320, 'invalid WeChat callback signature')
  }

  if (!safeCompare(signature, sign({ token, timestamp, nonce }))) {
    throw new AppError(403, 40320, 'invalid WeChat callback signature')
  }
}

function buildTextReply({ toUserName, fromUserName, content }) {
  return [
    '<xml>',
    `<ToUserName><![CDATA[${escapeCdata(toUserName)}]]></ToUserName>`,
    `<FromUserName><![CDATA[${escapeCdata(fromUserName)}]]></FromUserName>`,
    `<CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime>`,
    '<MsgType><![CDATA[text]]></MsgType>',
    `<Content><![CDATA[${escapeCdata(content)}]]></Content>`,
    '</xml>'
  ].join('')
}

export function createWechatEventReply(config, xml) {
  const message = {
    toUserName: getField(xml, 'ToUserName'),
    fromUserName: getField(xml, 'FromUserName'),
    msgType: getField(xml, 'MsgType'),
    event: getField(xml, 'Event')
  }

  if (message.msgType === 'event' && message.event === 'subscribe') {
    return buildTextReply({
      toUserName: message.fromUserName,
      fromUserName: message.toUserName,
      content: config.wechatOfficialAccountWelcomeMessage || DEFAULT_WELCOME_MESSAGE
    })
  }

  return ''
}
