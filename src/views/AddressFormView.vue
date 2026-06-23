<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FormField from '@/components/FormField.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
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
const canSubmit = computed(() => Boolean(form.name && form.phone && form.region && form.detail))

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
  <div class="aform page-pad">
    <div v-if="loading" class="aform__stack">
      <SkeletonBlock variant="text" :lines="5" />
    </div>

    <template v-else>
      <section class="aform__card surface-card">
        <FormField label="收货人" required>
          <input v-model="form.name" placeholder="例如 拾柒" />
        </FormField>

        <FormField label="联系电话" required>
          <input v-model="form.phone" type="tel" placeholder="例如 13527882788" />
        </FormField>

        <FormField label="所在地区" required>
          <input v-model="form.region" placeholder="例如 上海市 静安区 南京西路街道" />
        </FormField>

        <FormField label="详细地址" required>
          <textarea v-model="form.detail" rows="3" placeholder="例如 梅园里小区 12 号 3B 室" />
        </FormField>

        <FormField label="地址标签" hint="方便区分，比如 家 / 公司">
          <input v-model="form.tag" placeholder="例如 家" />
        </FormField>

        <button
          type="button"
          class="aform__default"
          :class="{ 'aform__default--on': form.isDefault }"
          @click="form.isDefault = !form.isDefault"
        >
          <span class="aform__default-info">
            <strong>设为默认地址</strong>
            <small>下单时优先使用这个地址</small>
          </span>
          <span class="aform__switch" :class="{ 'aform__switch--on': form.isDefault }">
            <i class="aform__switch-knob" />
          </span>
        </button>

        <p v-if="error" class="aform__error">{{ error }}</p>
      </section>

      <div class="aform__actions">
        <button type="button" class="button-secondary aform__cancel" @click="router.back()">取消</button>
        <button
          type="button"
          class="button-primary aform__save"
          :disabled="saving || !canSubmit"
          @click="submitForm"
        >
          {{ saving ? '保存中…' : '保存地址' }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.aform {
  display: grid;
  gap: var(--space-4);
  padding-top: var(--space-2);
  padding-bottom: var(--space-6);
  align-content: start;
}

.aform__stack {
  padding-top: var(--space-4);
}

.aform__card {
  display: grid;
  gap: var(--space-5);
  padding: var(--space-5);
  border-radius: var(--radius-xl);
}

.aform__default {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-soft);
  text-align: left;
  transition: border-color var(--dur-base) var(--ease-out);
}

.aform__default--on {
  border-color: var(--color-primary-soft);
  background: var(--color-primary-tint);
}

.aform__default-info {
  display: grid;
  gap: 2px;
}

.aform__default-info strong {
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
}

.aform__default-info small {
  color: var(--color-text-mute);
  font-size: var(--text-xs);
}

.aform__switch {
  position: relative;
  width: 44px;
  height: 26px;
  flex-shrink: 0;
  border-radius: var(--radius-full);
  background: var(--color-border);
  transition: background-color var(--dur-base) var(--ease-out);
}

.aform__switch--on {
  background: var(--color-primary-deep);
}

.aform__switch-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-full);
  background: #fff;
  box-shadow: var(--shadow-sm);
  transition: transform var(--dur-base) var(--ease-spring);
}

.aform__switch--on .aform__switch-knob {
  transform: translateX(18px);
}

.aform__error {
  color: var(--color-danger);
  font-size: var(--text-sm);
}

.aform__actions {
  display: grid;
  grid-template-columns: 1fr 1.6fr;
  gap: var(--space-3);
}
</style>
