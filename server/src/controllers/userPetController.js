import { success } from '../utils/apiResponse.js'
import {
  createUserPet,
  deleteUserPet,
  getPets,
  updateUserPet
} from '../services/profileService.js'

export function listUserPets(req, res, next) {
  try {
    const list = getPets(req.app.locals.db, req.user.id)
    res.json(success({ list }))
  } catch (error) {
    next(error)
  }
}

export function createPet(req, res, next) {
  try {
    const item = createUserPet(req.app.locals.db, req.user.id, req.body)
    res.status(201).json(success({ item }))
  } catch (error) {
    next(error)
  }
}

export function updatePet(req, res, next) {
  try {
    const item = updateUserPet(req.app.locals.db, req.user.id, req.params.id, req.body)
    res.json(success({ item }))
  } catch (error) {
    next(error)
  }
}

export function deletePet(req, res, next) {
  try {
    const item = deleteUserPet(req.app.locals.db, req.user.id, req.params.id)
    res.json(success({ item }))
  } catch (error) {
    next(error)
  }
}
