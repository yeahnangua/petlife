<script setup>
import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
</script>

<template>
  <div class="admin-layout">
    <AppSidebar />
    <div class="admin-layout__main">
      <AppHeader />
      <main class="admin-layout__content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 20px;
  padding: 20px;
  background: #f5efe7;
}

.admin-layout__main {
  display: grid;
  gap: 20px;
}

.admin-layout__content {
  padding: 24px;
  border-radius: 28px;
  background: #fffdfa;
}

@media (max-width: 900px) {
  .admin-layout {
    grid-template-columns: 1fr;
  }
}
</style>
