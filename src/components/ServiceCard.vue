<script setup>
import { formatCurrency } from '@/lib/pricing'
import IconSvg from '@/components/IconSvg.vue'

defineProps({
  service: {
    type: Object,
    required: true
  }
})
</script>

<template>
  <RouterLink :to="`/service/${service.id}`" class="service-card surface-card">
    <div
      class="service-card__cover"
      :style="{
        background: `linear-gradient(135deg, ${service.gradient?.[0] || '#DCE6DD'}, ${service.gradient?.[1] || '#F5EFE7'})`
      }"
    >
      <img :src="service.cover" :alt="service.title" loading="lazy" />
    </div>
    <div class="service-card__content">
      <div class="service-card__row">
        <span class="pill">{{ service.tagline }}</span>
        <span class="service-card__rating">
          <IconSvg name="star" :size="14" />
          {{ service.rating }}
        </span>
      </div>
      <h3 class="service-card__title">{{ service.title }}</h3>
      <ul class="service-card__includes">
        <li v-for="item in service.includes.slice(0, 2)" :key="item">{{ item }}</li>
      </ul>
      <div class="service-card__footer">
        <div>
          <strong>{{ formatCurrency(service.memberPrice ?? service.price) }}</strong>
          <span>{{ service.duration }} 分钟</span>
        </div>
        <span class="service-card__cta">预约</span>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.service-card {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: var(--space-3);
  overflow: hidden;
  padding: var(--space-3);
  color: inherit;
}

.service-card__cover {
  aspect-ratio: 0.88;
  border-radius: calc(var(--radius-lg) - 2px);
  overflow: hidden;
}

.service-card__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.service-card__content {
  display: grid;
  gap: var(--space-2);
  min-width: 0;
}

.service-card__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.service-card__rating {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text-soft);
  font-size: var(--text-sm);
}

.service-card__title {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
}

.service-card__includes {
  display: grid;
  gap: 4px;
  color: var(--color-text-soft);
  font-size: var(--text-sm);
}

.service-card__includes li::before {
  content: '·';
  margin-right: 6px;
}

.service-card__footer {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: var(--space-2);
  margin-top: auto;
}

.service-card__footer strong {
  display: block;
  color: var(--color-coral);
  font-size: var(--text-xl);
}

.service-card__footer span {
  color: var(--color-text-mute);
  font-size: var(--text-sm);
}

.service-card__cta {
  color: var(--color-primary-deep);
  font-weight: var(--weight-semibold);
}
</style>
