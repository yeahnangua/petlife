<script setup>
import { computed, onMounted, ref } from 'vue'
import StoreFormDialog from '@/components/StoreFormDialog.vue'
import { useCatalogStore } from '@/stores/catalog'
import { getPublishStatusLabel, publishStatusFilterOptions } from '@/utils/enumLabels'

const catalogStore = useCatalogStore()
const statusFilter = ref('all')

const filteredStores = computed(() => {
  if (statusFilter.value === 'all') {
    return catalogStore.stores
  }

  return catalogStore.stores.filter((item) => item.status === statusFilter.value)
})

async function loadPage() {
  await catalogStore.fetchStores()
}

async function submitStore(payload) {
  const id = catalogStore.dialogs.store.item?.id ?? null
  await catalogStore.saveStore(payload, id)
}

onMounted(() => {
  loadPage()
})
</script>

<template>
  <section class="admin-list-page">
    <div class="admin-list-page__header">
      <div>
        <p class="admin-list-page__meta">门店管理</p>
        <h2>门店信息与营业状态</h2>
      </div>
      <div class="admin-list-page__filters">
        <select v-model="statusFilter">
          <option v-for="item in publishStatusFilterOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
        <button type="button" class="button-primary" @click="catalogStore.openDialog('store')">新增门店</button>
      </div>
    </div>
    <p v-if="catalogStore.error" class="admin-list-page__error">{{ catalogStore.error }}</p>
    <div v-if="catalogStore.loading.stores" class="admin-list-page__state">正在加载门店...</div>
    <div v-else class="admin-table">
      <header class="admin-table__row admin-table__row--head">
        <span>门店</span>
        <span>电话</span>
        <span>营业时间</span>
        <span>状态</span>
        <span>操作</span>
      </header>
      <article v-for="item in filteredStores" :key="item.id" class="admin-table__row">
        <span>{{ item.name }}</span>
        <span>{{ item.phone }}</span>
        <span>{{ item.business_hours }}</span>
        <span>{{ getPublishStatusLabel(item.status) }}</span>
        <div class="admin-table__actions">
          <button type="button" @click="catalogStore.openDialog('store', item)">编辑</button>
          <button type="button" @click="catalogStore.removeStore(item.id)">删除/下架</button>
        </div>
      </article>
    </div>

    <StoreFormDialog
      v-model="catalogStore.dialogs.store.open"
      :initial-value="catalogStore.dialogs.store.item"
      :submitting="catalogStore.saving.store"
      @submit="submitStore"
    />
  </section>
</template>

<style scoped>
.admin-list-page {
  display: grid;
  gap: 20px;
}

.admin-list-page__header,
.admin-list-page__filters,
.admin-table__row,
.admin-table__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.admin-list-page__meta {
  color: #866549;
}

.admin-list-page__filters select {
  min-height: 40px;
  padding: 0 12px;
  border: 1px solid #d8cbbd;
  border-radius: 999px;
}

.admin-list-page__state,
.admin-list-page__error {
  padding: 16px;
  border-radius: 16px;
  background: #f6efe6;
}

.admin-list-page__error {
  color: #b15b38;
}

.admin-table {
  display: grid;
  border-radius: 20px;
  overflow: hidden;
}

.admin-table__row {
  padding: 16px 18px;
  background: #fff7ef;
}

.admin-table__row--head {
  background: #eadfd1;
  font-weight: 600;
}

.admin-table__actions button,
.button-primary {
  min-height: 36px;
  padding: 0 14px;
  border: 0;
  border-radius: 999px;
}

.button-primary {
  background: #29211b;
  color: #fff;
}
</style>
