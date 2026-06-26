import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { generateProductAiDraft } from '@/api/catalog'
import ProductFormDialog from '@/components/ProductFormDialog.vue'

vi.mock('@/api/catalog', () => ({
  generateProductAiDraft: vi.fn()
}))

const categories = [
  {
    id: 'cat-food',
    name: '主粮'
  }
]

function mountDialog(initialValue = {}) {
  return mount(ProductFormDialog, {
    props: {
      modelValue: true,
      categories,
      initialValue: {
        id: 'p_001',
        category_id: 'cat-food',
        title: '鲜肉全价猫粮',
        subtitle: '低敏冷鲜配方 · 成猫通用',
        pet_type: 'cat',
        price: 268,
        member_price: 248,
        original_price: 298,
        stock: 42,
        stock_status: 'inStock',
        badge: '热卖',
        tags: ['旧标签'],
        specs: [{ group: '旧规格', options: ['旧选项'] }],
        summary: ['旧摘要'],
        suitable_text: '旧适用描述',
        cover_url: '/uploads/product.jpg',
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

describe('ProductFormDialog AI helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('overwrites tags summary and suitable text from the AI intro draft api', async () => {
    generateProductAiDraft.mockResolvedValue({
      draft: {
        tags: ['低敏', '成猫', '鲜肉配方'],
        summary: ['鲜肉配方，适合作为成猫日常主粮', '颗粒适口，兼顾营养和消化负担'],
        suitable_text: '适合 1-8 岁成猫日常喂养'
      }
    })
    const wrapper = mountDialog()

    await wrapper.get('[data-test="generate-intro"]').trigger('click')
    await flushPromises()

    const tags = wrapper.get('[data-test="product-tags"]').element
    const summary = wrapper.get('[data-test="product-summary"]').element
    const suitable = wrapper.get('[data-test="product-suitable"]').element

    expect(generateProductAiDraft).toHaveBeenCalledWith({
      mode: 'intro',
      product: expect.objectContaining({
        category_id: 'cat-food',
        category_name: '主粮',
        pet_type: 'cat',
        pet_type_label: '猫咪',
        title: '鲜肉全价猫粮',
        subtitle: '低敏冷鲜配方 · 成猫通用',
        tags: ['旧标签'],
        summary: ['旧摘要'],
        suitable_text: '旧适用描述'
      })
    })
    expect(tags.value).toBe('低敏, 成猫, 鲜肉配方')
    expect(summary.value).toBe('鲜肉配方，适合作为成猫日常主粮\n颗粒适口，兼顾营养和消化负担')
    expect(suitable.value).toBe('适合 1-8 岁成猫日常喂养')
  })

  it('keeps intro fields unchanged and shows an error when intro generation fails', async () => {
    generateProductAiDraft.mockRejectedValue(new Error('AI service request failed'))
    const wrapper = mountDialog()

    await wrapper.get('[data-test="generate-intro"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('AI service request failed')
    expect(wrapper.get('[data-test="product-tags"]').element.value).toBe('旧标签')
    expect(wrapper.get('[data-test="product-summary"]').element.value).toBe('旧摘要')
    expect(wrapper.get('[data-test="product-suitable"]').element.value).toBe('旧适用描述')
  })

  it('writes formatted specs JSON from the AI specs draft api', async () => {
    const specs = [
      { group: '规格', options: ['1.5kg', '3kg', '6kg'] },
      { group: '口味', options: ['鸡肉', '三文鱼', '牛肉'] }
    ]
    generateProductAiDraft.mockResolvedValue({
      draft: { specs }
    })
    const wrapper = mountDialog()

    await wrapper.get('[data-test="open-specs-ai"]').trigger('click')
    await wrapper
      .get('[data-test="specs-ai-prompt"]')
      .setValue('规格有 1.5kg 3kg 和 6kg ，口味有鸡肉 三文鱼 和牛肉')
    await wrapper.get('[data-test="generate-specs-json"]').trigger('click')
    await flushPromises()

    const specsField = wrapper.get('[data-test="product-specs"]').element
    const expectedText = JSON.stringify(specs, null, 2)

    expect(generateProductAiDraft).toHaveBeenCalledWith({
      mode: 'specs',
      prompt: '规格有 1.5kg 3kg 和 6kg ，口味有鸡肉 三文鱼 和牛肉',
      product: expect.objectContaining({
        category_name: '主粮',
        pet_type: 'cat',
        title: '鲜肉全价猫粮',
        subtitle: '低敏冷鲜配方 · 成猫通用'
      })
    })
    expect(specsField.value).toBe(expectedText)
    expect(wrapper.get('.ai-modal__preview').text()).toBe(expectedText)
  })

  it('does not call the AI draft api when the specs prompt is empty', async () => {
    const wrapper = mountDialog()

    await wrapper.get('[data-test="open-specs-ai"]').trigger('click')
    await wrapper.get('[data-test="generate-specs-json"]').trigger('click')

    expect(generateProductAiDraft).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('请输入规格描述')
  })

  it('keeps specs JSON unchanged and shows an error when specs generation fails', async () => {
    generateProductAiDraft.mockRejectedValue(new Error('AI generated invalid draft'))
    const wrapper = mountDialog()
    const originalSpecsText = JSON.stringify([{ group: '旧规格', options: ['旧选项'] }], null, 2)

    await wrapper.get('[data-test="open-specs-ai"]').trigger('click')
    await wrapper.get('[data-test="specs-ai-prompt"]').setValue('规格有 1.5kg')
    await wrapper.get('[data-test="generate-specs-json"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('AI generated invalid draft')
    expect(wrapper.get('[data-test="product-specs"]').element.value).toBe(originalSpecsText)
  })

  it('dims the product form background while the specs AI dialog is open', async () => {
    const wrapper = mountDialog()

    expect(wrapper.find('[data-test="specs-ai-backdrop"]').exists()).toBe(false)

    await wrapper.get('[data-test="open-specs-ai"]').trigger('click')

    expect(wrapper.get('[data-test="specs-ai-backdrop"]').classes()).toContain('ai-modal-backdrop')
  })
})
