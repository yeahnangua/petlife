<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import IconSvg from './IconSvg.vue'
import PriceText from './PriceText.vue'
import StatusBadge from './StatusBadge.vue'

const props = defineProps({
  order: { type: Object, required: true }
})

const router = useRouter()

const isService = computed(() => props.order.kind === 'service')
const kindLabel = computed(() => (isService.value ? '服务预约' : '商品订单'))
const firstItem = computed(() => props.order.items?.[0] ?? null)

function openDetail() {
  if (isService.value) {
    router.push(`/bookings/${props.order.id}`)
    return
  }
  router.push(`/orders/${props.order.id}`)
}
</script>

<template>
  <article class="order-card" @click="openDetail">
    <header class="order-card__head">
      <span class="order-card__kind" :class="{ 'order-card__kind--service': isService }">
        <IconSvg :name="isService ? 'sparkle' : 'box'" :size="12" :stroke="2" />
        {{ kindLabel }}
      </span>
      <span class="order-card__no">{{ order.orderNo }}</span>
      <StatusBadge :status="order.status" :label="order.statusLabel" />
    </header>

    <div v-if="isService" class="order-card__body">
      <img class="order-card__thumb" :src="order.service.cover" :alt="order.service.title" loading="lazy" />
      <div class="order-card__info">
        <h3 class="order-card__title">{{ order.service.title }}</h3>
        <p class="order-card__meta">
          <IconSvg name="paw" :size="12" :stroke="2" />
          {{ order.pet.name }}
          <i class="order-card__sep" />
          {{ order.scheduledAt }}
        </p>
        <p class="order-card__meta">
          <IconSvg name="location" :size="12" :stroke="2" />
          {{ order.store }}
        </p>
      </div>
    </div>

    <div v-else-if="firstItem" class="order-card__body">
      <img class="order-card__thumb" :src="firstItem.cover" :alt="firstItem.title" loading="lazy" />
      <div class="order-card__info">
        <h3 class="order-card__title">{{ firstItem.title }}</h3>
        <p class="order-card__meta">{{ firstItem.specLabel }}</p>
        <p v-if="order.itemCount > 1" class="order-card__meta">等 {{ order.itemCount }} 件商品</p>
      </div>
    </div>

    <footer class="order-card__foot">
      <span class="order-card__date">{{ order.createdAt }}</span>
      <span class="order-card__total">
        合计
        <PriceText :value="isService ? order.totalAmount : order.payableAmount" size="sm" />
      </span>
    </footer>
  </article>
</template>

<style scoped>
.order-card {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-xs);
  cursor: pointer;
  transition: transform var(--dur-fast) var(--ease-spring);
}

.order-card:active {
  transform: scale(0.985);
}

.order-card__head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.order-card__kind {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--color-primary-deep);
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
}

.order-card__kind--service {
  color: var(--color-sky);
}

.order-card__no {
  flex: 1;
  color: var(--color-text-tint);
  font-size: var(--text-2xs);
  font-family: var(--font-mono);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.order-card__body {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  gap: var(--space-3);
  align-items: center;
}

.order-card__thumb {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-md);
  object-fit: cover;
  background: var(--color-surface-warm);
}

.order-card__info {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.order-card__title {
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.order-card__meta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text-mute);
  font-size: var(--text-xs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.order-card__sep {
  width: 3px;
  height: 3px;
  border-radius: var(--radius-full);
  background: currentColor;
  opacity: 0.5;
}

.order-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--space-3);
  border-top: 1px dashed var(--color-divider);
}

.order-card__date {
  color: var(--color-text-tint);
  font-size: var(--text-xs);
}

.order-card__total {
  display: inline-flex;
  align-items: baseline;
  gap: var(--space-2);
  color: var(--color-text-soft);
  font-size: var(--text-xs);
}
</style>
