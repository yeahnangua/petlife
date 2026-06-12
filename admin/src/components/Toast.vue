<script setup>
import { useToast } from '@/composables/useToast'
import IconSvg from './IconSvg.vue'

const { state } = useToast()

const ICONS = {
  info: 'info',
  success: 'check',
  error: 'close'
}
</script>

<template>
  <teleport to="body">
    <div class="toast-stack" aria-live="polite">
      <transition-group name="toast">
        <div v-for="item in state.toasts" :key="item.id" class="toast" :class="`toast--${item.type}`">
          <span class="toast__icon">
            <IconSvg :name="ICONS[item.type] || 'info'" :size="13" :stroke="2.4" />
          </span>
          {{ item.message }}
        </div>
      </transition-group>
    </div>
  </teleport>
</template>

<style scoped>
.toast-stack {
  position: fixed;
  top: calc(var(--safe-top) + 18px);
  left: 50%;
  transform: translateX(-50%);
  z-index: var(--z-toast);
  display: grid;
  justify-items: center;
  gap: var(--space-2);
  width: min(calc(100vw - 48px), 340px);
  pointer-events: none;
}

.toast {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  max-width: 100%;
  padding: 10px var(--space-4);
  border-radius: var(--radius-full);
  background: rgba(35, 33, 28, 0.92);
  color: var(--color-text-invert);
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(8px);
}

.toast__icon {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: var(--radius-full);
  background: rgba(247, 244, 236, 0.18);
  flex-shrink: 0;
}

.toast--success .toast__icon {
  background: var(--color-success);
}

.toast--error .toast__icon {
  background: var(--color-danger);
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-spring);
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-12px) scale(0.95);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
}
</style>
