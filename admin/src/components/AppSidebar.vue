<script setup>
const menuItems = [
  { label: '概览', to: '/' },
  { label: '分类', to: '/categories' },
  { label: '商品', to: '/products' },
  { label: '服务', to: '/services' },
  { label: '门店', to: '/stores' },
  { label: '时段', to: '/time-slots' },
  { label: '订单', to: '/orders' },
  { label: '预约', to: '/bookings' }
]
</script>

<template>
  <aside class="app-sidebar">
    <div class="app-sidebar__brand">
      <p>PetLife</p>
      <strong>Admin</strong>
    </div>
    <nav class="app-sidebar__nav">
      <RouterLink
        v-for="item in menuItems"
        :key="item.to"
        :to="item.to"
        class="app-sidebar__link"
        exact-active-class="is-active"
      >
        {{ item.label }}
      </RouterLink>
    </nav>
  </aside>
</template>

<style scoped>
.app-sidebar {
  align-self: start;
  align-content: start;
  display: grid;
  gap: 24px;
  padding: 24px 20px;
  border-radius: 28px;
  background: #29211b;
  color: #fff8f0;
}

.app-sidebar__brand p {
  color: #d8bda4;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.app-sidebar__brand strong {
  font-size: 28px;
}

.app-sidebar__nav {
  display: grid;
  align-content: start;
  gap: 8px;
}

.app-sidebar__link {
  display: block;
  padding: 12px 14px;
  border-radius: 14px;
  color: inherit;
  line-height: 1.2;
  text-decoration: none;
}

.app-sidebar__link.is-active {
  background: rgba(255, 248, 240, 0.14);
}
</style>
