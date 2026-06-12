import { reactive } from 'vue'

let seed = 0

const state = reactive({
  toasts: []
})

function dismiss(id) {
  const index = state.toasts.findIndex((item) => item.id === id)
  if (index >= 0) {
    state.toasts.splice(index, 1)
  }
}

function toast(message, type = 'info', duration = 2200) {
  const id = ++seed
  state.toasts.push({ id, message, type })
  window.setTimeout(() => dismiss(id), duration)
  return id
}

export function useToast() {
  return {
    state,
    toast,
    success: (message) => toast(message, 'success'),
    error: (message) => toast(message, 'error'),
    dismiss
  }
}
