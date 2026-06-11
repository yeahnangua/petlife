<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EmptyState from '@/components/EmptyState.vue'
import FormField from '@/components/FormField.vue'
import ImageUploadField from '@/components/ImageUploadField.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
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
  <div class="pedit page-pad">
    <div v-if="loading" class="pedit__stack">
      <SkeletonBlock variant="avatar" />
      <SkeletonBlock variant="text" :lines="3" />
    </div>

    <EmptyState
      v-else-if="error && !profile"
      title="个人资料加载失败"
      :description="error"
      action-label="重试"
      @action="loadProfile()"
    />

    <template v-else>
      <section class="pedit__card surface-card">
        <div class="pedit__avatar-row">
          <ImageUploadField v-model="form.avatar" label="头像" hint="JPG / PNG" />
        </div>

        <FormField label="昵称" required>
          <input v-model="form.nickname" placeholder="想被怎么称呼？" />
        </FormField>

        <FormField label="手机号" required hint="11 位手机号，用于门店联系">
          <input v-model="form.phone" type="tel" placeholder="例如 13527882788" />
        </FormField>

        <p v-if="error" class="pedit__error">{{ error }}</p>
      </section>

      <div class="pedit__actions">
        <button type="button" class="button-secondary" @click="goBack">取消</button>
        <button
          type="button"
          class="button-primary"
          :disabled="submitDisabled"
          @click="submitForm"
        >
          {{ profileStore.saving ? '保存中…' : '保存资料' }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.pedit {
  display: grid;
  gap: var(--space-4);
  padding-top: var(--space-2);
  padding-bottom: var(--space-6);
  align-content: start;
}

.pedit__stack {
  display: grid;
  gap: var(--space-4);
  padding-top: var(--space-4);
}

.pedit__card {
  display: grid;
  gap: var(--space-5);
  padding: var(--space-5);
  border-radius: var(--radius-xl);
}

.pedit__avatar-row {
  display: grid;
  justify-items: start;
}

.pedit__error {
  color: var(--color-danger);
  font-size: var(--text-sm);
}

.pedit__actions {
  display: grid;
  grid-template-columns: 1fr 1.6fr;
  gap: var(--space-3);
}
</style>
