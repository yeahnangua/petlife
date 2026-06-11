<script setup>
import { watch } from 'vue'
import IconSvg from './IconSvg.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' }
})

const emit = defineEmits(['close'])

watch(
  () => props.open,
  (value) => {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = value ? 'hidden' : ''
    }
  }
)
</script>

<template>
  <teleport to="body">
    <transition name="sheet">
      <div v-if="open" class="sheet" @click.self="emit('close')">
        <div class="sheet__panel" role="dialog" :aria-label="title || '选择面板'">
          <i class="sheet__grabber" />
          <header v-if="title" class="sheet__head">
            <h3 class="sheet__title font-display">{{ title }}</h3>
            <button type="button" class="sheet__close" aria-label="关闭" @click="emit('close')">
              <IconSvg name="close" :size="16" :stroke="2.2" />
            </button>
          </header>
          <div class="sheet__body">
            <slot />
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<style scoped>
.sheet {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(35, 33, 28, 0.42);
  backdrop-filter: blur(3px);
}

.sheet__panel {
  width: 100%;
  max-width: var(--mobile-max);
  max-height: 78dvh;
  display: flex;
  flex-direction: column;
  padding: var(--space-2) var(--space-5) calc(var(--space-5) + var(--safe-bottom));
  border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
  background: var(--color-surface);
  box-shadow: var(--shadow-lg);
}

.sheet__grabber {
  width: 40px;
  height: 4px;
  margin: var(--space-2) auto var(--space-3);
  border-radius: var(--radius-full);
  background: var(--color-border);
}

.sheet__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.sheet__title {
  font-size: var(--text-xl);
  font-weight: var(--weight-semibold);
}

.sheet__close {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: var(--radius-full);
  background: var(--color-surface-warm);
  color: var(--color-text-soft);
}

.sheet__body {
  overflow-y: auto;
  overscroll-behavior: contain;
}

.sheet-enter-active,
.sheet-leave-active {
  transition: opacity var(--dur-base) var(--ease-out);
}

.sheet-enter-active .sheet__panel {
  transition: transform var(--dur-slow) var(--ease-spring);
}

.sheet-leave-active .sheet__panel {
  transition: transform var(--dur-base) var(--ease-in-out);
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-from .sheet__panel,
.sheet-leave-to .sheet__panel {
  transform: translateY(100%);
}
</style>
