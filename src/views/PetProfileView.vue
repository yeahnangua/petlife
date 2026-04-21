<script setup>
import { reactive, ref } from 'vue'
import PetChipSwitch from '@/components/PetChipSwitch.vue'
import { petBreeds } from '@/mocks'
import { useProfileStore } from '@/stores/profile'

const profileStore = useProfileStore()
const showForm = ref(false)

const form = reactive({
  id: '',
  name: '',
  type: 'cat',
  breed: petBreeds.cat[0],
  gender: 'male',
  age: '',
  weight: '',
  birthday: '',
  allergies: '',
  avatar: '',
  preferences: []
})

function openNewForm() {
  showForm.value = true
  Object.assign(form, {
    id: '',
    name: '',
    type: 'cat',
    breed: petBreeds.cat[0],
    gender: 'male',
    age: '',
    weight: '',
    birthday: '',
    allergies: '',
    avatar: '',
    preferences: []
  })
}

function editPet(pet) {
  showForm.value = true
  Object.assign(form, {
    ...pet,
    allergies: pet.allergies.join('、')
  })
}

function savePet() {
  profileStore.savePet({
    ...form,
    avatar: form.avatar || 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=240&q=70',
    allergies: form.allergies
      ? form.allergies.split(/[、,，]/).map((item) => item.trim()).filter(Boolean)
      : []
  })
  showForm.value = false
}
</script>

<template>
  <div class="pets page-pad page-stack">
    <section class="section-heading">
      <div>
        <p class="section-heading__meta">宠物资产</p>
        <h2 class="section-heading__title">宠物档案</h2>
      </div>
      <button type="button" class="button-secondary" @click="openNewForm">新增宠物</button>
    </section>

    <section class="page-stack">
      <article
        v-for="pet in profileStore.pets"
        :key="pet.id"
        class="pets__card surface-card"
      >
        <img :src="pet.avatar" :alt="pet.name" />
        <div class="pets__copy">
          <div class="pets__title-row">
            <div>
              <strong>{{ pet.name }}</strong>
              <p>{{ pet.breed }}</p>
            </div>
            <button type="button" class="section-link" @click="editPet(pet)">编辑</button>
          </div>
          <p>{{ pet.age }} · {{ pet.weight }}kg · {{ pet.gender === 'male' ? '公' : '母' }}</p>
          <p v-if="pet.allergies.length">过敏：{{ pet.allergies.join('、') }}</p>
        </div>
      </article>
    </section>

    <section v-if="showForm" class="pets__form surface-card">
      <div class="section-heading">
        <h2 class="section-heading__title">{{ form.id ? '编辑档案' : '新增宠物' }}</h2>
      </div>

      <label class="pets__field">
        <span>宠物昵称</span>
        <input v-model="form.name" placeholder="比如橘子、Mocha" />
      </label>

      <div class="pets__field">
        <span>宠物类型</span>
        <PetChipSwitch
          v-model="form.type"
          :options="[
            { id: 'cat', label: '猫咪' },
            { id: 'dog', label: '狗狗' }
          ]"
        />
      </div>

      <label class="pets__field">
        <span>品种</span>
        <select v-model="form.breed">
          <option v-for="breed in petBreeds[form.type]" :key="breed" :value="breed">{{ breed }}</option>
        </select>
      </label>

      <div class="pets__double">
        <label class="pets__field">
          <span>年龄</span>
          <input v-model="form.age" placeholder="如 2岁 3月" />
        </label>
        <label class="pets__field">
          <span>体重</span>
          <input v-model="form.weight" placeholder="kg" />
        </label>
      </div>

      <label class="pets__field">
        <span>生日</span>
        <input v-model="form.birthday" type="date" />
      </label>

      <label class="pets__field">
        <span>过敏信息</span>
        <input v-model="form.allergies" placeholder="用逗号分隔，如 牛肉, 谷物" />
      </label>

      <div class="pets__actions">
        <button type="button" class="button-secondary" @click="showForm = false">取消</button>
        <button type="button" class="button-primary" :disabled="!form.name" @click="savePet">保存档案</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.pets {
  padding-bottom: var(--space-6);
}

.pets__card,
.pets__form {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4);
}

.pets__card {
  grid-template-columns: 88px minmax(0, 1fr);
}

.pets__card img {
  width: 88px;
  height: 88px;
  border-radius: var(--radius-xl);
  object-fit: cover;
}

.pets__copy {
  display: grid;
  gap: 8px;
}

.pets__copy p {
  color: var(--color-text-soft);
  font-size: var(--text-sm);
}

.pets__title-row {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: var(--space-3);
}

.pets__field {
  display: grid;
  gap: var(--space-2);
}

.pets__field input,
.pets__field select {
  width: 100%;
  min-height: 44px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-lg);
  background: var(--color-surface-soft);
}

.pets__double {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.pets__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.section-link {
  color: var(--color-primary-deep);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
}
</style>
