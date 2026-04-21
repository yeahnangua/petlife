<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createAddress, getAddresses, updateAddress } from '@/api/user'
import { adaptAddress } from '@/adapters/profile'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const saving = ref(false)
const error = ref('')

const form = reactive({
  name: '',
  phone: '',
  region: '',
  detail: '',
  tag: '',
  isDefault: false
})

const isEdit = computed(() => Boolean(route.params.id))

function hydrateForm(address) {
  form.name = address.name || ''
  form.phone = address.phone || ''
  form.region = address.region || ''
  form.detail = address.detail || ''
  form.tag = address.tag || ''
  form.isDefault = Boolean(address.isDefault)
}

async function loadAddress() {
  if (!isEdit.value) {
    return
  }

  loading.value = true
  error.value = ''

  try {
    const data = await getAddresses()
    const address = (data.list || []).map(adaptAddress).find((item) => item.id === route.params.id)

    if (!address) {
      error.value = '地址不存在或已被删除'
      return
    }

    hydrateForm(address)
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : '地址加载失败'
  } finally {
    loading.value = false
  }
}

async function submitForm() {
  saving.value = true
  error.value = ''

  const payload = {
    receiver_name: form.name.trim(),
    receiver_phone: form.phone.trim(),
    region: form.region.trim(),
    detail_address: form.detail.trim(),
    tag: form.tag.trim(),
    is_default: form.isDefault
  }

  try {
    if (isEdit.value) {
      await updateAddress(route.params.id, payload)
    } else {
      await createAddress(payload)
    }

    router.replace('/addresses')
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : '地址保存失败'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadAddress()
})
</script>

<template>
  <div class="address-form page-pad page-stack">
    <section class="surface-card address-form__card">
      <div class="section-heading">
        <div>
          <p class="section-heading__meta">地址信息</p>
          <h2 class="section-heading__title">{{ isEdit ? '编辑地址' : '新增地址' }}</h2>
        </div>
      </div>

      <div v-if="loading" class="address-form__state">正在加载地址...</div>

      <template v-else>
        <label class="address-form__field">
          <span>收货人</span>
          <input v-model="form.name" placeholder="例如 拾柒" />
        </label>

        <label class="address-form__field">
          <span>联系电话</span>
          <input v-model="form.phone" placeholder="例如 13527882788" />
        </label>

        <label class="address-form__field">
          <span>所在地区</span>
          <input v-model="form.region" placeholder="例如 上海市 静安区 南京西路街道" />
        </label>

        <label class="address-form__field">
          <span>详细地址</span>
          <textarea v-model="form.detail" rows="3" placeholder="例如 梅园里小区 12 号 3B 室" />
        </label>

        <label class="address-form__field">
          <span>地址标签</span>
          <input v-model="form.tag" placeholder="例如 家 / 公司" />
        </label>

        <label class="address-form__checkbox">
          <input v-model="form.isDefault" type="checkbox" />
          <span>设为默认地址</span>
        </label>

        <p v-if="error" class="address-form__error">{{ error }}</p>

        <div class="address-form__actions">
          <button type="button" class="button-secondary" @click="router.back()">取消</button>
          <button
            type="button"
            class="button-primary"
            :disabled="saving || !form.name || !form.phone || !form.region || !form.detail"
            @click="submitForm"
          >
            {{ saving ? '保存中...' : '保存地址' }}
          </button>
        </div>
      </template>
    </section>
  </div>
</template>

<style scoped>
.address-form {
  padding-bottom: var(--space-6);
}

.address-form__card {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4);
}

.address-form__field {
  display: grid;
  gap: var(--space-2);
}

.address-form__field input,
.address-form__field textarea {
  width: 100%;
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  background: var(--color-surface-soft);
}

.address-form__checkbox,
.address-form__actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.address-form__actions {
  justify-content: space-between;
}

.address-form__state,
.address-form__error {
  color: var(--color-text-soft);
}

.address-form__error {
  color: var(--color-coral);
}
</style>
