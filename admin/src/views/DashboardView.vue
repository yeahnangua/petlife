<script setup>
import { computed, onMounted, ref } from 'vue'
import { listCategories, listProducts, listServices, listStores } from '@/api/catalog'
import { listBookings, listOrders } from '@/api/operations'

const loading = ref(false)
const error = ref('')
const stats = ref({
  categories: 0,
  products: 0,
  services: 0,
  stores: 0,
  orders: 0,
  bookings: 0
})

const statCards = computed(() => [
  { id: 'categories', title: '分类', description: '当前可维护分类数', value: stats.value.categories },
  { id: 'products', title: '商品', description: '后台商品总数', value: stats.value.products },
  { id: 'services', title: '服务', description: '可运营服务数', value: stats.value.services },
  { id: 'stores', title: '门店', description: '门店配置总数', value: stats.value.stores },
  { id: 'orders', title: '待发货订单', description: '需要跟进履约的订单', value: stats.value.orders },
  { id: 'bookings', title: '待服务预约', description: '等待门店接待的预约', value: stats.value.bookings }
])

async function loadDashboard() {
  loading.value = true
  error.value = ''

  try {
    const [categories, products, services, stores, orders, bookings] = await Promise.all([
      listCategories(),
      listProducts(),
      listServices(),
      listStores(),
      listOrders({ status: 'pendingShipment' }),
      listBookings({ status: 'pendingService' })
    ])

    stats.value = {
      categories: categories.list?.length ?? 0,
      products: products.list?.length ?? 0,
      services: services.list?.length ?? 0,
      stores: stores.list?.length ?? 0,
      orders: orders.list?.length ?? 0,
      bookings: bookings.list?.length ?? 0
    }
  } catch (requestError) {
    if (requestError instanceof Error && requestError.message === 'unauthorized') {
      return
    }

    error.value = requestError instanceof Error ? requestError.message : '后台概览加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDashboard()
})
</script>

<template>
  <section class="dashboard-view">
    <div class="dashboard-view__hero">
      <div>
        <p class="dashboard-view__eyebrow">运营概览</p>
        
      </div>
      <button type="button" class="dashboard-view__refresh" @click="loadDashboard">
        刷新概览
      </button>
    </div>

    <div v-if="loading" class="dashboard-view__state">正在加载后台概览...</div>
    <div v-else-if="error" class="dashboard-view__state is-error">{{ error }}</div>
    <div v-else class="dashboard-view__grid">
      <article
        v-for="card in statCards"
        :key="card.id"
        :data-test="`stat-${card.id}`"
        class="dashboard-view__card"
      >
        <p class="dashboard-view__label">{{ card.title }}</p>
        <strong>{{ card.value }}</strong>
        <span>{{ card.description }}</span>
      </article>
    </div>
  </section>
</template>

<style scoped>
.dashboard-view {
  display: grid;
  gap: 24px;
}

.dashboard-view__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 24px;
  border-radius: 24px;
  background: linear-gradient(135deg, #f8efe4 0%, #fff8f0 100%);
}

.dashboard-view__eyebrow {
  color: #866549;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.dashboard-view__copy,
.dashboard-view__card span {
  color: #6d5e4e;
  line-height: 1.6;
}

.dashboard-view__refresh {
  min-height: 44px;
  padding: 0 18px;
  border: 0;
  border-radius: 14px;
  background: #29211b;
  color: #fff;
}

.dashboard-view__state {
  padding: 24px;
  border-radius: 20px;
  background: #fff7ef;
  color: #6d5e4e;
}

.dashboard-view__state.is-error {
  color: #b15b38;
}

.dashboard-view__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.dashboard-view__card {
  display: grid;
  gap: 10px;
  padding: 20px;
  border-radius: 20px;
  background: #fffdfa;
}

.dashboard-view__label {
  color: #866549;
}

.dashboard-view__card strong {
  font-size: 32px;
  line-height: 1;
}

@media (max-width: 900px) {
  .dashboard-view__hero {
    flex-direction: column;
  }

  .dashboard-view__grid {
    grid-template-columns: 1fr;
  }
}
</style>
