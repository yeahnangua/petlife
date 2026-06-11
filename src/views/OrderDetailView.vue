<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EmptyState from '@/components/EmptyState.vue'
import IconSvg from '@/components/IconSvg.vue'
import PriceText from '@/components/PriceText.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import StatusBadge from '@/components/StatusBadge.vue'
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
  <div class="odetail page-pad">
    <div v-if="loading" class="odetail__stack">
      <SkeletonBlock variant="card" />
      <SkeletonBlock variant="text" :lines="3" />
    </div>

    <template v-else-if="order">
      <div class="odetail__stack">
        <!-- 状态卡（深色块） -->
        <section class="odetail__status">
          <div class="odetail__status-row">
            <h2 class="odetail__status-label font-display">{{ order.statusLabel }}</h2>
            <StatusBadge :status="order.status" :label="order.statusLabel" />
          </div>
          <p class="odetail__status-meta">下单时间 {{ order.createdAt }}</p>
          <p class="odetail__status-no">订单号 {{ order.orderNo }}</p>
        </section>

        <!-- 收货信息 -->
        <section class="odetail__card surface-card">
          <h3 class="odetail__card-title">收货信息</h3>
          <p class="odetail__address">
            <IconSvg name="location" :size="15" :stroke="1.8" />
            {{ order.address }}
          </p>
          <p v-if="order.remark" class="odetail__remark">备注：{{ order.remark }}</p>
        </section>

        <!-- 商品清单 -->
        <section class="odetail__card surface-card">
          <h3 class="odetail__card-title">商品清单 · {{ itemCountLabel }} 件</h3>
          <article v-for="item in order.items" :key="item.id" class="odetail__item">
            <img :src="item.cover" :alt="item.title" loading="lazy" />
            <div class="odetail__item-info">
              <strong>{{ item.title }}</strong>
              <p>{{ item.specLabel }} · x{{ item.quantity }}</p>
            </div>
            <PriceText :value="item.totalAmount" size="sm" />
          </article>
        </section>

        <!-- 金额明细 -->
        <section class="odetail__card surface-card">
          <h3 class="odetail__card-title">金额明细</h3>
          <div class="odetail__amounts">
            <div><span>商品金额</span><strong>{{ formatCurrency(order.subtotalAmount) }}</strong></div>
            <div><span>运费</span><strong>{{ formatCurrency(order.shippingAmount) }}</strong></div>
            <div class="odetail__total">
              <span>订单总额</span>
              <PriceText :value="order.payableAmount" size="md" />
            </div>
          </div>
        </section>
      </div>
    </template>

    <EmptyState
      v-else
      icon="order"
      title="订单暂时找不到了"
      :description="error || '可能已经被取消，先回订单列表看看。'"
      action-label="返回订单页"
      @action="router.push('/orders')"
    />
  </div>
</template>

<style scoped>
.odetail {
  padding-top: var(--space-2);
  padding-bottom: var(--space-6);
}

.odetail__stack {
  display: grid;
  gap: var(--space-3);
}

.odetail__status {
  display: grid;
  gap: 4px;
  padding: var(--space-5);
  border-radius: var(--radius-xl);
  background: linear-gradient(150deg, #2E4A38, var(--color-primary-deep));
  color: var(--color-text-invert);
  box-shadow: var(--shadow-brand);
}

.odetail__status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.odetail__status-label {
  font-size: var(--text-2xl);
  font-weight: var(--weight-semibold);
}

.odetail__status-meta {
  color: rgba(247, 244, 236, 0.66);
  font-size: var(--text-xs);
}

.odetail__status-no {
  color: rgba(247, 244, 236, 0.5);
  font-size: var(--text-2xs);
  font-family: var(--font-mono);
}

.odetail__card {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-5);
  border-radius: var(--radius-lg);
}

.odetail__card-title {
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
}

.odetail__address {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  color: var(--color-text-soft);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

.odetail__address :deep(.icon-svg) {
  flex-shrink: 0;
  transform: translateY(2px);
  color: var(--color-primary);
}

.odetail__remark {
  color: var(--color-text-mute);
  font-size: var(--text-xs);
}

.odetail__item {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) auto;
  gap: var(--space-3);
  align-items: center;
}

.odetail__item img {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-sm);
  object-fit: cover;
  background: var(--color-surface-warm);
}

.odetail__item-info {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.odetail__item-info strong {
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.odetail__item-info p {
  color: var(--color-text-mute);
  font-size: var(--text-xs);
}

.odetail__amounts {
  display: grid;
  gap: var(--space-3);
}

.odetail__amounts > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.odetail__amounts span {
  color: var(--color-text-soft);
  font-size: var(--text-sm);
}

.odetail__amounts strong {
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
}

.odetail__total {
  padding-top: var(--space-3);
  border-top: 1px dashed var(--color-divider);
}

.odetail__total span {
  color: var(--color-text);
  font-weight: var(--weight-semibold);
}
</style>
