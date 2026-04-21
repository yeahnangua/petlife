import { success } from '../utils/apiResponse.js'
import { getProfile, updateUserProfile as updateUserProfileService } from '../services/profileService.js'

export function getUserProfile(req, res, next) {
  try {
    const profile = getProfile(req.app.locals.db, req.user.id)
    res.json(success({ profile }))
  } catch (error) {
    next(error)
  }
}

export function updateUserProfile(req, res, next) {
  try {
    const profile = updateUserProfileService(req.app.locals.db, req.user.id, req.body)
    res.json(success({ profile }))
  } catch (error) {
    next(error)
  }
}
