import { success } from '../utils/apiResponse.js'
import { downloadUploadedImageFromUrl, getUploadedImage } from '../services/uploadService.js'

export function uploadImageFile(req, res, next) {
  try {
    const file = getUploadedImage(req.file, req.app.locals.config)
    res.json(success({ file }))
  } catch (error) {
    next(error)
  }
}

export async function uploadImageFromUrl(req, res, next) {
  try {
    const file = await downloadUploadedImageFromUrl(req.body?.url, req.app.locals.config)
    res.json(success({ file }))
  } catch (error) {
    next(error)
  }
}
