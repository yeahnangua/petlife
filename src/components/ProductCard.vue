<script setup>
import { useRouter } from 'vue-router'
import IconSvg from './IconSvg.vue'
import PriceText from './PriceText.vue'

const props = defineProps({
  product: { type: Object, required: true }
})

const router = useRouter()

function open() {
  router.push({ name: 'product-detail', params: { id: props.product.id } })
}
</script>

<template>
  <article class="product-card" :class="{ 'product-card--soldout': product.stockStatus === 'soldOut' }" @click="open">
    <div class="product-card__media">
      <img :src="product.cover" :alt="product.title" loading="lazy" />
      <span v-if="product.badge" class="product-card__badge">{{ product.badge }}</span>
      <span v-if="product.stockStatus === 'soldOut'" class="product-card__soldout">已售罄</span>
    </div>
    <div class="product-card__body">
      <h3 class="product-card__title">{{ product.title }}</h3>
      <p v-if="product.subtitle" class="product-card__subtitle">{{ product.subtitle }}</p>
      <div class="product-card__meta">
        <span v-if="product.rating" class="product-card__rating">
          <IconSvg name="star" :size="11" :stroke="2" />
          {{ product.rating }}
        </span>
        <span v-if="product.sold" class="product-card__sold">已售 {{ product.sold }}</span>
      </div>
      <div class="product-card__footer">
        <PriceText :value="product.memberPrice" size="sm" :original="product.originalPrice" />
        <span class="product-card__cart" aria-label="查看商品">
          <IconSvg name="plus" :size="14" :stroke="2.4" />
        </span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.product-card {
  overflow: hidden;
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-xs);
  cursor: pointer;
  transition: transform var(--dur-fast) var(--ease-spring), box-shadow var(--dur-base) var(--ease-out);
}

.product-card:active {
  transform: scale(0.98);
  box-shadow: var(--shadow-sm);
}

.product-card__media {
  position: relative;
  aspect-ratio: 1 / 0.92;
  background: var(--color-surface-warm);
}

.product-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-card__badge {
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  padding: 3px 9px;
  border-radius: var(--radius-full);
  background: rgba(35, 33, 28, 0.78);
  color: var(--color-text-invert);
  font-size: var(--text-2xs);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-wide);
  backdrop-filter: blur(4px);
}

.product-card__soldout {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(250, 248, 243, 0.62);
  color: var(--color-text-soft);
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-wider);
}

.product-card--soldout .product-card__media img {
  filter: grayscale(0.7);
}

.product-card__body {
  display: grid;
  gap: 4px;
  padding: var(--space-3);
}

.product-card__title {
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-snug);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-card__subtitle {
  color: var(--color-text-mute);
  font-size: var(--text-xs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-card__meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 14px;
  color: var(--color-text-tint);
  font-size: var(--text-2xs);
}

.product-card__rating {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--color-amber);
  font-weight: var(--weight-semibold);
}

.product-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 2px;
}

.product-card__cart {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: var(--radius-full);
  background: var(--color-primary-deep);
  color: var(--color-text-invert);
  box-shadow: var(--shadow-brand);
}

.product-card--soldout .product-card__cart {
  background: var(--color-disabled);
  box-shadow: none;
}
</style>
