<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session'

const route = useRoute()
const router = useRouter()
const sessionStore = useSessionStore()
const pageTitle = computed(() => route.meta.title || '后台管理')

function logout() {
  sessionStore.logout()
  router.replace('/login')
}
</script>

<template>
  <div class="admin-layout">
    <header class="admin-layout__header">
      <div>
        <p class="admin-layout__eyebrow">PetLife Admin</p>
        <h1>{{ pageTitle }}</h1>
      </div>
      <button type="button" data-test="logout" @click="logout">退出登录</button>
    </header>
    <main class="admin-layout__content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.admin-layout {
  min-height: 100vh;
  padding: 24px;
  background: #f5efe7;
}

.admin-layout__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  padding: 20px 24px;
  border-radius: 24px;
  background: #fffdfa;
}

.admin-layout__eyebrow {
  color: #866549;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.admin-layout__content {
  padding: 24px;
  border-radius: 24px;
  background: #fffdfa;
}

button {
  min-height: 40px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  background: #29211b;
  color: #fff;
}
</style>
