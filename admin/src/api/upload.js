import { request } from '@/api/http'

export function uploadImage(file) {
  const formData = new FormData()
  formData.append('file', file)

  return request('/api/admin/uploads/images', {
    method: 'POST',
    body: formData
  })
}

export function uploadImageFromUrl(url) {
  return request('/api/admin/uploads/images/from-url', {
    method: 'POST',
    body: { url }
  })
}
