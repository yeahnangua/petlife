<script setup>
import IconSvg from './IconSvg.vue'

defineProps({
  pet: { type: Object, required: true },
  active: { type: Boolean, default: false },
  editable: { type: Boolean, default: false }
})

defineEmits(['select', 'edit'])
</script>

<template>
  <article
    class="pet-card"
    :class="{ 'pet-card--active': active }"
    @click="$emit('select', pet.id)"
  >
    <div class="pet-card__avatar" :style="{ background: pet.avatar ? 'transparent' : (pet.color || '#D9714E') }">
      <img v-if="pet.avatar" :src="pet.avatar" :alt="pet.name" loading="lazy" />
      <IconSvg v-else name="paw" :size="24" :stroke="1.8" />
    </div>
    <div class="pet-card__info">
      <p class="pet-card__name">
        {{ pet.name }}
        <IconSvg :name="pet.gender === 'male' ? 'male' : 'female'" :size="13" :stroke="2" class="pet-card__gender" :class="`pet-card__gender--${pet.gender}`" />
      </p>
      <p class="pet-card__meta">
        {{ pet.breed }}
        <template v-if="pet.age"> · {{ pet.age }}</template>
        <template v-if="pet.weight"> · {{ pet.weight }}kg</template>
      </p>
      <p v-if="pet.neutered" class="pet-card__tag">已绝育</p>
    </div>
    <button v-if="editable" type="button" class="pet-card__edit" aria-label="编辑档案" @click.stop="$emit('edit', pet)">
      <IconSvg name="edit" :size="15" :stroke="1.8" />
    </button>
    <span v-else-if="active" class="pet-card__check">
      <IconSvg name="check" :size="13" :stroke="2.6" />
    </span>
  </article>
</template>

<style scoped>
.pet-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: 1.5px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  cursor: pointer;
  transition: border-color var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out), transform var(--dur-fast) var(--ease-spring);
}

.pet-card:active {
  transform: scale(0.97);
}

.pet-card--active {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-tint);
}

.pet-card__avatar {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: var(--radius-full);
  overflow: hidden;
  color: rgba(255, 255, 255, 0.9);
  flex-shrink: 0;
}

.pet-card__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pet-card__info {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.pet-card__name {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-body);
  font-weight: var(--weight-semibold);
}

.pet-card__gender--male {
  color: var(--color-sky);
}

.pet-card__gender--female {
  color: var(--color-coral);
}

.pet-card__meta {
  color: var(--color-text-mute);
  font-size: var(--text-xs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pet-card__tag {
  justify-self: start;
  padding: 1px 8px;
  border-radius: var(--radius-full);
  background: var(--color-primary-tint);
  color: var(--color-primary);
  font-size: var(--text-2xs);
  font-weight: var(--weight-semibold);
}

.pet-card__edit {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  margin-left: auto;
  border-radius: var(--radius-full);
  background: var(--color-surface-warm);
  color: var(--color-text-soft);
  flex-shrink: 0;
}

.pet-card__check {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  margin-left: auto;
  border-radius: var(--radius-full);
  background: var(--color-primary-deep);
  color: var(--color-text-invert);
  flex-shrink: 0;
}
</style>
