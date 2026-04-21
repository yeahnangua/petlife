import { success } from '../utils/apiResponse.js'
import { getUploadedImage } from '../services/uploadService.js'

export function uploadUserImageFile(req, res, next) {
  try {
    const file = getUploadedImage(req.file, req.app.locals.config)
    res.json(success({ file }))
  } catch (error) {
    next(error)
  }
}
