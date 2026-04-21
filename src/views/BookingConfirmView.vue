<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import EmptyState from '@/components/EmptyState.vue'
import { formatCurrency } from '@/lib/pricing'
import { useBookingStore } from '@/stores/booking'
import { useProfileStore } from '@/stores/profile'

const router = useRouter()
const bookingStore = useBookingStore()
const profileStore = useProfileStore()

onMounted(async () => {
  await profileStore.fetchPets()

  if (bookingStore.serviceId && !bookingStore.timeSlots.length) {
    await bookingStore.fetchSlots()
  }
})

const currentService = computed(() => bookingStore.currentService)
const availablePets = computed(() => profileStore.pets)
const selectedPet = computed(() => availablePets.value.find((pet) => pet.id === bookingStore.petId) ?? null)
const selectedStore = computed(() => bookingStore.storeOptions.find((item) => item.id === bookingStore.storeId) ?? null)

async function submitBooking() {
  const booking = await bookingStore.submitBooking()
  router.push(`/bookings/${booking.id}`)
}
</script>

<template>
  <div class="booking page-pad page-stack page-with-submit-bar">
    <template v-if="!availablePets.length">
      <EmptyState
        title="先创建宠物档案"
        description="服务预约需要关联具体宠物，补一份档案后就能继续。"
        action-label="去新增档案"
        @action="router.push('/pets')"
      />
    </template>

    <template v-else-if="currentService">
      <section class="surface-card booking__card">
        <div class="section-heading">
          <h2 class="section-heading__title">预约服务</h2>
        </div>
        <article class="booking__service">
          <img :src="currentService.cover" :alt="currentService.title" />
          <div>
            <strong>{{ currentService.title }}</strong>
            <p>{{ currentService.duration }} 分钟 · {{ formatCurrency(currentService.memberPrice ?? currentService.price) }}</p>
          </div>
        </article>
      </section>

      <section class="surface-card booking__card">
        <div class="section-heading">
          <h2 class="section-heading__title">选择宠物</h2>
        </div>
        <div class="booking__pet-grid">
          <button
            v-for="pet in availablePets"
            :key="pet.id"
            type="button"
            class="booking__pet"
            :class="{ 'is-active': bookingStore.petId === pet.id }"
            @click="bookingStore.setPet(pet.id)"
          >
            <img :src="pet.avatar" :alt="pet.name" />
            <span>{{ pet.name }}</span>
          </button>
        </div>
      </section>

      <section class="surface-card booking__card">
        <div class="section-heading">
          <h2 class="section-heading__title">门店与时间</h2>
        </div>

        <div class="booking__options">
          <button
            v-for="store in bookingStore.storeOptions"
            :key="store.id"
            type="button"
            class="booking__option"
            :class="{ 'is-active': bookingStore.storeId === store.id }"
            @click="bookingStore.setStore(store.id)"
          >
            <strong>{{ store.name }}</strong>
            <p>{{ store.address }}</p>
          </button>
        </div>

        <div class="booking__chips">
          <button
            v-for="date in bookingStore.dateOptions"
            :key="date.date"
            type="button"
            class="booking__chip"
            :class="{ 'is-active': bookingStore.date === date.date }"
            @click="bookingStore.setDate(date.date)"
          >
            {{ date.label }} · {{ date.weekday }}
          </button>
        </div>

        <div class="booking__chips">
          <button
            v-for="slot in bookingStore.timeSlots"
            :key="slot.id"
            type="button"
            class="booking__chip"
            :class="{ 'is-active': bookingStore.slotId === slot.id, 'is-disabled': !slot.available }"
            :disabled="!slot.available"
            @click="bookingStore.setSlot(slot.id)"
          >
            {{ slot.label }}
          </button>
        </div>
      </section>

      <section class="surface-card booking__card">
        <div class="section-heading">
          <h2 class="section-heading__title">备注信息</h2>
        </div>
        <p v-if="bookingStore.error" class="booking__error">{{ bookingStore.error }}</p>
        <label class="booking__field">
          <span>联系电话</span>
          <input v-model="bookingStore.phone" placeholder="填写门店联系号码" />
        </label>
        <label class="booking__field">
          <span>预约备注</span>
          <textarea v-model="bookingStore.note" rows="3" placeholder="比如怕生、对牛肉过敏、需要提前电话联系" />
        </label>
      </section>

      <section class="booking__submit page-submit-bar surface-card">
        <div>
          <p class="section-heading__meta">{{ selectedPet?.name }} · {{ selectedStore?.name }}</p>
          <h2 class="section-heading__title">{{ formatCurrency(currentService.memberPrice ?? currentService.price) }}</h2>
        </div>
        <button
          type="button"
          class="button-primary"
          :disabled="!bookingStore.isReady || bookingStore.submitting"
          @click="submitBooking"
        >
          {{ bookingStore.submitting ? '提交中...' : '提交预约' }}
        </button>
      </section>
    </template>

    <EmptyState
      v-else
      icon="calendar"
      title="先从服务详情发起预约"
      description="当前没有待确认的服务预约，回服务页重新选择即可。"
      action-label="去服务页"
      @action="router.push('/service')"
    />
  </div>
</template>

<style scoped>
.booking__card,
.booking__submit {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4);
}

.booking__service {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: var(--space-3);
}

.booking__service img,
.booking__pet img {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-lg);
  object-fit: cover;
}

.booking__service p,
.booking__option p {
  color: var(--color-text-soft);
  font-size: var(--text-sm);
}

.booking__pet-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
}

.booking__pet {
  display: grid;
  justify-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  background: var(--color-surface-soft);
}

.booking__pet.is-active,
.booking__option.is-active,
.booking__chip.is-active {
  outline: 1px solid var(--color-primary);
  background: var(--color-primary-tint);
}

.booking__options,
.booking__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.booking__option {
  display: grid;
  gap: 6px;
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  background: var(--color-surface-soft);
}

.booking__chip {
  min-height: 36px;
  padding: 0 var(--space-4);
  border-radius: var(--radius-full);
  background: var(--color-surface-soft);
  color: var(--color-text-soft);
}

.booking__chip.is-disabled {
  color: var(--color-text-tint);
}

.booking__field {
  display: grid;
  gap: var(--space-2);
}

.booking__field input,
.booking__field textarea {
  width: 100%;
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  background: var(--color-surface-soft);
}

.booking__error {
  color: var(--color-coral);
}

.booking__submit {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}
</style>
