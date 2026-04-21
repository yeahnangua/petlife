import { createRouter, createWebHashHistory } from 'vue-router'

/**
 * 路由结构
 * 后续 Codex 可在 meta 上追加权限/埋点/过渡方向等字段。
 */
const routes = [
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
    path: '/booking/confirm',
    name: 'booking-confirm',
    component: () => import('@/views/BookingConfirmView.vue'),
    meta: { title: '预约确认' }
  },
  {
    path: '/orders',
    name: 'orders',
    component: () => import('@/views/OrderListView.vue'),
    meta: { tab: 'orders', title: '订单' }
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { tab: 'profile', title: '我的' }
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
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router
