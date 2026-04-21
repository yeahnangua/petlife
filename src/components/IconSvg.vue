<script setup>
/**
 * 统一图标系统 · 线性圆角风格
 * 所有图标 24x24 viewBox, stroke-based, 便于统一调色调细.
 *
 * Usage:
 *   <IconSvg name="search" :size="20" />
 */
const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 22 },
  stroke: { type: [Number, String], default: 1.7 },
  color: { type: String, default: 'currentColor' }
})
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    :stroke="color"
    :stroke-width="stroke"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="icon-svg"
    aria-hidden="true"
  >
    <!-- search -->
    <template v-if="name === 'search'">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-3.5-3.5" />
    </template>

    <!-- close / x -->
    <template v-else-if="name === 'close'">
      <path d="M6 6l12 12M18 6L6 18" />
    </template>

    <!-- back arrow -->
    <template v-else-if="name === 'back'">
      <path d="M15 5l-7 7 7 7" />
    </template>

    <!-- chevron right -->
    <template v-else-if="name === 'arrow-right'">
      <path d="M9 5l7 7-7 7" />
    </template>

    <!-- chevron down -->
    <template v-else-if="name === 'arrow-down'">
      <path d="M5 9l7 7 7-7" />
    </template>

    <!-- plus -->
    <template v-else-if="name === 'plus'">
      <path d="M12 5v14M5 12h14" />
    </template>

    <!-- minus -->
    <template v-else-if="name === 'minus'">
      <path d="M5 12h14" />
    </template>

    <!-- home -->
    <template v-else-if="name === 'home'">
      <path d="M4 11.5L12 4l8 7.5V20a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-8.5z" />
    </template>

    <!-- category / grid -->
    <template v-else-if="name === 'category'">
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </template>

    <!-- service / sparkle -->
    <template v-else-if="name === 'service'">
      <path d="M12 3l1.8 4.5L18 9l-4.2 1.5L12 15l-1.8-4.5L6 9l4.2-1.5L12 3z" />
      <path d="M18 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z" />
    </template>

    <!-- order / receipt -->
    <template v-else-if="name === 'order'">
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </template>

    <!-- user -->
    <template v-else-if="name === 'user'">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1-4 4-6 8-6s7 2 8 6" />
    </template>

    <!-- cart -->
    <template v-else-if="name === 'cart'">
      <path d="M3 4h3l2 12h11l2-8H7" />
      <circle cx="9.5" cy="20" r="1.2" />
      <circle cx="17.5" cy="20" r="1.2" />
    </template>

    <!-- heart -->
    <template v-else-if="name === 'heart'">
      <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />
    </template>

    <!-- bell -->
    <template v-else-if="name === 'bell'">
      <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </template>

    <!-- gift -->
    <template v-else-if="name === 'gift'">
      <rect x="3" y="8" width="18" height="12" rx="1.5" />
      <path d="M3 12h18M12 8v12" />
      <path d="M8 8a2.5 2.5 0 0 1 0-5c2 0 4 2 4 5M16 8a2.5 2.5 0 0 0 0-5c-2 0-4 2-4 5" />
    </template>

    <!-- coupon / ticket -->
    <template v-else-if="name === 'coupon'">
      <path d="M3 8a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v3a2 2 0 0 0 0 4v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a2 2 0 0 0 0-4V8z" />
      <path d="M9 7v10" stroke-dasharray="2 2" />
    </template>

    <!-- star -->
    <template v-else-if="name === 'star'">
      <path d="M12 3.5l2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6L3.3 9.9l6-.9L12 3.5z" />
    </template>

    <!-- paw -->
    <template v-else-if="name === 'paw'">
      <circle cx="7" cy="8" r="1.6" />
      <circle cx="12" cy="5.5" r="1.6" />
      <circle cx="17" cy="8" r="1.6" />
      <circle cx="19" cy="13" r="1.4" />
      <circle cx="5" cy="13" r="1.4" />
      <path d="M8 19c0-3 1.8-5 4-5s4 2 4 5c0 2-1.8 2-4 2s-4 0-4-2z" />
    </template>

    <!-- leaf -->
    <template v-else-if="name === 'leaf'">
      <path d="M5 19c0-7 5-13 15-14-1 10-7 15-14 15l-1-1zM5 19l7-7" />
    </template>

    <!-- bowl -->
    <template v-else-if="name === 'bowl'">
      <path d="M4 11h16l-1.5 6a2 2 0 0 1-2 1.5h-9a2 2 0 0 1-2-1.5L4 11z" />
      <path d="M8 11c0-3 2-5 4-5s4 2 4 5" />
    </template>

    <!-- bone -->
    <template v-else-if="name === 'bone'">
      <path d="M6.5 5.5a2.5 2.5 0 0 1 4 2l6 6a2.5 2.5 0 1 1-2 2l-6-6a2.5 2.5 0 1 1-2-4z" />
    </template>

    <!-- ball -->
    <template v-else-if="name === 'ball'">
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12c4 0 8 3.5 8 8M20 12c-4 0-8 3.5-8 8M12 4c0 4-3.5 8-8 8M12 4c0 4 3.5 8 8 8" />
    </template>

    <!-- drop -->
    <template v-else-if="name === 'drop'">
      <path d="M12 3s-6 7-6 11a6 6 0 0 0 12 0c0-4-6-11-6-11z" />
    </template>

    <!-- granule -->
    <template v-else-if="name === 'granule'">
      <circle cx="7" cy="8" r="1.5" />
      <circle cx="12" cy="6" r="1.5" />
      <circle cx="17" cy="9" r="1.5" />
      <circle cx="8" cy="14" r="1.5" />
      <circle cx="14" cy="13" r="1.5" />
      <circle cx="11" cy="18" r="1.5" />
      <circle cx="18" cy="17" r="1.5" />
    </template>

    <!-- bath -->
    <template v-else-if="name === 'bath'">
      <path d="M4 12h16v3a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-3z" />
      <path d="M8 12V6a2 2 0 0 1 4 0M5 20l-1 1M20 20l-1 1" />
    </template>

    <!-- scissor -->
    <template v-else-if="name === 'scissor'">
      <circle cx="6.5" cy="17.5" r="2.5" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <path d="M9 15l11-10M9 9l11 10" />
    </template>

    <!-- box -->
    <template v-else-if="name === 'box'">
      <path d="M3 7.5l9-4 9 4v9l-9 4-9-4v-9z" />
      <path d="M3 7.5l9 4 9-4M12 11.5V20" />
    </template>

    <!-- calendar -->
    <template v-else-if="name === 'calendar'">
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </template>

    <!-- clock -->
    <template v-else-if="name === 'clock'">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4.5l3 1.8" />
    </template>

    <!-- location -->
    <template v-else-if="name === 'location'">
      <path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </template>

    <!-- chat -->
    <template v-else-if="name === 'chat'">
      <path d="M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-8l-4 4v-4H5a1 1 0 0 1-1-1V5z" />
    </template>

    <!-- setting -->
    <template v-else-if="name === 'setting'">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.5 12c0 .5-.1 1-.2 1.4l2 1.5-2 3.4-2.3-1a7 7 0 0 1-2.5 1.4l-.3 2.3h-4l-.3-2.3a7 7 0 0 1-2.5-1.4l-2.3 1-2-3.4 2-1.5a8 8 0 0 1 0-2.8l-2-1.5 2-3.4 2.3 1a7 7 0 0 1 2.5-1.4l.3-2.3h4l.3 2.3a7 7 0 0 1 2.5 1.4l2.3-1 2 3.4-2 1.5c.1.4.2.9.2 1.4z" />
    </template>

    <!-- check -->
    <template v-else-if="name === 'check'">
      <path d="M5 12l5 5 9-11" />
    </template>

    <!-- filter -->
    <template v-else-if="name === 'filter'">
      <path d="M4 5h16l-6 8v6l-4-2v-4L4 5z" />
    </template>

    <!-- price tag -->
    <template v-else-if="name === 'price'">
      <path d="M3 3h8l10 10-8 8L3 11V3z" />
      <circle cx="8" cy="8" r="1.5" />
    </template>

    <!-- info -->
    <template v-else-if="name === 'info'">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8h.01M11 12h1v5h1" />
    </template>

    <!-- camera -->
    <template v-else-if="name === 'camera'">
      <path d="M4 8a1.5 1.5 0 0 1 1.5-1.5h2L9 4h6l1.5 2.5h2A1.5 1.5 0 0 1 20 8v10a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18V8z" />
      <circle cx="12" cy="13" r="3.5" />
    </template>

    <!-- edit -->
    <template v-else-if="name === 'edit'">
      <path d="M4 20l4-1 11-11-3-3L5 16l-1 4z" />
    </template>

    <!-- sparkle -->
    <template v-else-if="name === 'sparkle'">
      <path d="M12 4l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5L12 4zM19 14l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z" />
    </template>

    <!-- male -->
    <template v-else-if="name === 'male'">
      <circle cx="10" cy="14" r="5" />
      <path d="M14 10l5-5M15 5h4v4" />
    </template>

    <!-- female -->
    <template v-else-if="name === 'female'">
      <circle cx="12" cy="10" r="5" />
      <path d="M12 15v6M9 19h6" />
    </template>

    <!-- default fallback -->
    <template v-else>
      <circle cx="12" cy="12" r="4" />
    </template>
  </svg>
</template>

<style scoped>
.icon-svg {
  display: inline-block;
  flex-shrink: 0;
  vertical-align: middle;
}
</style>
