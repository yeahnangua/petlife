import { success } from '../utils/apiResponse.js'
import {
  createAdminCategory,
  deleteAdminCategory,
  getAdminCategories,
  updateAdminCategory
} from '../services/adminCatalogService.js'

export function listAdminCategories(req, res, next) {
  try {
    const list = getAdminCategories(req.app.locals.db)
    res.json(success({ list }))
  } catch (error) {
    next(error)
  }
}

export function createCategory(req, res, next) {
  try {
    const item = createAdminCategory(req.app.locals.db, req.body)
    res.status(201).json(success({ item }))
  } catch (error) {
    next(error)
  }
}

export function updateCategory(req, res, next) {
  try {
    const item = updateAdminCategory(req.app.locals.db, req.params.id, req.body)
    res.json(success({ item }))
  } catch (error) {
    next(error)
  }
}

export function deleteCategory(req, res, next) {
  try {
    const item = deleteAdminCategory(req.app.locals.db, req.params.id)
    res.json(success({ item }))
  } catch (error) {
    next(error)
  }
}
