import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const uploadApi = vi.hoisted(() => ({
  uploadImage: vi.fn(),
  uploadImageFromUrl: vi.fn()
}))

vi.mock('@/api/upload', () => uploadApi)

import UploadImageField from '@/components/UploadImageField.vue'

describe('UploadImageField', () => {
  beforeEach(() => {
    uploadApi.uploadImage.mockReset()
    uploadApi.uploadImageFromUrl.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('opens an image source dialog with local url and clipboard import options', async () => {
    const wrapper = mount(UploadImageField, {
      props: {
        modelValue: '/uploads/current.jpg',
        label: '商品封面'
      }
    })

    await wrapper.get('button').trigger('click')

    expect(wrapper.text()).toContain('本地导入')
    expect(wrapper.text()).toContain('从链接导入')
    expect(wrapper.text()).toContain('从剪切板导入')
  })

  it('downloads a linked image through the server and emits the local upload url', async () => {
    uploadApi.uploadImageFromUrl.mockResolvedValue({
      file: {
        url: '/uploads/2026/04/remote-product.png'
      }
    })

    const wrapper = mount(UploadImageField, {
      props: {
        modelValue: '',
        label: '商品封面'
      }
    })

    await wrapper.get('button').trigger('click')
    await wrapper.get('[data-test="open-url-import"]').trigger('click')
    await wrapper.get('[data-test="image-url-input"]').setValue('https://example.com/product.png')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(uploadApi.uploadImageFromUrl).toHaveBeenCalledWith('https://example.com/product.png')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([
      '/uploads/2026/04/remote-product.png'
    ])
  })

  it('imports an image from the clipboard through the normal upload endpoint', async () => {
    const clipboardBlob = new Blob(['clipboard-image'], { type: 'image/png' })
    const getType = vi.fn().mockResolvedValue(clipboardBlob)
    const read = vi.fn().mockResolvedValue([
      {
        types: ['image/png'],
        getType
      }
    ])
    Object.defineProperty(navigator, 'clipboard', {
      value: { read },
      configurable: true
    })
    uploadApi.uploadImage.mockResolvedValue({
      file: {
        url: '/uploads/2026/04/clipboard.png'
      }
    })

    const wrapper = mount(UploadImageField, {
      props: {
        modelValue: '',
        label: '商品封面'
      }
    })

    await wrapper.get('button').trigger('click')
    await wrapper.get('[data-test="import-clipboard-image"]').trigger('click')
    await flushPromises()

    expect(read).toHaveBeenCalled()
    expect(getType).toHaveBeenCalledWith('image/png')
    expect(uploadApi.uploadImage).toHaveBeenCalledWith(expect.any(File))
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['/uploads/2026/04/clipboard.png'])
  })

  it('removes a selected image from multiple image lists', async () => {
    const wrapper = mount(UploadImageField, {
      props: {
        modelValue: ['/uploads/one.jpg', '/uploads/two.jpg'],
        label: '商品图集',
        multiple: true
      }
    })

    await wrapper.get('[data-test="remove-image-/uploads/one.jpg"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['/uploads/two.jpg']])
  })
})
