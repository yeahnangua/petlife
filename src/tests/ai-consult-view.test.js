import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sendAiConsultMessage } from '@/api/public'
import { useCatalogStore } from '@/stores/catalog'
import AiConsultView from '@/views/AiConsultView.vue'

vi.mock('@/api/public', async () => {
  const actual = await vi.importActual('@/api/public')

  return {
    ...actual,
    sendAiConsultMessage: vi.fn()
  }
})

const product = {
  id: 'p-001',
  title: '鲜肉全价猫粮',
  subtitle: '低敏冷鲜配方',
  suitable: '适合 1-8 岁成猫 / 全品种',
  cover: '/images/products/cat-food.svg',
  price: 268,
  memberPrice: 248
}

async function mountAiConsult(path = '/ai-consult') {
  const pinia = createPinia()
  setActivePinia(pinia)

  const catalogStore = useCatalogStore()
  catalogStore.fetchProductDetail = vi.fn(async (id) => {
    if (id === product.id) {
      catalogStore.currentProduct = product
    }
  })
  catalogStore.$patch({
    currentProduct: null,
    loading: {
      ...catalogStore.loading,
      productDetail: false
    },
    error: {
      ...catalogStore.error,
      productDetail: ''
    }
  })

  const router = createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/ai-consult', name: 'ai-consult', component: AiConsultView },
      { path: '/product/:id', name: 'product-detail', component: { template: '<div />' } }
    ]
  })

  router.push(path)
  await router.isReady()

  const wrapper = mount(AiConsultView, {
    attachTo: document.body,
    global: {
      plugins: [router, pinia]
    }
  })

  await flushPromises()
  await wrapper.vm.$nextTick()
  return { wrapper, catalogStore }
}

describe('AiConsultView', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    window.localStorage.clear()
    sendAiConsultMessage.mockReset()
    sendAiConsultMessage.mockResolvedValue({
      reply: '真实模型回复：建议先确认年龄、体重和预算。',
      recommendations: [
        {
          id: 'p-001',
          title: '鲜肉全价猫粮',
          subtitle: '低敏冷鲜配方',
          cover: '/images/products/cat-food.svg',
          memberPrice: 248,
          price: 268,
          tagline: '最推荐'
        }
      ],
      model: 'deepseek-test-model'
    })
  })

  it('renders generic pre-sales questions without product context', async () => {
    const { wrapper, catalogStore } = await mountAiConsult()

    expect(catalogStore.fetchProductDetail).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('AI 售前咨询')
    expect(wrapper.text()).toContain('给猫咪选主粮')
    expect(wrapper.find('[data-test="consult-product-card"]').exists()).toBe(false)
  })

  it('loads and renders product context when productId is present', async () => {
    const { wrapper, catalogStore } = await mountAiConsult('/ai-consult?productId=p-001')

    expect(catalogStore.fetchProductDetail).toHaveBeenCalledWith('p-001')
    expect(wrapper.get('[data-test="consult-product-card"]').text()).toContain('鲜肉全价猫粮')
    expect(wrapper.text()).toContain('适合我家宠物吗')
  })

  it('adds assistant replies with compact recommendation cards', async () => {
    const { wrapper } = await mountAiConsult('/ai-consult?productId=p-001')

    await wrapper.get('[data-test="quick-question-0"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('适合我家宠物吗')
    expect(wrapper.text()).toContain('真实模型回复：建议先确认年龄、体重和预算。')
    expect(wrapper.get('[data-test="consult-recommendation-card"]').text()).toContain('鲜肉全价猫粮')
    expect(wrapper.get('[data-test="consult-recommendation-card"]').text()).toContain('¥248')
    expect(sendAiConsultMessage).toHaveBeenCalledWith({
      message: '适合我家宠物吗',
      messages: [{ role: 'user', content: '适合我家宠物吗' }],
      productId: 'p-001'
    })
  })

  it('sends typed messages and ignores empty input', async () => {
    const { wrapper } = await mountAiConsult()

    await wrapper.get('[data-test="consult-input"]').setValue('预算 200 怎么选')
    await wrapper.get('[data-test="consult-send"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('预算 200 怎么选')
    expect(wrapper.text()).toContain('真实模型回复：建议先确认年龄、体重和预算。')

    const messageCount = wrapper.findAll('.consult__message').length
    await wrapper.get('[data-test="consult-send"]').trigger('click')

    expect(wrapper.findAll('.consult__message')).toHaveLength(messageCount)
  })

  it('opens product detail when a recommendation card is clicked', async () => {
    const { wrapper } = await mountAiConsult()

    await wrapper.get('[data-test="consult-input"]').setValue('有什么猫粮推荐')
    await wrapper.get('[data-test="consult-send"]').trigger('click')
    await flushPromises()

    await wrapper.get('[data-test="consult-recommendation-card"]').trigger('click')
    await flushPromises()

    expect(wrapper.vm.$router.currentRoute.value.path).toBe('/product/p-001')
  })

  it('restores persisted messages and recommendation cards for the current product context', async () => {
    window.localStorage.setItem('petlifeAiConsult:product:p-001', JSON.stringify({
      version: 1,
      productId: 'p-001',
      messages: [
        { id: 'user-saved', role: 'user', content: '保存的问题', recommendations: [] },
        {
          id: 'ai-saved',
          role: 'assistant',
          content: '保存的回复',
          recommendations: [
            {
              id: 'p-001',
              title: '鲜肉全价猫粮',
              cover: '/images/products/cat-food.svg',
              memberPrice: 248,
              price: 268,
              tagline: '最推荐'
            }
          ]
        }
      ]
    }))

    const { wrapper } = await mountAiConsult('/ai-consult?productId=p-001')

    expect(wrapper.text()).toContain('保存的问题')
    expect(wrapper.text()).toContain('保存的回复')
    expect(wrapper.get('[data-test="consult-recommendation-card"]').text()).toContain('鲜肉全价猫粮')
  })

  it('resets chat messages while preserving product context', async () => {
    const { wrapper, catalogStore } = await mountAiConsult('/ai-consult?productId=p-001')

    await wrapper.get('[data-test="consult-input"]').setValue('预算 200 怎么选')
    await wrapper.get('[data-test="consult-send"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('预算 200 怎么选')

    await wrapper.get('[data-test="consult-reset"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).not.toContain('预算 200 怎么选')
    expect(wrapper.get('[data-test="consult-product-card"]').text()).toContain('鲜肉全价猫粮')
    expect(catalogStore.fetchProductDetail).toHaveBeenCalledWith('p-001')
    expect(window.localStorage.getItem('petlifeAiConsult:product:p-001')).toBeNull()
  })

  it('shows a readable fallback when the backend AI request fails', async () => {
    sendAiConsultMessage.mockRejectedValueOnce(new Error('AI service request failed'))
    const { wrapper } = await mountAiConsult()

    await wrapper.get('[data-test="consult-input"]').setValue('怎么选')
    await wrapper.get('[data-test="consult-send"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('AI 服务暂时不可用，请稍后再试')
  })
})
