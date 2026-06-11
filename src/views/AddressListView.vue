<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import EmptyState from '@/components/EmptyState.vue'
import IconSvg from '@/components/IconSvg.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import { deleteAddress, getAddresses } from '@/api/user'
import { adaptAddress } from '@/adapters/profile'

const router = useRouter()

const addresses = ref([])
const loading = ref(false)
const error = ref('')
const removingId = ref('')
const pendingDelete = ref(null)

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
  pendingDelete.value = null

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
  <div class="alist page-pad">
    <header class="alist__head">
      <div>
        <p class="alist__eyebrow">地址管理</p>
        <h1 class="alist__title font-display">收货地址</h1>
      </div>
      <button type="button" class="alist__add" @click="router.push('/addresses/new')">
        <IconSvg name="plus" :size="15" :stroke="2.4" />
        新增
      </button>
    </header>

    <div v-if="loading" class="alist__stack">
      <SkeletonBlock variant="card" />
      <SkeletonBlock variant="card" />
    </div>

    <EmptyState
      v-else-if="error && !addresses.length"
      title="地址加载失败"
      :description="error"
      action-label="重试"
      @action="loadAddresses()"
    />

    <template v-else-if="addresses.length">
      <p v-if="error" class="alist__error">{{ error }}</p>
      <section class="alist__stack">
        <article v-for="address in addresses" :key="address.id" class="alist__card surface-card">
          <div class="alist__icon">
            <IconSvg name="location" :size="18" :stroke="1.8" />
          </div>
          <div class="alist__body">
            <p class="alist__name">
              {{ address.name }}
              <span class="alist__phone">{{ address.phone }}</span>
              <i v-if="address.tag" class="alist__tag">{{ address.tag }}</i>
              <i v-if="address.isDefault" class="alist__tag alist__tag--default">默认</i>
            </p>
            <p class="alist__detail">{{ address.displayAddress }}</p>
          </div>
          <div class="alist__actions">
            <button
              type="button"
              class="alist__action"
              aria-label="编辑地址"
              @click="router.push(`/addresses/${address.id}/edit`)"
            >
              <IconSvg name="edit" :size="15" :stroke="1.8" />
            </button>
            <button
              type="button"
              class="alist__action alist__action--danger"
              aria-label="删除地址"
              :disabled="removingId === address.id"
              @click="pendingDelete = address"
            >
              <IconSvg name="trash" :size="15" :stroke="1.8" />
            </button>
          </div>
        </article>
      </section>
    </template>

    <EmptyState
      v-else
      icon="location"
      title="还没有收货地址"
      description="新增一个地址后，下单时就能直接选择。"
      action-label="去新增"
      @action="router.push('/addresses/new')"
    />

    <ConfirmDialog
      :open="Boolean(pendingDelete)"
      title="删除这条地址？"
      :desc="pendingDelete ? `${pendingDelete.name} · ${pendingDelete.displayAddress}` : ''"
      confirm-label="删除"
      danger
      @confirm="removeAddress(pendingDelete.id)"
      @cancel="pendingDelete = null"
    />
  </div>
</template>

<style scoped>
.alist {
  display: grid;
  gap: var(--space-4);
  padding-top: var(--space-2);
  padding-bottom: var(--space-6);
  align-content: start;
}

.alist__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.alist__eyebrow {
  color: var(--color-primary);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-wider);
}

.alist__title {
  margin-top: 2px;
  font-size: var(--text-2xl);
  font-weight: var(--weight-semibold);
}

.alist__add {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 38px;
  padding: 0 var(--space-4);
  border-radius: var(--radius-full);
  background: var(--color-primary-deep);
  color: var(--color-text-invert);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  box-shadow: var(--shadow-brand);
  transition: transform var(--dur-fast) var(--ease-spring);
}

.alist__add:active {
  transform: scale(0.94);
}

.alist__stack {
  display: grid;
  gap: var(--space-3);
}

.alist__card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
}

.alist__icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: var(--radius-full);
  background: var(--color-primary-tint);
  color: var(--color-primary);
}

.alist__body {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 3px;
}

.alist__name {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
}

.alist__phone {
  color: var(--color-text-mute);
  font-size: var(--text-xs);
  font-weight: var(--weight-regular);
}

.alist__tag {
  padding: 1px 7px;
  border-radius: var(--radius-full);
  background: var(--color-surface-warm);
  color: var(--color-text-mute);
  font-size: var(--text-2xs);
  font-style: normal;
}

.alist__tag--default {
  background: var(--color-primary-soft);
  color: var(--color-primary-deep);
}

.alist__detail {
  color: var(--color-text-soft);
  font-size: var(--text-sm);
  line-height: var(--leading-snug);
}

.alist__actions {
  display: grid;
  gap: var(--space-2);
}

.alist__action {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background: var(--color-surface-warm);
  color: var(--color-text-soft);
  transition: transform var(--dur-fast) var(--ease-spring);
}

.alist__action:active {
  transform: scale(0.88);
}

.alist__action--danger {
  color: var(--color-danger);
  background: var(--color-danger-soft);
}

.alist__error {
  color: var(--color-danger);
  font-size: var(--text-sm);
}
</style>
