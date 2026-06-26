import { success } from '../utils/apiResponse.js'
import { loginWithDemoWechat, logoutByToken, getUserByToken } from '../services/authService.js'
import { readBearerToken } from '../middleware/requireUserAuth.js'

export function wechatLogin(req, res, next) {
  try {
    res.json(success(loginWithDemoWechat(req.app.locals.db)))
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
