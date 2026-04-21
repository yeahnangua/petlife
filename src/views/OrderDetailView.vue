<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EmptyState from '@/components/EmptyState.vue'
import { getOrderDetail } from '@/api/user'
import { adaptOrder } from '@/adapters/order'
import { formatCurrency } from '@/lib/pricing'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const error = ref('')
const order = ref(null)

const itemCountLabel = computed(() => order.value?.itemCount || order.value?.items.length || 0)

async function loadOrder() {
  loading.value = true
  error.value = ''

  try {
    const data = await getOrderDetail(route.params.id)
    order.value = adaptOrder(data.order)
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : '订单加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadOrder()
})
</script>

<template>
  <div class="order-detail page-pad page-stack">
    <div v-if="loading" class="surface-card order-detail__state">正在加载订单...</div>

    <template v-else-if="order">
      <section class="surface-card order-detail__card">
        <div class="section-heading">
          <div>
            <p class="section-heading__meta">订单状态</p>
            <h2 class="section-heading__title">{{ order.statusLabel }}</h2>
          </div>
          <span>{{ order.createdAt }}</span>
        </div>
        <p>订单号：{{ order.orderNo }}</p>
        <p>收货地址：{{ order.address }}</p>
        <p v-if="order.remark">订单备注：{{ order.remark }}</p>
      </section>

      <section class="surface-card order-detail__card">
        <div class="section-heading">
          <div>
            <p class="section-heading__meta">商品清单</p>
            <h2 class="section-heading__title">{{ itemCountLabel }} 件商品</h2>
          </div>
        </div>

        <article
          v-for="item in order.items"
          :key="item.id"
          class="order-detail__item"
        >
          <img :src="item.cover" :alt="item.title" />
          <div>
            <strong>{{ item.title }}</strong>
            <p>{{ item.specLabel }} · x{{ item.quantity }}</p>
          </div>
          <span>{{ formatCurrency(item.totalAmount) }}</span>
        </article>
      </section>

      <section class="surface-card order-detail__card">
        <div class="order-detail__amount">
          <span>订单总额</span>
          <strong>{{ formatCurrency(order.totalAmount) }}</strong>
        </div>
      </section>
    </template>

    <EmptyState
      v-else
      title="订单暂时找不到了"
      :description="error || '可能已经被取消，先回订单列表看看。'"
      action-label="返回订单页"
      @action="router.push('/orders')"
    />
  </div>
</template>

<style scoped>
.order-detail {
  padding-bottom: var(--space-6);
}

.order-detail__card {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4);
}

.order-detail__item,
.order-detail__amount {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) auto;
  gap: var(--space-3);
  align-items: center;
}

.order-detail__item img {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-md);
  object-fit: cover;
}

.order-detail__item p,
.order-detail__card p,
.order-detail__state {
  color: var(--color-text-soft);
}

.order-detail__amount {
  grid-template-columns: 1fr auto;
}

.order-detail__amount strong {
  color: var(--color-coral);
}

.order-detail__state {
  padding: var(--space-5);
  text-align: center;
}
</style>
