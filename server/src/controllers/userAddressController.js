import { success } from '../utils/apiResponse.js'
import {
  createUserAddress,
  deleteUserAddress,
  getAddresses,
  updateUserAddress
} from '../services/profileService.js'

export function listUserAddresses(req, res, next) {
  try {
    const list = getAddresses(req.app.locals.db, req.user.id)
    res.json(success({ list }))
  } catch (error) {
    next(error)
  }
}

export function createAddress(req, res, next) {
  try {
    const item = createUserAddress(req.app.locals.db, req.user.id, req.body)
    res.status(201).json(success({ item }))
  } catch (error) {
    next(error)
  }
}

export function updateAddress(req, res, next) {
  try {
    const item = updateUserAddress(req.app.locals.db, req.user.id, req.params.id, req.body)
    res.json(success({ item }))
  } catch (error) {
    next(error)
  }
}

export function deleteAddress(req, res, next) {
  try {
    const item = deleteUserAddress(req.app.locals.db, req.user.id, req.params.id)
    res.json(success({ item }))
  } catch (error) {
    next(error)
  }
}
