<script setup>
import { useRouter } from 'vue-router'
import IconSvg from './IconSvg.vue'

defineProps({
  title: { type: String, default: '' }
})

const router = useRouter()

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.replace('/')
  }
}
</script>

<template>
  <header class="top-bar">
    <button type="button" class="top-bar__back" aria-label="返回" @click="goBack">
      <IconSvg name="back" :size="20" :stroke="2" />
    </button>
    <h1 class="top-bar__title">{{ title }}</h1>
    <div class="top-bar__spacer" />
  </header>
</template>

<style scoped>
.top-bar {
  position: sticky;
  top: 0;
  z-index: var(--z-header);
  display: grid;
  grid-template-columns: 40px 1fr 40px;
  align-items: center;
  min-height: 56px;
  padding: var(--safe-top) var(--space-3) 0;
  background: color-mix(in srgb, var(--color-bg) 86%, transparent);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.top-bar__back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border-soft);
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-xs);
  transition: transform var(--dur-fast) var(--ease-spring);
}

.top-bar__back:active {
  transform: scale(0.92);
}

.top-bar__title {
  text-align: center;
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-tight);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.top-bar__spacer {
  width: 38px;
}
</style>
