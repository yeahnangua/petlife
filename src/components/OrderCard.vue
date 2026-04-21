<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { formatCurrency } from '@/lib/pricing'
import IconSvg from '@/components/IconSvg.vue'

const props = defineProps({
  order: {
    type: Object,
    required: true
  }
})

const router = useRouter()
const kindLabel = computed(() => props.order.kind === 'service' ? '服务订单' : '商品订单')

function openDetail() {
  if (props.order.kind === 'service') {
    router.push(`/bookings/${props.order.id}`)
    return
  }

  router.push(`/orders/${props.order.id}`)
}
</script>

<template>
  <article class="order-card surface-card">
    <header class="order-card__header">
      <div>
        <p class="order-card__kind">{{ kindLabel }}</p>
        <h3 class="order-card__id">{{ order.id }}</h3>
      </div>
      <span class="order-card__status">{{ order.statusLabel }}</span>
    </header>

    <template v-if="order.kind === 'service'">
      <div class="order-card__body">
        <img class="order-card__thumb" :src="order.service.cover" :alt="order.service.title" />
        <div class="order-card__content">
          <strong>{{ order.service.title }}</strong>
          <p>{{ order.pet.name }} · {{ order.scheduledAt }}</p>
          <p>{{ order.store }}</p>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="order-card__body">
        <img class="order-card__thumb" :src="order.items[0].cover" :alt="order.items[0].title" />
        <div class="order-card__content">
          <strong>{{ order.items[0].title }}</strong>
          <p>{{ order.itemCount }} 件商品 · {{ order.createdAt }}</p>
          <p>{{ order.address }}</p>
        </div>
      </div>
    </template>

    <footer class="order-card__footer">
      <span class="order-card__amount">{{ formatCurrency(order.totalAmount) }}</span>
      <button type="button" class="order-card__detail" @click="openDetail">
        查看详情
        <IconSvg name="arrow-right" :size="14" />
      </button>
    </footer>
  </article>
</template>

<style scoped>
.order-card {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4);
}

.order-card__header,
.order-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.order-card__kind,
.order-card__id {
  font-size: var(--text-sm);
}

.order-card__kind {
  color: var(--color-text-mute);
}

.order-card__id {
  font-weight: var(--weight-semibold);
}

.order-card__status {
  color: var(--color-primary-deep);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
}

.order-card__body {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: var(--space-3);
}

.order-card__thumb {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-md);
  object-fit: cover;
}

.order-card__content {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.order-card__content strong {
  font-size: var(--text-md);
}

.order-card__content p {
  color: var(--color-text-soft);
  font-size: var(--text-sm);
}

.order-card__amount {
  color: var(--color-coral);
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
}

.order-card__detail {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--color-primary-deep);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
}
</style>
