<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import EmptyState from '@/components/EmptyState.vue'
import { deleteAddress, getAddresses } from '@/api/user'
import { adaptAddress } from '@/adapters/profile'

const router = useRouter()

const addresses = ref([])
const loading = ref(false)
const error = ref('')
const removingId = ref('')

async function loadAddresses() {
  loading.value = true
  error.value = ''

  try {
    const data = await getAddresses()
    addresses.value = (data.list || []).map(adaptAddress)
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : '地址加载失败'
  } finally {
    loading.value = false
  }
}

async function removeAddress(id) {
  removingId.value = id

  try {
    await deleteAddress(id)
    await loadAddresses()
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : '删除地址失败'
  } finally {
    removingId.value = ''
  }
}

onMounted(() => {
  loadAddresses()
})
</script>

<template>
  <div class="address-list page-pad page-stack">
    <section class="section-heading">
      <div>
        <p class="section-heading__meta">地址管理</p>
        <h2 class="section-heading__title">收货地址</h2>
      </div>
      <button type="button" class="button-secondary" @click="router.push('/addresses/new')">
        新增地址
      </button>
    </section>

    <div v-if="loading" class="surface-card address-list__state">正在加载地址...</div>

    <EmptyState
      v-else-if="error && !addresses.length"
      title="地址加载失败"
      :description="error"
      action-label="重试"
      @action="loadAddresses()"
    />

    <template v-else-if="addresses.length">
      <article
        v-for="address in addresses"
        :key="address.id"
        class="address-list__card surface-card"
      >
        <div class="address-list__copy">
          <div class="address-list__title">
            <strong>{{ address.tag || '地址' }} · {{ address.name }}</strong>
            <span v-if="address.isDefault" class="pill">默认</span>
          </div>
          <p>{{ address.phone }}</p>
          <p>{{ address.displayAddress }}</p>
        </div>

        <div class="address-list__actions">
          <button type="button" class="button-secondary" @click="router.push(`/addresses/${address.id}/edit`)">
            编辑
          </button>
          <button
            type="button"
            class="button-secondary"
            :disabled="removingId === address.id"
            @click="removeAddress(address.id)"
          >
            删除
          </button>
        </div>
      </article>
    </template>

    <EmptyState
      v-else
      title="还没有收货地址"
      description="新增一个地址后，下单时就能直接选择。"
      action-label="去新增"
      @action="router.push('/addresses/new')"
    />
  </div>
</template>

<style scoped>
.address-list {
  padding-bottom: var(--space-6);
}

.address-list__card {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4);
}

.address-list__copy,
.address-list__actions {
  display: grid;
  gap: var(--space-2);
}

.address-list__title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.address-list__copy p,
.address-list__state {
  color: var(--color-text-soft);
}

.address-list__actions {
  grid-template-columns: 1fr 1fr;
}

.address-list__state {
  padding: var(--space-5);
  text-align: center;
}
</style>
