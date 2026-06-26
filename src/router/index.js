import { createRouter, createWebHashHistory } from 'vue-router'
import { registerUnauthorizedHandler } from '@/api/mobileSession'
import { useAuthStore } from '@/stores/auth'

/**
 * 路由结构
 * 后续 Codex 可在 meta 上追加权限/埋点/过渡方向等字段。
 */
export const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: '登录', public: true, hideShell: true }
  },
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { tab: 'home', title: '首页' }
  },
  {
    path: '/category',
    name: 'category',
    component: () => import('@/views/CategoryView.vue'),
    meta: { tab: 'category', title: '分类' }
  },
  {
    path: '/search',
    name: 'search',
    component: () => import('@/views/SearchView.vue'),
    meta: { title: '拍照搜商品' }
  },
  {
    path: '/products',
    name: 'product-list',
    component: () => import('@/views/ProductListView.vue'),
    meta: { title: '商品列表' }
  },
  {
    path: '/product/:id',
    name: 'product-detail',
    component: () => import('@/views/ProductDetailView.vue'),
    meta: { title: '商品详情' }
  },
  {
    path: '/ai-consult',
    name: 'ai-consult',
    component: () => import('@/views/AiConsultView.vue'),
    meta: { title: 'AI客服' }
  },
  {
    path: '/service',
    name: 'service',
    component: () => import('@/views/ServiceView.vue'),
    meta: { tab: 'service', title: '服务' }
  },
  {
    path: '/service/:id',
    name: 'service-detail',
    component: () => import('@/views/ServiceDetailView.vue'),
    meta: { title: '服务详情' }
  },
  {
    path: '/cart',
    name: 'cart',
    component: () => import('@/views/CartView.vue'),
    meta: { title: '购物车' }
  },
  {
    path: '/order/confirm',
    name: 'order-confirm',
    component: () => import('@/views/OrderConfirmView.vue'),
    meta: { title: '确认订单' }
  },
  {
    path: '/addresses',
    name: 'address-list',
    component: () => import('@/views/AddressListView.vue'),
    meta: { title: '地址管理' }
  },
  {
    path: '/addresses/new',
    name: 'address-new',
    component: () => import('@/views/AddressFormView.vue'),
    meta: { title: '新增地址' }
  },
  {
    path: '/addresses/:id/edit',
    name: 'address-edit',
    component: () => import('@/views/AddressFormView.vue'),
    meta: { title: '编辑地址' }
  },
  {
    path: '/booking/confirm',
    name: 'booking-confirm',
    component: () => import('@/views/BookingConfirmView.vue'),
    meta: { title: '预约确认' }
  },
  {
    path: '/bookings/:id',
    name: 'booking-detail',
    component: () => import('@/views/BookingDetailView.vue'),
    meta: { title: '预约详情' }
  },
  {
    path: '/orders',
    name: 'orders',
    component: () => import('@/views/OrderListView.vue'),
    meta: { tab: 'orders', title: '订单' }
  },
  {
    path: '/orders/:id',
    name: 'order-detail',
    component: () => import('@/views/OrderDetailView.vue'),
    meta: { title: '订单详情' }
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { tab: 'profile', title: '我的' }
  },
  {
    path: '/profile/edit',
    name: 'profile-edit',
    component: () => import('@/views/ProfileEditView.vue'),
    meta: { title: '编辑资料' }
  },
  {
    path: '/pets',
    name: 'pet-profile',
    component: () => import('@/views/PetProfileView.vue'),
    meta: { title: '宠物档案' }
  },
  {
    path: '/member',
    name: 'member',
    component: () => import('@/views/MemberView.vue'),
    meta: { title: '会员权益' }
  },
  {
    path: '/coupons',
    name: 'coupons',
    component: () => import('@/views/CouponListView.vue'),
    meta: { title: '我的优惠券' }
  }
]

export function createMobileRouter(pinia, routeDefinitions = routes) {
  const router = createRouter({
    history: createWebHashHistory(),
    routes: routeDefinitions,
    scrollBehavior() {
      return { top: 0 }
    }
  })

  registerUnauthorizedHandler(() => {
    const authStore = useAuthStore(pinia)
    authStore.clearSession()

    if (router.currentRoute.value.path !== '/login') {
      router.replace({
        path: '/login',
        query: { redirect: router.currentRoute.value.fullPath || '/' }
      })
    }
  })

  router.beforeEach(async (to) => {
    const authStore = useAuthStore(pinia)

    if (to.meta.public) {
      if (authStore.isAuthenticated && to.path === '/login') {
        return { path: '/' }
      }

      return true
    }

    const authenticated = await authStore.ensureSession()

    if (!authenticated) {
      return {
        path: '/login',
        query: { redirect: to.fullPath }
      }
    }

    return true
  })

  return router
}

const router = createMobileRouter()

export default router
