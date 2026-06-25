import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ProductFormDialog from '@/components/ProductFormDialog.vue'

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
        specs: [],
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
  it('overwrites tags summary and suitable text from the filled product context', async () => {
    const wrapper = mountDialog()

    await wrapper.get('[data-test="generate-intro"]').trigger('click')

    const tags = wrapper.get('[data-test="product-tags"]').element
    const summary = wrapper.get('[data-test="product-summary"]').element
    const suitable = wrapper.get('[data-test="product-suitable"]').element

    expect(tags.value).toBe('低敏, 无谷, 鲜肉70%, 猫粮')
    expect(summary.value).toBe([
      '鲜肉含量 70%，保留原始营养',
      '低敏配方，适合肠胃敏感猫咪',
      '自研冷鲜锁鲜工艺'
    ].join('\n'))
    expect(suitable.value).toBe('适合 1-8 岁成猫 / 全品种')
  })

  it('generates formatted specs JSON from a natural language prompt', async () => {
    const wrapper = mountDialog()

    await wrapper.get('[data-test="open-specs-ai"]').trigger('click')
    await wrapper
      .get('[data-test="specs-ai-prompt"]')
      .setValue('规格有 1.5kg 3kg 和 6kg ，口味有鸡肉 三文鱼 和牛肉')
    await wrapper.get('[data-test="generate-specs-json"]').trigger('click')

    const specs = wrapper.get('[data-test="product-specs"]').element

    expect(specs.value).toBe(JSON.stringify([
      {
        group: '规格',
        options: ['1.5kg', '3kg', '6kg']
      },
      {
        group: '口味',
        options: ['鸡肉', '三文鱼', '牛肉']
      }
    ], null, 2))
  })

  it('dims the product form background while the specs AI dialog is open', async () => {
    const wrapper = mountDialog()

    expect(wrapper.find('[data-test="specs-ai-backdrop"]').exists()).toBe(false)

    await wrapper.get('[data-test="open-specs-ai"]').trigger('click')

    expect(wrapper.get('[data-test="specs-ai-backdrop"]').classes()).toContain('ai-modal-backdrop')
  })
})
