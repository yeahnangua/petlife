import { request } from '@/api/http'

export function uploadImage(file) {
  const formData = new FormData()
  formData.append('image', file)

  return request('/api/admin/uploads/images', {
    method: 'POST',
    body: formData
  })
}
