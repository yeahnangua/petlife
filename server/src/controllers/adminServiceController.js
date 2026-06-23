import { success } from '../utils/apiResponse.js'
import {
  createAdminService,
  deleteAdminService,
  getAdminServices,
  updateAdminService
} from '../services/adminCatalogService.js'

export function listAdminServices(req, res, next) {
  try {
    const list = getAdminServices(req.app.locals.db)
    res.json(success({ list }))
  } catch (error) {
    next(error)
  }
}

export function createService(req, res, next) {
  try {
    const item = createAdminService(req.app.locals.db, req.body)
    res.status(201).json(success({ item }))
  } catch (error) {
    next(error)
  }
}

export function updateService(req, res, next) {
  try {
    const item = updateAdminService(req.app.locals.db, req.params.id, req.body)
    res.json(success({ item }))
  } catch (error) {
    next(error)
  }
}

export function deleteService(req, res, next) {
  try {
    const item = deleteAdminService(req.app.locals.db, req.params.id)
    res.json(success({ item }))
  } catch (error) {
    next(error)
  }
}
