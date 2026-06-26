import {
  createWechatEventReply,
  verifyWechatCallbackSignature
} from '../services/wechatEventService.js'

export function verifyWechatEventCallback(req, res, next) {
  try {
    verifyWechatCallbackSignature(req.app.locals.config, req.query)
    res.type('text/plain').send(req.query.echostr || '')
  } catch (error) {
    next(error)
  }
}

export function handleWechatEventCallback(req, res, next) {
  try {
    verifyWechatCallbackSignature(req.app.locals.config, req.query)
    const reply = createWechatEventReply(req.app.locals.config, req.body)

    if (!reply) {
      res.type('text/plain').send('')
      return
    }

    res.type('application/xml').send(reply)
  } catch (error) {
    next(error)
  }
}
