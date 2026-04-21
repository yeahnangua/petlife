import { success } from '../utils/apiResponse.js'
import {
  createAdminTimeSlot,
  deleteAdminTimeSlot,
  getAdminTimeSlots,
  updateAdminTimeSlot
} from '../services/adminCatalogService.js'

export function listAdminTimeSlots(req, res, next) {
  try {
    const list = getAdminTimeSlots(req.app.locals.db)
    res.json(success({ list }))
  } catch (error) {
    next(error)
  }
}

export function createTimeSlot(req, res, next) {
  try {
    const item = createAdminTimeSlot(req.app.locals.db, req.body)
    res.status(201).json(success({ item }))
  } catch (error) {
    next(error)
  }
}

export function updateTimeSlot(req, res, next) {
  try {
    const item = updateAdminTimeSlot(req.app.locals.db, req.params.id, req.body)
    res.json(success({ item }))
  } catch (error) {
    next(error)
  }
}

export function deleteTimeSlot(req, res, next) {
  try {
    const item = deleteAdminTimeSlot(req.app.locals.db, req.params.id)
    res.json(success({ item }))
  } catch (error) {
    next(error)
  }
}
