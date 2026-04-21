import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { createRouter, createWebHashHistory } from 'vue-router'
import { services } from '@/mocks'
import { useBookingStore } from '@/stores/booking'
import BookingConfirmView from '@/views/BookingConfirmView.vue'
import OrderConfirmView from '@/views/OrderConfirmView.vue'

function createTestRouter(component) {
  const router = createRouter({
    history: createWebHashHistory(),
    routes: [{ path: '/', component }]
  })

  router.push('/')
  return router
}

describe('bottom submit bar layout', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('anchors shared submit bars to the shell bottom offset variable', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/base.css'), 'utf8')

    expect(css).toContain('.page-with-submit-bar')
    expect(css).toContain('.page-submit-bar')
    expect(css).toContain('padding-bottom: calc(var(--shell-bottom-offset) + var(--action-bar-height) + var(--space-8));')
    expect(css).toContain('position: sticky;')
    expect(css).toContain('bottom: calc(var(--shell-bottom-offset) + var(--space-4));')
  })

  it('anchors detail action bars to the shell bottom offset variable', () => {
    const productDetail = readFileSync(resolve(process.cwd(), 'src/views/ProductDetailView.vue'), 'utf8')
    const serviceDetail = readFileSync(resolve(process.cwd(), 'src/views/ServiceDetailView.vue'), 'utf8')

    expect(productDetail).toContain('padding-bottom: calc(var(--shell-bottom-offset) + var(--action-bar-height) + var(--space-8));')
    expect(productDetail).toContain('bottom: calc(var(--shell-bottom-offset) + var(--space-4));')
    expect(serviceDetail).toContain('padding-bottom: calc(var(--shell-bottom-offset) + var(--action-bar-height) + var(--space-8));')
    expect(serviceDetail).toContain('bottom: calc(var(--shell-bottom-offset) + var(--space-4));')
  })

  it('uses the shared submit bar layout on the order confirmation page', async () => {
    const router = createTestRouter(OrderConfirmView)
    await router.isReady()

    const wrapper = mount(OrderConfirmView, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.find('.order-confirm').classes()).toContain('page-with-submit-bar')
    expect(wrapper.find('.order-confirm__submit').classes()).toContain('page-submit-bar')
  })

  it('uses the shared submit bar layout on the booking confirmation page', async () => {
    const bookingStore = useBookingStore()
    bookingStore.prepareFromService(services[0])

    const router = createTestRouter(BookingConfirmView)
    await router.isReady()

    const wrapper = mount(BookingConfirmView, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.find('.booking').classes()).toContain('page-with-submit-bar')
    expect(wrapper.find('.booking__submit').classes()).toContain('page-submit-bar')
  })
})
