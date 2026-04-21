<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session'

const route = useRoute()
const router = useRouter()
const sessionStore = useSessionStore()
const adminKey = ref('')
const canSubmit = computed(() => adminKey.value.trim().length > 0)

function submitLogin() {
  const savedKey = sessionStore.login(adminKey.value)

  if (!savedKey) {
    return
  }

  const redirectPath = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
  router.replace(redirectPath)
}
</script>

<template>
  <main class="login-view">
    <form class="login-view__card" @submit.prevent="submitLogin">
      <p class="login-view__eyebrow">PetLife Admin</p>
      <h1>管理员登录</h1>
      <p class="login-view__copy">输入本地演示环境的 `x-admin-key` 后进入后台。</p>
      <label class="login-view__field">
        <span>Admin Key</span>
        <input v-model="adminKey" type="password" placeholder="请输入 x-admin-key" />
      </label>
      <button type="submit" :disabled="!canSubmit">进入后台</button>
    </form>
  </main>
</template>

<style scoped>
.login-view {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px;
  background: linear-gradient(180deg, #f1eee7 0%, #f8f4ee 100%);
}

.login-view__card {
  width: min(100%, 420px);
  display: grid;
  gap: 16px;
  padding: 32px;
  border-radius: 24px;
  background: #fffdfa;
}

.login-view__eyebrow {
  color: #866549;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.login-view__field {
  display: grid;
  gap: 8px;
}

.login-view__copy {
  color: #7a6958;
  line-height: 1.6;
}

.login-view__field input {
  width: 100%;
  min-height: 44px;
  padding: 0 14px;
  border-radius: 14px;
  border: 1px solid #d9ccbe;
}

button {
  min-height: 44px;
  border: 0;
  border-radius: 14px;
  background: #866549;
  color: #fff;
}

button:disabled {
  opacity: 0.5;
}
</style>
