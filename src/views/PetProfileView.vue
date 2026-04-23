<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import ImageUploadField from '@/components/ImageUploadField.vue'
import PetChipSwitch from '@/components/PetChipSwitch.vue'
import { petBreeds } from '@/content/pets'
import { useProfileStore } from '@/stores/profile'

const profileStore = useProfileStore()
const showForm = ref(false)
const formError = ref('')
const petColorOptions = ['#D97757', '#B58463', '#8AA3B4', '#6A8572', '#D4A44C', '#C26553']

function getDefaultPetColor(type = 'cat') {
  return type === 'dog' ? '#B58463' : '#D97757'
}

const form = reactive({
  id: '',
  name: '',
  type: 'cat',
  breed: petBreeds.cat[0],
  gender: 'male',
  weight: '',
  birthday: '',
  allergies: '',
  preferences: '',
  avatar: '',
  color: '',
  neutered: false
})

onMounted(() => {
  profileStore.fetchPets()
})

watch(
  () => form.type,
  (type) => {
    if (!petBreeds[type].includes(form.breed)) {
      form.breed = petBreeds[type][0]
    }
  }
)

function openNewForm() {
  showForm.value = true
  formError.value = ''
  Object.assign(form, {
    id: '',
    name: '',
    type: 'cat',
    breed: petBreeds.cat[0],
    gender: 'male',
    weight: '',
    birthday: '',
    allergies: '',
    preferences: '',
    avatar: '',
    color: getDefaultPetColor('cat'),
    neutered: false
  })
}

function editPet(pet) {
  showForm.value = true
  formError.value = ''
  Object.assign(form, {
    ...pet,
    allergies: pet.allergies.join('、'),
    preferences: pet.preferences.join('、'),
    avatar: pet.avatar,
    color: pet.color || getDefaultPetColor(pet.type),
    neutered: Boolean(pet.neutered)
  })
}

async function savePet() {
  formError.value = ''

  try {
    await profileStore.savePet({
      ...form,
      avatar:
        form.avatar || 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=240&q=70',
      color: form.color || getDefaultPetColor(form.type),
      allergies: form.allergies
        ? form.allergies.split(/[、,，]/).map((item) => item.trim()).filter(Boolean)
        : [],
      preferences: form.preferences
        ? form.preferences.split(/[、,，]/).map((item) => item.trim()).filter(Boolean)
        : []
    })
    showForm.value = false
  } catch (requestError) {
    formError.value = requestError instanceof Error ? requestError.message : '保存档案失败'
  }
}

async function removePet(id) {
  try {
    await profileStore.deletePet(id)
  } catch {
    formError.value = profileStore.error || '删除宠物失败'
  }
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

    <div v-if="profileStore.loading" class="surface-card pets__state">正在加载宠物档案...</div>

    <section v-else class="page-stack">
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
            <div class="pets__inline-actions">
              <button type="button" class="section-link" @click="editPet(pet)">编辑</button>
              <button type="button" class="section-link" @click="removePet(pet.id)">删除</button>
            </div>
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

      <ImageUploadField v-model="form.avatar" label="宠物头像" />

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

      <div class="pets__field">
        <span>宠物性别</span>
        <PetChipSwitch
          v-model="form.gender"
          :options="[
            { id: 'male', label: '男孩子' },
            { id: 'female', label: '女孩子' }
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
          <span>体重</span>
          <input v-model="form.weight" placeholder="kg" />
        </label>
        <div class="pets__field">
          <span>绝育状态</span>
          <PetChipSwitch
            v-model="form.neutered"
            :options="[
              { id: false, label: '未绝育' },
              { id: true, label: '已绝育' }
            ]"
          />
        </div>
      </div>

      <label class="pets__field">
        <span>生日</span>
        <input v-model="form.birthday" type="date" />
      </label>

      <label class="pets__field">
        <span>毛色标记</span>
        <div class="pets__color-picker">
          <div class="pets__color-swatches">
            <button
              v-for="color in petColorOptions"
              :key="color"
              type="button"
              class="pets__color-swatch"
              :class="{ 'is-active': form.color === color }"
              :style="{ backgroundColor: color }"
              @click="form.color = color"
            >
              <span class="sr-only">{{ color }}</span>
            </button>
          </div>
          <div class="pets__color-custom">
            <input v-model="form.color" type="color" />
            <span>{{ form.color }}</span>
          </div>
        </div>
      </label>

      <label class="pets__field">
        <span>过敏信息</span>
        <input v-model="form.allergies" placeholder="用逗号分隔，如 牛肉, 谷物" />
      </label>

      <label class="pets__field">
        <span>偏好服务</span>
        <input v-model="form.preferences" placeholder="用逗号分隔，如 洗护清洁, 驱虫护理" />
      </label>

      <p v-if="formError" class="pets__error">{{ formError }}</p>

      <div class="pets__actions">
        <button type="button" class="button-secondary" @click="showForm = false">取消</button>
        <button type="button" class="button-primary" :disabled="profileStore.saving || !form.name" @click="savePet">
          {{ profileStore.saving ? '保存中...' : '保存档案' }}
        </button>
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

.pets__inline-actions {
  display: inline-flex;
  gap: var(--space-2);
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

.pets__color-picker {
  display: grid;
  gap: var(--space-3);
}

.pets__color-swatches {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.pets__color-swatch {
  width: 32px;
  height: 32px;
  border: 2px solid rgba(255, 255, 255, 0.7);
  border-radius: 999px;
  box-shadow: var(--shadow-sm);
}

.pets__color-swatch.is-active {
  outline: 2px solid var(--color-primary-deep);
  outline-offset: 2px;
}

.pets__color-custom {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--color-text-soft);
  font-size: var(--text-sm);
}

.pets__color-custom input {
  width: 44px;
  min-width: 44px;
  height: 44px;
  padding: 0;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.pets__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.pets__state,
.pets__error {
  color: var(--color-text-soft);
}

.pets__state {
  padding: var(--space-5);
  text-align: center;
}

.pets__error {
  color: var(--color-coral);
}

.section-link {
  color: var(--color-primary-deep);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
}

@media (max-width: 640px) {
  .pets__double {
    grid-template-columns: 1fr;
  }
}
</style>
