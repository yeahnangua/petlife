<script setup>
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  desc: { type: String, default: '' },
  confirmLabel: { type: String, default: '确认' },
  danger: { type: Boolean, default: false }
})

defineEmits(['confirm', 'cancel'])
</script>

<template>
  <teleport to="body">
    <transition name="dialog">
      <div v-if="open" class="confirm" @click.self="$emit('cancel')">
        <div class="confirm__card" role="alertdialog" :aria-label="title">
          <h3 class="confirm__title font-display">{{ title }}</h3>
          <p v-if="desc" class="confirm__desc">{{ desc }}</p>
          <div class="confirm__actions">
            <button type="button" class="confirm__cancel" @click="$emit('cancel')">取消</button>
            <button
              type="button"
              class="confirm__ok"
              :class="{ 'confirm__ok--danger': danger }"
              @click="$emit('confirm')"
            >
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<style scoped>
.confirm {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: grid;
  place-items: center;
  padding: var(--space-6);
  background: rgba(35, 33, 28, 0.42);
  backdrop-filter: blur(3px);
}

.confirm__card {
  width: min(100%, 320px);
  padding: var(--space-6) var(--space-5) var(--space-5);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-lg);
  text-align: center;
}

.confirm__title {
  font-size: var(--text-xl);
  font-weight: var(--weight-semibold);
}

.confirm__desc {
  margin-top: var(--space-2);
  color: var(--color-text-soft);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

.confirm__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
  margin-top: var(--space-5);
}

.confirm__cancel,
.confirm__ok {
  min-height: 44px;
  border-radius: var(--radius-full);
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
  transition: transform var(--dur-fast) var(--ease-spring);
}

.confirm__cancel {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-soft);
}

.confirm__ok {
  background: var(--color-primary-deep);
  color: var(--color-text-invert);
}

.confirm__ok--danger {
  background: var(--color-danger);
}

.confirm__cancel:active,
.confirm__ok:active {
  transform: scale(0.96);
}

.dialog-enter-active,
.dialog-leave-active {
  transition: opacity var(--dur-base) var(--ease-out);
}

.dialog-enter-active .confirm__card,
.dialog-leave-active .confirm__card {
  transition: transform var(--dur-base) var(--ease-spring);
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from .confirm__card {
  transform: scale(0.92) translateY(10px);
}
</style>
