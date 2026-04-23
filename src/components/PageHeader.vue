<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import IconSvg from './IconSvg.vue'

const props = defineProps({
  title: {
    type: String,
    default: ''
  }
})

const route = useRoute()
const router = useRouter()

const isTabPage = computed(() => Boolean(route.meta.tab))
const title = computed(() => props.title || route.meta.title || 'PetLife')
const backTarget = computed(() => {
  if (typeof route.query.backTo === 'string' && route.query.backTo.startsWith('/')) {
    return route.query.backTo
  }

  if (typeof route.meta.backTo === 'string' && route.meta.backTo.startsWith('/')) {
    return route.meta.backTo
  }

  return ''
})

function goBack() {
  if (backTarget.value) {
    router.push(backTarget.value)
    return
  }

  router.back()
}
</script>

<template>
  <header class="page-header page-pad">
    <button
      v-if="!isTabPage"
      class="page-header__button"
      type="button"
      aria-label="返回"
      @click="goBack"
    >
      <IconSvg name="back" :size="18" />
    </button>
    <div v-else class="page-header__brand">
      <span class="page-header__eyebrow">PetLife</span>
      <h1 class="page-header__title font-display">{{ title }}</h1>
    </div>

    <template v-if="!isTabPage">
      <h1 class="page-header__title page-header__title--compact">{{ title }}</h1>
      <div class="page-header__spacer" />
    </template>
  </header>
</template>

<style scoped>
.page-header {
  position: sticky;
  top: 0;
  z-index: var(--z-header);
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 68px;
  padding-top: calc(var(--safe-top) + var(--space-4));
  padding-bottom: var(--space-4);
  background: linear-gradient(180deg, rgba(244, 239, 228, 0.94), rgba(244, 239, 228, 0.74), rgba(244, 239, 228, 0));
  backdrop-filter: blur(18px);
}

.page-header__brand {
  display: grid;
  gap: 2px;
}

.page-header__eyebrow {
  color: var(--color-text-mute);
  font-size: var(--text-sm);
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.page-header__title {
  font-size: var(--text-2xl);
  line-height: var(--leading-tight);
}

.page-header__title--compact {
  font-size: var(--text-lg);
  font-family: var(--font-body);
  font-weight: var(--weight-semibold);
}

.page-header__button,
.page-header__spacer {
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
}

.page-header__button {
  display: grid;
  place-items: center;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.72);
  box-shadow: var(--shadow-sm);
}
</style>
