import { ref } from 'vue'

export function useDragScroll() {
  const scroller = ref(null)
  const isDragging = ref(false)
  const dragStartX = ref(0)
  const dragStartScrollLeft = ref(0)
  const dragged = ref(false)
  const pointerId = ref(null)
  const hasCapturedPointer = ref(false)

  function startDrag(event) {
    if (!scroller.value) {
      return
    }

    isDragging.value = true
    dragged.value = false
    hasCapturedPointer.value = false
    pointerId.value = event.pointerId
    dragStartX.value = event.clientX
    dragStartScrollLeft.value = scroller.value.scrollLeft
  }

  function drag(event) {
    if (!isDragging.value || !scroller.value) {
      return
    }

    const distance = event.clientX - dragStartX.value
    if (Math.abs(distance) > 6) {
      if (!hasCapturedPointer.value) {
        try {
          scroller.value.setPointerCapture?.(event.pointerId)
          hasCapturedPointer.value = true
        } catch {
          hasCapturedPointer.value = false
        }
      }
      dragged.value = true
    }

    scroller.value.scrollLeft = dragStartScrollLeft.value - distance
  }

  function endDrag() {
    if (!isDragging.value) {
      return
    }

    if (
      pointerId.value !== null &&
      hasCapturedPointer.value &&
      scroller.value?.hasPointerCapture?.(pointerId.value)
    ) {
      scroller.value?.releasePointerCapture?.(pointerId.value)
    }

    isDragging.value = false
    pointerId.value = null
    hasCapturedPointer.value = false
    window.setTimeout(() => {
      dragged.value = false
    }, 0)
  }

  function blockClickAfterDrag(event) {
    if (!dragged.value) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    dragged.value = false
  }

  return {
    scroller,
    isDragging,
    startDrag,
    drag,
    endDrag,
    blockClickAfterDrag
  }
}
