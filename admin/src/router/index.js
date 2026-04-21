import { createRouter, createWebHashHistory } from 'vue-router'
import AdminLayout from '@/layouts/AdminLayout.vue'
import { useSessionStore } from '@/stores/session'
import LoginView from '@/views/LoginView.vue'

const DashboardPlaceholder = {
  template: '<section class="admin-placeholder">后台概览建设中</section>'
}

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
            component: DashboardPlaceholder,
            meta: { title: '后台概览' }
          }
        ]
      }
    ]
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
