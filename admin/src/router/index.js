import { createRouter, createWebHashHistory } from 'vue-router'
import AdminLayout from '@/layouts/AdminLayout.vue'
import { registerUnauthorizedHandler } from '@/api/auth'
import { useSessionStore } from '@/stores/session'
import DashboardView from '@/views/DashboardView.vue'
import CategoryAdminView from '@/views/CategoryAdminView.vue'
import ProductAdminView from '@/views/ProductAdminView.vue'
import ServiceAdminView from '@/views/ServiceAdminView.vue'
import StoreAdminView from '@/views/StoreAdminView.vue'
import TimeSlotAdminView from '@/views/TimeSlotAdminView.vue'
import OrderAdminView from '@/views/OrderAdminView.vue'
import BookingAdminView from '@/views/BookingAdminView.vue'
import LoginView from '@/views/LoginView.vue'

export function createAdminRouter(pinia) {
  const router = createRouter({
    history: createWebHashHistory(),
    routes: [
      {
        path: '/login',
        name: 'login',
        component: LoginView,
        meta: { title: '管理员登录' }
      },
      {
        path: '/',
        component: AdminLayout,
        children: [
          {
            path: '',
            name: 'dashboard',
            component: DashboardView,
            meta: { title: '后台概览' }
          },
          {
            path: 'categories',
            name: 'categories',
            component: CategoryAdminView,
            meta: { title: '分类' }
          },
          {
            path: 'products',
            name: 'products',
            component: ProductAdminView,
            meta: { title: '商品' }
          },
          {
            path: 'services',
            name: 'services',
            component: ServiceAdminView,
            meta: { title: '服务' }
          },
          {
            path: 'stores',
            name: 'stores',
            component: StoreAdminView,
            meta: { title: '门店' }
          },
          {
            path: 'time-slots',
            name: 'time-slots',
            component: TimeSlotAdminView,
            meta: { title: '时段' }
          },
          {
            path: 'orders',
            name: 'orders',
            component: OrderAdminView,
            meta: { title: '订单' }
          },
          {
            path: 'bookings',
            name: 'bookings',
            component: BookingAdminView,
            meta: { title: '预约' }
          }
        ]
      }
    ]
  })

  registerUnauthorizedHandler(() => {
    const sessionStore = useSessionStore(pinia)
    sessionStore.logout()
    router.replace('/login')
  })

  router.beforeEach((to) => {
    const sessionStore = useSessionStore(pinia)

    if (to.path === '/login' && sessionStore.isAuthenticated) {
      return { path: '/' }
    }

    if (to.path !== '/login' && !sessionStore.isAuthenticated) {
      return { path: '/login' }
    }

    return true
  })

  router.afterEach((to) => {
    if (typeof document !== 'undefined') {
      document.title = `${to.meta.title || '后台管理'} · PetLife Admin`
    }
  })

  return router
}
