import { success } from '../utils/apiResponse.js'
import {
  getCategories,
  getProductDetail,
  getProducts,
  getServiceDetail,
  getServices,
  getStoreSlots,
  getStores
} from '../services/catalogService.js'

function getDb(req) {
  return req.app.locals.db
}

export function listCategories(req, res, next) {
  try {
    const list = getCategories(getDb(req))
    res.json(success({ list }))
  } catch (error) {
    next(error)
  }
}

export function listProducts(req, res, next) {
  try {
    const data = getProducts(getDb(req), req.query)
    res.json(success(data))
  } catch (error) {
    next(error)
  }
}

export function getProduct(req, res, next) {
  try {
    const item = getProductDetail(getDb(req), req.params.id)
    res.json(success({ item }))
  } catch (error) {
    next(error)
  }
}

export function listServices(req, res, next) {
  try {
    const data = getServices(getDb(req), req.query)
    res.json(success(data))
  } catch (error) {
    next(error)
  }
}

export function getService(req, res, next) {
  try {
    const item = getServiceDetail(getDb(req), req.params.id)
    res.json(success({ item }))
  } catch (error) {
    next(error)
  }
}

export function listStores(req, res, next) {
  try {
    const list = getStores(getDb(req))
    res.json(success({ list }))
  } catch (error) {
    next(error)
  }
}

export function listStoreSlots(req, res, next) {
  try {
    const data = getStoreSlots(getDb(req), req.params.id, req.query)
    res.json(success({ list: data.list }))
  } catch (error) {
    next(error)
  }
}
