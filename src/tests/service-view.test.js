import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCatalogStore } from '@/stores/catalog'
import { useProfileStore } from '@/stores/profile'
import ServiceView from '@/views/ServiceView.vue'

const services = [
  {
    id: 's-001',
    title: '基础洗护',
    tagline: '门店基础洁净护理',
    category: 'bath',
    cover: '/images/services/bath.svg',
    petType: 'cat',
    duration: 60,
    rating: 4.8,
    memberPrice: 108,
    originalPrice: 128
  }
]

async function mountServiceView({ loadingServices = false, serviceList = services } = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)

  const catalogStore = useCatalogStore()
  catalogStore.$patch({
    serviceList,
    loading: {
      ...catalogStore.loading,
      services: loadingServices
    },
    error: {
      ...catalogStore.error,
      services: ''
    }
  })
  catalogStore.fetchServiceList = vi.fn()

  const profileStore = useProfileStore()
  profileStore.setPetType('cat')

  const router = createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/service', name: 'service', component: ServiceView },
      { path: '/service/:id', name: 'service-detail', component: { template: '<div />' } }
    ]
  })

  router.push('/service?pet=cat')
  await router.isReady()

  const wrapper = mount(ServiceView, {
    attachTo: document.body,
    global: {
      plugins: [router, pinia],
      stubs: {
        ServiceCard: {
          props: ['service'],
          template: '<article class="service-row">{{ service.title }}</article>'
        },
        SkeletonBlock: {
          template: '<div class="skeleton-block" />'
        }
      }
    }
  })

  await wrapper.vm.$nextTick()
  return { wrapper, catalogStore }
}

describe('ServiceView', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('keeps service cards visible while a category refresh is loading', async () => {
    const { wrapper } = await mountServiceView({ loadingServices: true })

    expect(wrapper.find('.service-row').exists()).toBe(true)
    expect(wrapper.text()).toContain('基础洗护')
    expect(wrapper.find('.skeleton-block').exists()).toBe(false)

    wrapper.unmount()
  })

  it('renders service categories as a draggable horizontal scroller', async () => {
    const { wrapper } = await mountServiceView()
    const scroller = wrapper.find('.service__categories')
    const element = scroller.element

    expect(scroller.attributes('data-draggable-scroll')).toBe('true')
    expect(scroller.attributes('aria-label')).toBe('服务分类')

    element.scrollLeft = 12
    await scroller.trigger('pointerdown', { clientX: 100, pointerId: 1 })
    expect(scroller.classes()).toContain('service__categories--dragging')

    await scroller.trigger('pointermove', { clientX: 60, pointerId: 1 })
    expect(element.scrollLeft).toBe(52)

    await scroller.trigger('pointerup', { pointerId: 1 })
    expect(scroller.classes()).not.toContain('service__categories--dragging')

    wrapper.unmount()
  })
})
