<script setup>
import { computed } from 'vue'
import { formatCurrency } from '@/lib/pricing'

const props = defineProps({
  product: {
    type: Object,
    required: true
  }
})

const tagList = computed(() => props.product.tags?.slice(0, 2) ?? [])
</script>

<template>
  <RouterLink :to="`/product/${product.id}`" class="product-card surface-card">
    <div
      class="product-card__media"
      :style="{
        background: `linear-gradient(135deg, ${product.gradient?.[0] || '#DCE6DD'}, ${product.gradient?.[1] || '#F5EFE7'})`
      }"
    >
      <img :src="product.cover" :alt="product.title" loading="lazy" />
      <span v-if="product.badge" class="product-card__badge">{{ product.badge }}</span>
    </div>

    <div class="product-card__content">
      <div class="product-card__meta">
        <span
          v-for="tag in tagList"
          :key="tag"
          class="product-card__tag"
        >
          {{ tag }}
        </span>
      </div>
      <h3 class="product-card__title">{{ product.title }}</h3>
      <p class="product-card__subtitle">{{ product.subtitle }}</p>

      <div class="product-card__footer">
        <div class="product-card__price-block">
          <strong>{{ formatCurrency(product.memberPrice ?? product.price) }}</strong>
          <span v-if="product.originalPrice">{{ formatCurrency(product.originalPrice) }}</span>
        </div>
        <span class="product-card__cta">查看</span>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.product-card {
  overflow: hidden;
  color: inherit;
}

.product-card__media {
  position: relative;
  aspect-ratio: 1.08;
  overflow: hidden;
}

.product-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-card__badge {
  position: absolute;
  top: var(--space-3);
  left: var(--space-3);
  padding: 4px 10px;
  border-radius: var(--radius-full);
  background: rgba(43, 42, 38, 0.74);
  color: var(--color-text-invert);
  font-size: var(--text-xs);
}

.product-card__content {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-4);
}

.product-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.product-card__tag {
  padding: 4px 8px;
  border-radius: var(--radius-full);
  background: var(--color-primary-tint);
  color: var(--color-primary-deep);
  font-size: var(--text-xs);
}

.product-card__title {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
}

.product-card__subtitle {
  color: var(--color-text-soft);
  font-size: var(--text-sm);
  line-height: var(--leading-snug);
}

.product-card__footer {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: var(--space-3);
}

.product-card__price-block {
  display: grid;
  gap: 2px;
}

.product-card__price-block strong {
  color: var(--color-coral);
  font-size: var(--text-xl);
}

.product-card__price-block span {
  color: var(--color-text-tint);
  font-size: var(--text-sm);
  text-decoration: line-through;
}

.product-card__cta {
  color: var(--color-primary-deep);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
}
</style>
