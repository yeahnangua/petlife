import { success } from '../utils/apiResponse.js'
import { getProfile } from '../services/profileService.js'

export function getUserProfile(req, res, next) {
  try {
    const profile = getProfile(req.app.locals.db, req.user.id)
    res.json(success({ profile }))
  } catch (error) {
    next(error)
  }
}
