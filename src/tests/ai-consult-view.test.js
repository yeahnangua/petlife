import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCatalogStore } from '@/stores/catalog'
import AiConsultView from '@/views/AiConsultView.vue'

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
    routes: [{ path: '/ai-consult', name: 'ai-consult', component: AiConsultView }]
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

  it('adds user messages and simulated AI replies from quick questions', async () => {
    const { wrapper } = await mountAiConsult('/ai-consult?productId=p-001')

    await wrapper.get('[data-test="quick-question-0"]').trigger('click')

    expect(wrapper.text()).toContain('适合我家宠物吗')
    expect(wrapper.text()).toContain('我先按「鲜肉全价猫粮」帮你看')
  })

  it('sends typed messages and ignores empty input', async () => {
    const { wrapper } = await mountAiConsult()

    await wrapper.get('[data-test="consult-input"]').setValue('预算 200 怎么选')
    await wrapper.get('[data-test="consult-send"]').trigger('click')

    expect(wrapper.text()).toContain('预算 200 怎么选')
    expect(wrapper.text()).toContain('可以告诉我宠物类型、年龄、预算和想解决的问题')

    const messageCount = wrapper.findAll('.consult__message').length
    await wrapper.get('[data-test="consult-send"]').trigger('click')

    expect(wrapper.findAll('.consult__message')).toHaveLength(messageCount)
  })
})
