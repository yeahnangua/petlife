<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import IconSvg from '@/components/IconSvg.vue'
import { getWechatOAuthStartUrl } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const error = ref('')
const qrPreviewOpen = ref(false)

const redirectPath = computed(() => {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/'
})

async function submitWechatLogin() {
  error.value = ''

  if (import.meta.env.VITE_WECHAT_OAUTH_ENABLED === 'true') {
    window.location.href = getWechatOAuthStartUrl(redirectPath.value)
    return
  }

  try {
    await authStore.loginWithWechat()
    router.replace(redirectPath.value)
  } catch (loginError) {
    error.value = loginError instanceof Error ? loginError.message : '登录失败，请稍后重试'
  }
}

async function submitDemoWechatLogin() {
  error.value = ''

  try {
    await authStore.loginWithWechat()
    router.replace(redirectPath.value)
  } catch (loginError) {
    error.value = loginError instanceof Error ? loginError.message : '登录失败，请稍后重试'
  }
}

onMounted(async () => {
  const token = route.query.wechat_token

  if (typeof token !== 'string' || !token) {
    return
  }

  error.value = ''

  try {
    await authStore.consumeWechatOAuthToken(token)
    router.replace(redirectPath.value)
  } catch (loginError) {
    error.value = loginError instanceof Error ? loginError.message : '微信登录失败，请稍后重试'
  }
})
</script>

<template>
  <main class="login page-pad">
    <section class="login__panel">
      <p class="login__eyebrow">PetLife</p>
      <h1 class="login__title font-display">微信登录</h1>
      <p class="login__copy">使用微信身份进入 PetLife，订单、宠物档案与优惠券会跟随当前账号。</p>

      <section class="login__official-account" aria-label="测试公众号二维码">
        <button
          type="button"
          class="login__qr-button"
          aria-label="放大测试公众号二维码"
          @click="qrPreviewOpen = true"
        >
          <img
            src="/images/wechat-test-official-account.png"
            alt="测试公众号二维码"
            class="login__qr"
            data-test="wechat-official-account-qr"
          />
        </button>
        <p>关注测试公众号后使用微信一键登录</p>
      </section>

      <div class="login__actions">
        <button
          type="button"
          class="login__wechat"
          :disabled="authStore.loading"
          data-test="wechat-login"
          @click="submitWechatLogin"
        >
          <IconSvg name="profile" :size="19" :stroke="2" />
          {{ authStore.loading ? '登录中' : '微信一键登录' }}
        </button>

        <button
          type="button"
          class="login__wechat login__wechat--test"
          :disabled="authStore.loading"
          data-test="wechat-demo-login"
          @click="submitDemoWechatLogin"
        >
          <IconSvg name="profile" :size="19" :stroke="2" />
          {{ authStore.loading ? '登录中' : '微信登录（测试）' }}
        </button>
      </div>

      <p v-if="error" class="login__error">{{ error }}</p>
    </section>

    <button
      v-if="qrPreviewOpen"
      type="button"
      class="login__qr-preview"
      aria-label="关闭二维码预览"
      data-test="wechat-qr-preview"
      @click="qrPreviewOpen = false"
    >
      <img
        src="/images/wechat-test-official-account.png"
        alt="测试公众号二维码"
        class="login__qr-preview-image"
        data-test="wechat-qr-preview-image"
      />
    </button>
  </main>
</template>

<style scoped>
.login {
  min-height: 100dvh;
  display: grid;
  align-items: center;
  padding-top: var(--space-12);
  padding-bottom: var(--space-12);
}

.login__panel {
  display: grid;
  gap: var(--space-5);
}

.login__eyebrow {
  color: var(--color-primary);
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
}

.login__title {
  font-size: var(--text-4xl);
  line-height: var(--leading-tight);
}

.login__copy {
  max-width: 320px;
  color: var(--color-text-soft);
  font-size: var(--text-body);
  line-height: var(--leading-relaxed);
}

.login__official-account {
  justify-self: center;
  display: grid;
  justify-items: center;
  gap: var(--space-2);
  width: min(100%, 260px);
  padding: var(--space-3);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
}

.login__qr {
  width: 188px;
  max-width: 100%;
  height: auto;
  display: block;
  border-radius: var(--radius-md);
}

.login__qr-button {
  display: block;
  border-radius: var(--radius-md);
}

.login__qr-button:focus-visible {
  outline: 3px solid rgba(26, 173, 25, 0.28);
  outline-offset: 3px;
}

.login__official-account p {
  color: var(--color-text-soft);
  font-size: var(--text-xs);
  line-height: var(--leading-normal);
  text-align: center;
}

.login__actions {
  display: grid;
  gap: var(--space-3);
}

.login__wechat {
  width: 100%;
  min-height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border-radius: var(--radius-full);
  background: #1AAD19;
  color: #fff;
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
  box-shadow: 0 10px 24px rgba(26, 173, 25, 0.20);
  transition: transform var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out);
}

.login__wechat--test {
  border: 1px solid rgba(26, 173, 25, 0.24);
  background: #fff;
  color: #168A16;
  box-shadow: 0 8px 20px rgba(26, 173, 25, 0.12);
}

.login__wechat:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px rgba(26, 173, 25, 0.24);
}

.login__wechat--test:hover {
  box-shadow: 0 10px 24px rgba(26, 173, 25, 0.18);
}

.login__wechat:disabled {
  cursor: wait;
  opacity: 0.72;
  transform: none;
}

.login__error {
  color: var(--color-danger);
  font-size: var(--text-sm);
}

.login__qr-preview {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: grid;
  place-items: center;
  padding: var(--space-8);
  background: rgba(35, 33, 28, 0.78);
}

.login__qr-preview-image {
  width: min(82vw, 360px);
  height: auto;
  border-radius: var(--radius-lg);
  background: #fff;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.32);
}
</style>
