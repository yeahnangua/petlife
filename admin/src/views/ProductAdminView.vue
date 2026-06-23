<script setup>
import { computed, onMounted, ref } from 'vue'
import ProductFormDialog from '@/components/ProductFormDialog.vue'
import { useCatalogStore } from '@/stores/catalog'
import {
  getPublishStatusLabel,
  getStockStatusLabel,
  publishStatusFilterOptions
} from '@/utils/enumLabels'

const catalogStore = useCatalogStore()
const statusFilter = ref('all')

const filteredProducts = computed(() => {
  if (statusFilter.value === 'all') {
    return catalogStore.products
  }

  return catalogStore.products.filter((item) => item.status === statusFilter.value)
})

const categoryNameById = computed(() => {
  return new Map(catalogStore.categories.map((item) => [item.id, item.name]))
})

async function loadPage() {
  await Promise.all([
    catalogStore.fetchCategories(),
    catalogStore.fetchProducts()
  ])
}

async function submitProduct(payload) {
  const id = catalogStore.dialogs.product.item?.id ?? null
  await catalogStore.saveProduct(payload, id)
}

onMounted(() => {
  loadPage()
})
</script>

<template>
  <section class="admin-list-page">
    <div class="admin-list-page__header">
      <div>
        <p class="admin-list-page__meta">商品管理</p>
        <h2>商品增删改查与上下架</h2>
      </div>
      <div class="admin-list-page__filters">
        <select v-model="statusFilter">
          <option v-for="item in publishStatusFilterOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
        <button type="button" class="button-primary" @click="catalogStore.openDialog('product')">新增商品</button>
      </div>
    </div>
    <p v-if="catalogStore.error" class="admin-list-page__error">{{ catalogStore.error }}</p>
    <div v-if="catalogStore.loading.products" class="admin-list-page__state">正在加载商品...</div>
    <div v-else class="admin-table">
      <header class="admin-table__row admin-table__row--head">
        <span>标题</span>
        <span>分类</span>
        <span>库存</span>
        <span>状态</span>
        <span>操作</span>
      </header>
      <article v-for="item in filteredProducts" :key="item.id" class="admin-table__row">
        <span>{{ item.title }}</span>
        <span>{{ categoryNameById.get(item.category_id) || item.category_slug }}</span>
        <span>{{ item.stock }} / {{ getStockStatusLabel(item.stock_status) }}</span>
        <span>{{ getPublishStatusLabel(item.status) }}</span>
        <div class="admin-table__actions">
          <button type="button" @click="catalogStore.openDialog('product', item)">编辑</button>
          <button type="button" @click="catalogStore.removeProduct(item.id)">删除/下架</button>
        </div>
      </article>
    </div>

    <ProductFormDialog
      v-model="catalogStore.dialogs.product.open"
      :initial-value="catalogStore.dialogs.product.item"
      :categories="catalogStore.categories"
      :submitting="catalogStore.saving.product"
      @submit="submitProduct"
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
