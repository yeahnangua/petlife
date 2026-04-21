<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EmptyState from '@/components/EmptyState.vue'
import ImageUploadField from '@/components/ImageUploadField.vue'
import { useProfileStore } from '@/stores/profile'

const route = useRoute()
const router = useRouter()
const profileStore = useProfileStore()

const loading = ref(false)
const error = ref('')
const form = reactive({
  nickname: '',
  phone: '',
  avatar: ''
})

const profile = computed(() => profileStore.profile)
const returnTarget = computed(() => {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/profile'
})
const submitDisabled = computed(() => {
  return (
    profileStore.saving ||
    !form.nickname.trim() ||
    !form.avatar.trim() ||
    !/^1\d{10}$/.test(form.phone.trim())
  )
})

function hydrateForm(value) {
  form.nickname = value?.nickname || ''
  form.phone = value?.phone || ''
  form.avatar = value?.avatar || ''
}

function goBack() {
  router.replace(returnTarget.value)
}

async function loadProfile() {
  loading.value = true
  error.value = ''

  if (profileStore.profile) {
    hydrateForm(profileStore.profile)
  }

  await profileStore.fetchProfile()

  if (!profileStore.profile) {
    error.value = profileStore.error || '个人资料加载失败'
    loading.value = false
    return
  }

  hydrateForm(profileStore.profile)
  loading.value = false
}

async function submitForm() {
  error.value = ''

  if (!form.nickname.trim()) {
    error.value = '请输入昵称'
    return
  }

  if (!/^1\d{10}$/.test(form.phone.trim())) {
    error.value = '请输入 11 位手机号'
    return
  }

  if (!form.avatar.trim()) {
    error.value = '请先上传头像'
    return
  }

  try {
    await profileStore.updateProfile(form)
    router.replace(returnTarget.value)
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : '个人资料保存失败'
  }
}

onMounted(() => {
  loadProfile()
})
</script>

<template>
  <div class="profile-edit page-pad page-stack">
    <section class="surface-card profile-edit__card">
      <div class="section-heading">
        <div>
          <p class="section-heading__meta">个人资料</p>
          <h2 class="section-heading__title">编辑资料</h2>
        </div>
      </div>

      <div v-if="loading" class="profile-edit__state">正在加载资料...</div>

      <EmptyState
        v-else-if="error && !profile"
        title="个人资料加载失败"
        :description="error"
        action-label="重试"
        @action="loadProfile()"
      />

      <template v-else>
        <ImageUploadField
          v-model="form.avatar"
          label="头像"
          hint="支持 JPG / PNG，上传后会直接写入个人资料。"
        />

        <label class="profile-edit__field">
          <span>昵称</span>
          <input v-model="form.nickname" maxlength="20" placeholder="例如 拾柒" />
        </label>

        <label class="profile-edit__field">
          <span>手机号</span>
          <input
            v-model="form.phone"
            inputmode="numeric"
            maxlength="11"
            placeholder="例如 13527882788"
            @input="form.phone = form.phone.replace(/\D/g, '').slice(0, 11)"
          />
        </label>

        <div v-if="profile" class="profile-edit__readonly">
          <div class="profile-edit__readonly-copy">
            <p class="section-heading__meta">会员信息</p>
            <h3>以下字段保持只读</h3>
          </div>
          <div class="profile-edit__readonly-row">
            <span>会员等级</span>
            <strong>{{ profile.level }}</strong>
          </div>
          <div class="profile-edit__readonly-row">
            <span>当前积分</span>
            <strong>{{ profile.points }}</strong>
          </div>
          <div class="profile-edit__readonly-row">
            <span>入会时间</span>
            <strong>{{ profile.joinDate }}</strong>
          </div>
        </div>

        <p v-if="error" class="profile-edit__error">{{ error }}</p>

        <div class="profile-edit__actions">
          <button type="button" class="button-secondary" @click="goBack">取消</button>
          <button
            type="button"
            class="button-primary"
            :disabled="submitDisabled"
            @click="submitForm"
          >
            {{ profileStore.saving ? '保存中...' : '保存资料' }}
          </button>
        </div>
      </template>
    </section>
  </div>
</template>

<style scoped>
.profile-edit {
  padding-bottom: var(--space-6);
}

.profile-edit__card {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4);
}

.profile-edit__field {
  display: grid;
  gap: var(--space-2);
}

.profile-edit__field input {
  width: 100%;
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  background: var(--color-surface-soft);
}

.profile-edit__readonly {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-xl);
  background: var(--color-surface-soft);
}

.profile-edit__readonly-copy {
  display: grid;
  gap: 4px;
}

.profile-edit__readonly-copy h3 {
  font-size: var(--text-base);
}

.profile-edit__readonly-row,
.profile-edit__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.profile-edit__readonly-row span,
.profile-edit__state {
  color: var(--color-text-soft);
}

.profile-edit__state,
.profile-edit__error {
  text-align: center;
}

.profile-edit__error {
  color: var(--color-coral);
}
</style>
