<script setup>
defineProps({
  label: { type: String, required: true },
  required: { type: Boolean, default: false },
  error: { type: String, default: '' },
  hint: { type: String, default: '' }
})
</script>

<template>
  <label class="form-field" :class="{ 'form-field--error': error }">
    <span class="form-field__label">
      {{ label }}
      <i v-if="required" class="form-field__required">*</i>
    </span>
    <span class="form-field__control">
      <slot />
    </span>
    <span v-if="error" class="form-field__error">{{ error }}</span>
    <span v-else-if="hint" class="form-field__hint">{{ hint }}</span>
  </label>
</template>

<style scoped>
.form-field {
  display: grid;
  gap: var(--space-2);
}

.form-field__label {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  color: var(--color-text-soft);
  letter-spacing: var(--tracking-wide);
}

.form-field__required {
  color: var(--color-coral);
  font-style: normal;
}

.form-field__control :deep(input),
.form-field__control :deep(textarea),
.form-field__control :deep(select) {
  width: 100%;
  min-height: 46px;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  font-size: var(--text-body);
  transition: border-color var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out);
}

.form-field__control :deep(textarea) {
  min-height: 88px;
  resize: none;
  line-height: var(--leading-normal);
}

.form-field__control :deep(input:focus),
.form-field__control :deep(textarea:focus),
.form-field__control :deep(select:focus) {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-tint);
}

.form-field--error .form-field__control :deep(input),
.form-field--error .form-field__control :deep(textarea) {
  border-color: var(--color-danger);
}

.form-field__error {
  color: var(--color-danger);
  font-size: var(--text-xs);
}

.form-field__hint {
  color: var(--color-text-tint);
  font-size: var(--text-xs);
}
</style>
