import { success } from '../utils/apiResponse.js'
import {
  createWechatOfficialAccountOAuthStart,
  getUserByToken,
  handleWechatOfficialAccountOAuthCallback,
  loginWithDemoWechat,
  logoutByToken
} from '../services/authService.js'
import { readBearerToken } from '../middleware/requireUserAuth.js'

export function wechatLogin(req, res, next) {
  try {
    res.json(success(loginWithDemoWechat(req.app.locals.db)))
  } catch (error) {
    next(error)
  }
}

export function startWechatOAuth(req, res, next) {
  try {
    const url = createWechatOfficialAccountOAuthStart(req.app.locals.db, req.app.locals.config, req.query)
    res.redirect(url)
  } catch (error) {
    next(error)
  }
}

export async function finishWechatOAuth(req, res, next) {
  try {
    const url = await handleWechatOfficialAccountOAuthCallback(
      req.app.locals.db,
      req.app.locals.config,
      req.app.locals.wechatOfficialAccountClient,
      req.query
    )
    res.redirect(url)
  } catch (error) {
    next(error)
  }
}

export function getSession(req, res, next) {
  try {
    const user = getUserByToken(req.app.locals.db, readBearerToken(req))
    res.json(success({ user }))
  } catch (error) {
    next(error)
  }
}

export function logout(req, res, next) {
  try {
    logoutByToken(req.app.locals.db, readBearerToken(req))
    res.json(success({ ok: true }))
  } catch (error) {
    next(error)
  }
}
