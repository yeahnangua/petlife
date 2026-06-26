import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { generateServiceAiDraft } from '@/api/catalog'
import ServiceFormDialog from '@/components/ServiceFormDialog.vue'

vi.mock('@/api/catalog', () => ({
  generateServiceAiDraft: vi.fn()
}))

function mountDialog(initialValue = {}) {
  return mount(ServiceFormDialog, {
    props: {
      modelValue: true,
      initialValue: {
        id: 's_001',
        title: '基础洗护 · 标准套餐',
        subtitle: '适合日常清洁与毛发护理',
        pet_type: 'cat',
        price: 128,
        member_price: 108,
        original_price: 158,
        duration_minutes: 60,
        badge: '热门',
        highlights: ['旧亮点'],
        summary: ['旧摘要'],
        notice: ['旧注意事项'],
        cover_url: '/uploads/service.jpg',
        status: 'active',
        image_urls: [],
        ...initialValue
      }
    },
    global: {
      stubs: {
        UploadImageField: {
          props: ['modelValue', 'label', 'multiple'],
          template: '<div class="upload-image-field-stub">{{ label }}</div>'
        }
      }
    }
  })
}

describe('ServiceFormDialog AI helper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('overwrites highlights summary and notice from the AI draft api', async () => {
    generateServiceAiDraft.mockResolvedValue({
      draft: {
        highlights: ['基础清洁', '毛发梳理', '耳爪护理'],
        summary: ['适合日常洗护需求，覆盖清洁、梳理与基础护理', '流程温和，适合多数健康猫咪'],
        notice: ['到店前请确认宠物健康状态', '敏感体质请提前告知门店']
      }
    })
    const wrapper = mountDialog()

    await wrapper.get('[data-test="generate-service-ai"]').trigger('click')
    await flushPromises()

    expect(generateServiceAiDraft).toHaveBeenCalledWith({
      service: expect.objectContaining({
        title: '基础洗护 · 标准套餐',
        subtitle: '适合日常清洁与毛发护理',
        pet_type: 'cat',
        pet_type_label: '猫咪',
        highlights: ['旧亮点'],
        summary: ['旧摘要'],
        notice: ['旧注意事项']
      })
    })
    expect(wrapper.get('[data-test="service-highlights"]').element.value).toBe('基础清洁\n毛发梳理\n耳爪护理')
    expect(wrapper.get('[data-test="service-summary"]').element.value).toBe(
      '适合日常洗护需求，覆盖清洁、梳理与基础护理\n流程温和，适合多数健康猫咪'
    )
    expect(wrapper.get('[data-test="service-notice"]').element.value).toBe(
      '到店前请确认宠物健康状态\n敏感体质请提前告知门店'
    )
  })

  it('keeps service fields unchanged and shows an error when generation fails', async () => {
    generateServiceAiDraft.mockRejectedValue(new Error('AI generated invalid draft'))
    const wrapper = mountDialog()

    await wrapper.get('[data-test="generate-service-ai"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('AI generated invalid draft')
    expect(wrapper.get('[data-test="service-highlights"]').element.value).toBe('旧亮点')
    expect(wrapper.get('[data-test="service-summary"]').element.value).toBe('旧摘要')
    expect(wrapper.get('[data-test="service-notice"]').element.value).toBe('旧注意事项')
  })
})
