<script setup>
import { useRouter } from 'vue-router'
import IconSvg from './IconSvg.vue'
import PriceText from './PriceText.vue'

const props = defineProps({
  service: { type: Object, required: true },
  layout: { type: String, default: 'row' }
})

const router = useRouter()

function open() {
  router.push({ name: 'service-detail', params: { id: props.service.id } })
}
</script>

<template>
  <article v-if="layout === 'hero'" class="service-hero" @click="open">
    <img :src="service.cover" :alt="service.title" loading="lazy" />
    <div class="service-hero__scrim" />
    <span v-if="service.badge" class="service-hero__badge">{{ service.badge }}</span>
    <div class="service-hero__body">
      <h3 class="service-hero__title font-display">{{ service.title }}</h3>
      <p class="service-hero__meta">
        <IconSvg name="clock" :size="12" :stroke="2" />
        {{ service.duration }} 分钟
        <i class="service-hero__sep" />
        <IconSvg name="star" :size="12" :stroke="2" />
        {{ service.rating }}
      </p>
      <div class="service-hero__foot">
        <PriceText :value="service.memberPrice" size="md" :original="service.originalPrice" />
        <span class="service-hero__cta">立即预约</span>
      </div>
    </div>
  </article>

  <article v-else class="service-row" @click="open">
    <div class="service-row__media">
      <img :src="service.cover" :alt="service.title" loading="lazy" />
    </div>
    <div class="service-row__body">
      <div class="service-row__head">
        <h3 class="service-row__title">{{ service.title }}</h3>
        <span v-if="service.badge" class="service-row__badge">{{ service.badge }}</span>
      </div>
      <p v-if="service.tagline" class="service-row__tagline">{{ service.tagline }}</p>
      <p class="service-row__meta">
        <IconSvg name="clock" :size="12" :stroke="2" />
        {{ service.duration }} 分钟
        <i class="service-row__sep" />
        <IconSvg name="star" :size="12" :stroke="2" />
        {{ service.rating }}
        <template v-if="service.reviewCount">（{{ service.reviewCount }}）</template>
      </p>
      <div class="service-row__foot">
        <PriceText :value="service.memberPrice" size="sm" :original="service.originalPrice" />
        <span class="service-row__cta">
          预约
          <IconSvg name="arrow-right" :size="12" :stroke="2.4" />
        </span>
      </div>
    </div>
  </article>
</template>

<style scoped>
/* ---------- hero ---------- */
.service-hero {
  position: relative;
  overflow: hidden;
  aspect-ratio: 16 / 10.5;
  border-radius: var(--radius-xl);
  cursor: pointer;
  transition: transform var(--dur-fast) var(--ease-spring);
}

.service-hero:active {
  transform: scale(0.98);
}

.service-hero img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.service-hero__scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(178deg, rgba(35, 33, 28, 0) 30%, rgba(28, 38, 30, 0.86) 88%);
}

.service-hero__badge {
  position: absolute;
  top: var(--space-3);
  left: var(--space-3);
  padding: 4px 10px;
  border-radius: var(--radius-full);
  background: rgba(250, 248, 243, 0.92);
  color: var(--color-primary-deep);
  font-size: var(--text-2xs);
  font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-wide);
}

.service-hero__body {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  display: grid;
  gap: 4px;
  padding: var(--space-4);
  color: var(--color-text-invert);
}

.service-hero__title {
  font-size: var(--text-xl);
  font-weight: var(--weight-semibold);
}

.service-hero__meta {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: rgba(247, 244, 236, 0.82);
  font-size: var(--text-xs);
}

.service-hero__sep,
.service-row__sep {
  width: 3px;
  height: 3px;
  border-radius: var(--radius-full);
  background: currentColor;
  opacity: 0.5;
}

.service-hero__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--space-1);
}

.service-hero__foot :deep(.price) {
  color: #FFD9C4;
}

.service-hero__cta {
  padding: 7px 14px;
  border-radius: var(--radius-full);
  background: var(--color-text-invert);
  color: var(--color-primary-deep);
  font-size: var(--text-sm);
  font-weight: var(--weight-bold);
}

/* ---------- row ---------- */
.service-row {
  display: grid;
  grid-template-columns: 104px minmax(0, 1fr);
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-xs);
  cursor: pointer;
  transition: transform var(--dur-fast) var(--ease-spring);
}

.service-row:active {
  transform: scale(0.98);
}

.service-row__media {
  overflow: hidden;
  border-radius: var(--radius-md);
  aspect-ratio: 1;
  background: var(--color-surface-warm);
}

.service-row__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.service-row__body {
  display: grid;
  align-content: space-between;
  gap: 3px;
  min-width: 0;
}

.service-row__head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.service-row__title {
  font-size: var(--text-body);
  font-weight: var(--weight-semibold);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.service-row__badge {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: var(--color-coral-soft);
  color: var(--color-coral);
  font-size: var(--text-2xs);
  font-weight: var(--weight-bold);
}

.service-row__tagline {
  color: var(--color-text-mute);
  font-size: var(--text-xs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.service-row__meta {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--color-text-tint);
  font-size: var(--text-xs);
}

.service-row__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.service-row__cta {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 6px 12px;
  border-radius: var(--radius-full);
  background: var(--color-primary-tint);
  color: var(--color-primary-deep);
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
}
</style>
