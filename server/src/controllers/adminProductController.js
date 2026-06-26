import { success } from '../utils/apiResponse.js'
import {
  createAdminProduct,
  deleteAdminProduct,
  getAdminProducts,
  updateAdminProduct
} from '../services/adminCatalogService.js'
import { createAdminProductAiDraft } from '../services/adminProductAiDraftService.js'

export function listAdminProducts(req, res, next) {
  try {
    const list = getAdminProducts(req.app.locals.db)
    res.json(success({ list }))
  } catch (error) {
    next(error)
  }
}

export async function createProductAiDraft(req, res, next) {
  try {
    const data = await createAdminProductAiDraft({
      config: req.app.locals.config,
      chatClient: req.app.locals.aiChatClient,
      body: req.body
    })
    res.json(success(data))
  } catch (error) {
    next(error)
  }
}

export function createProduct(req, res, next) {
  try {
    const item = createAdminProduct(req.app.locals.db, req.body)
    res.status(201).json(success({ item }))
  } catch (error) {
    next(error)
  }
}

export function updateProduct(req, res, next) {
  try {
    const item = updateAdminProduct(req.app.locals.db, req.params.id, req.body)
    res.json(success({ item }))
  } catch (error) {
    next(error)
  }
}

export function deleteProduct(req, res, next) {
  try {
    const item = deleteAdminProduct(req.app.locals.db, req.params.id)
    res.json(success({ item }))
  } catch (error) {
    next(error)
  }
}
