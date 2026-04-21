<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session'

const route = useRoute()
const router = useRouter()
const sessionStore = useSessionStore()

const title = computed(() => route.meta.title || '后台管理')
const subtitle = computed(() => (route.name === 'dashboard' ? '今日运营摘要' : 'PetLife 管理台'))

function logout() {
  sessionStore.logout()
  router.replace('/login')
}
</script>

<template>
  <header class="app-header">
    <div>
      <p class="app-header__meta">{{ subtitle }}</p>
      <h1>{{ title }}</h1>
    </div>
    <button type="button" data-test="logout" @click="logout">退出登录</button>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px;
  border-radius: 24px;
  background: #fffdfa;
}

.app-header__meta {
  color: #866549;
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
