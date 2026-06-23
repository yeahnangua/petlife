import { success } from '../utils/apiResponse.js'
import {
  createAdminStore,
  deleteAdminStore,
  getAdminStores,
  updateAdminStore
} from '../services/adminCatalogService.js'

export function listAdminStores(req, res, next) {
  try {
    const list = getAdminStores(req.app.locals.db)
    res.json(success({ list }))
  } catch (error) {
    next(error)
  }
}

export function createStore(req, res, next) {
  try {
    const item = createAdminStore(req.app.locals.db, req.body)
    res.status(201).json(success({ item }))
  } catch (error) {
    next(error)
  }
}

export function updateStore(req, res, next) {
  try {
    const item = updateAdminStore(req.app.locals.db, req.params.id, req.body)
    res.json(success({ item }))
  } catch (error) {
    next(error)
  }
}

export function deleteStore(req, res, next) {
  try {
    const item = deleteAdminStore(req.app.locals.db, req.params.id)
    res.json(success({ item }))
  } catch (error) {
    next(error)
  }
}
