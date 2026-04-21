<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ServiceCard from '@/components/ServiceCard.vue'
import PetChipSwitch from '@/components/PetChipSwitch.vue'
import IconSvg from '@/components/IconSvg.vue'
import { serviceCategories, services } from '@/mocks'
import { getServicesByPetType } from '@/lib/catalog'
import { useProfileStore } from '@/stores/profile'

const route = useRoute()
const router = useRouter()
const profileStore = useProfileStore()

const activePet = computed({
  get: () => route.query.pet || profileStore.activePetType,
  set: (value) => {
    profileStore.setPetType(value)
    router.replace({ path: '/service', query: { ...route.query, pet: value } })
  }
})

const activeCategory = computed({
  get: () => route.query.category || '',
  set: (value) => router.replace({ path: '/service', query: { ...route.query, category: value } })
})

const filteredServices = computed(() => {
  const byPet = getServicesByPetType(services, activePet.value)
  return activeCategory.value
    ? byPet.filter((item) => item.category === activeCategory.value)
    : byPet
})
</script>

<template>
  <div class="service page-pad page-stack">
    <section class="service__hero surface-card">
      <div>
        <p class="section-heading__meta">门店服务</p>
        <h2 class="section-heading__title">洗护、美容、护理和寄养都可以线上预约</h2>
        <p class="service__hero-copy">
          服务不混入购物车，直接预约到时间、门店和宠物档案，更贴近真实业务链路。
        </p>
      </div>
      <PetChipSwitch v-model="activePet" />
    </section>

    <section class="surface-card service__categories">
      <button
        type="button"
        class="service__category"
        :class="{ 'is-active': !activeCategory }"
        @click="activeCategory = ''"
      >
        <IconSvg name="service" :size="18" />
        全部
      </button>
      <button
        v-for="item in serviceCategories"
        :key="item.id"
        type="button"
        class="service__category"
        :class="{ 'is-active': activeCategory === item.id }"
        @click="activeCategory = item.id"
      >
        <IconSvg :name="item.icon" :size="18" />
        {{ item.label }}
      </button>
    </section>

    <section class="page-stack">
      <ServiceCard
        v-for="serviceItem in filteredServices"
        :key="serviceItem.id"
        :service="serviceItem"
      />
    </section>
  </div>
</template>

<style scoped>
.service {
  padding-bottom: var(--space-6);
}

.service__hero {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-5);
  background:
    radial-gradient(circle at top right, rgba(106, 133, 114, 0.18), transparent 32%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.82), rgba(242, 234, 219, 0.86));
}

.service__hero-copy {
  color: var(--color-text-soft);
}

.service__categories {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding: var(--space-3);
}

.service__category {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-full);
  background: var(--color-surface-soft);
  color: var(--color-text-soft);
  font-size: var(--text-sm);
}

.service__category.is-active {
  background: var(--color-primary-deep);
  color: var(--color-text-invert);
}
</style>
