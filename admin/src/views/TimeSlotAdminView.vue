<script setup>
import { computed, onMounted, ref } from 'vue'
import TimeSlotFormDialog from '@/components/TimeSlotFormDialog.vue'
import { useCatalogStore } from '@/stores/catalog'
import { enabledFilterOptions, getEnabledLabel } from '@/utils/enumLabels'

const catalogStore = useCatalogStore()
const enabledFilter = ref('all')

const filteredTimeSlots = computed(() => {
  if (enabledFilter.value === 'all') {
    return catalogStore.timeSlots
  }

  return catalogStore.timeSlots.filter((item) => String(item.is_enabled) === enabledFilter.value)
})

async function loadPage() {
  await catalogStore.fetchTimeSlots()
}

async function submitTimeSlot(payload) {
  const id = catalogStore.dialogs.timeSlot.item?.id ?? null
  await catalogStore.saveTimeSlot(payload, id)
}

onMounted(() => {
  loadPage()
})
</script>

<template>
  <section class="admin-list-page">
    <div class="admin-list-page__header">
      <div>
        <p class="admin-list-page__meta">时段管理</p>
        <h2>预约时段和容量</h2>
      </div>
      <div class="admin-list-page__filters">
        <select v-model="enabledFilter">
          <option v-for="item in enabledFilterOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
        <button type="button" class="button-primary" @click="catalogStore.openDialog('timeSlot')">新增时段</button>
      </div>
    </div>
    <p v-if="catalogStore.error" class="admin-list-page__error">{{ catalogStore.error }}</p>
    <div v-if="catalogStore.loading.timeSlots" class="admin-list-page__state">正在加载时段...</div>
    <div v-else class="admin-table">
      <header class="admin-table__row admin-table__row--head">
        <span>标签</span>
        <span>时间</span>
        <span>容量</span>
        <span>状态</span>
        <span>操作</span>
      </header>
      <article v-for="item in filteredTimeSlots" :key="item.id" class="admin-table__row">
        <span>{{ item.label }}</span>
        <span>{{ item.start_time }} - {{ item.end_time }}</span>
        <span>{{ item.capacity }}</span>
        <span>{{ getEnabledLabel(item.is_enabled) }}</span>
        <div class="admin-table__actions">
          <button type="button" @click="catalogStore.openDialog('timeSlot', item)">编辑</button>
          <button type="button" @click="catalogStore.removeTimeSlot(item.id)">删除/停用</button>
        </div>
      </article>
    </div>

    <TimeSlotFormDialog
      v-model="catalogStore.dialogs.timeSlot.open"
      :initial-value="catalogStore.dialogs.timeSlot.item"
      :submitting="catalogStore.saving.timeSlot"
      @submit="submitTimeSlot"
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
