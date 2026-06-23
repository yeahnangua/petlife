<script setup>
import { onMounted } from 'vue'
import CategoryFormDialog from '@/components/CategoryFormDialog.vue'
import { useCatalogStore } from '@/stores/catalog'
import { getEnabledLabel, getPetTypeLabel } from '@/utils/enumLabels'

const catalogStore = useCatalogStore()

async function loadPage() {
  await catalogStore.fetchCategories()
}

async function submitCategory(payload) {
  const id = catalogStore.dialogs.category.item?.id ?? null
  await catalogStore.saveCategory(payload, id)
}

onMounted(() => {
  loadPage()
})
</script>

<template>
  <section class="admin-list-page">
    <div class="admin-list-page__header">
      <div>
        <p class="admin-list-page__meta">分类管理</p>
        <h2>分类与宠物类型映射</h2>
      </div>
      <button type="button" class="button-primary" @click="catalogStore.openDialog('category')">新增分类</button>
    </div>
    <p v-if="catalogStore.error" class="admin-list-page__error">{{ catalogStore.error }}</p>
    <div v-if="catalogStore.loading.categories" class="admin-list-page__state">正在加载分类...</div>
    <div v-else class="admin-table">
      <header class="admin-table__row admin-table__row--head">
        <span>名称</span>
        <span>分类标识</span>
        <span>宠物类型</span>
        <span>状态</span>
        <span>操作</span>
      </header>
      <article v-for="item in catalogStore.categories" :key="item.id" class="admin-table__row">
        <span>{{ item.name }}</span>
        <span>{{ item.slug }}</span>
        <span>{{ getPetTypeLabel(item.pet_type) }}</span>
        <span>{{ getEnabledLabel(item.is_enabled) }}</span>
        <div class="admin-table__actions">
          <button type="button" @click="catalogStore.openDialog('category', item)">编辑</button>
          <button type="button" @click="catalogStore.removeCategory(item.id)">删除</button>
        </div>
      </article>
    </div>

    <CategoryFormDialog
      v-model="catalogStore.dialogs.category.open"
      :initial-value="catalogStore.dialogs.category.item"
      :submitting="catalogStore.saving.category"
      @submit="submitCategory"
    />
  </section>
</template>

<style scoped>
.admin-list-page {
  display: grid;
  gap: 20px;
}

.admin-list-page__header,
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
