<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import BottomSheet from '@/components/BottomSheet.vue'
import ChipSwitch from '@/components/ChipSwitch.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import EmptyState from '@/components/EmptyState.vue'
import FormField from '@/components/FormField.vue'
import IconSvg from '@/components/IconSvg.vue'
import ImageUploadField from '@/components/ImageUploadField.vue'
import PetCard from '@/components/PetCard.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import { petBreeds } from '@/content/pets'
import { useProfileStore } from '@/stores/profile'

const profileStore = useProfileStore()
const showForm = ref(false)
const formError = ref('')
const pendingDelete = ref(null)
const petColorOptions = ['#D97757', '#B58463', '#8AA3B4', '#6A8572', '#D4A44C', '#C26553']

const typeOptions = [
  { value: 'cat', label: '猫咪' },
  { value: 'dog', label: '狗狗' }
]
const genderOptions = [
  { value: 'male', label: '男孩子' },
  { value: 'female', label: '女孩子' }
]
const neuteredOptions = [
  { value: false, label: '未绝育' },
  { value: true, label: '已绝育' }
]

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

  if (!form.name.trim()) {
    formError.value = '先给宠物取个名字吧'
    return
  }

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
  pendingDelete.value = null

  try {
    await profileStore.deletePet(id)
  } catch {
    formError.value = profileStore.error || '删除宠物失败'
  }
}
</script>

<template>
  <div class="pets page-pad">
    <header class="pets__head">
      <div>
        <p class="pets__eyebrow">宠物资产</p>
        <h1 class="pets__title font-display">宠物档案</h1>
      </div>
      <button type="button" class="pets__add" @click="openNewForm">
        <IconSvg name="plus" :size="15" :stroke="2.4" />
        新增宠物
      </button>
    </header>

    <div v-if="profileStore.loading" class="pets__stack">
      <SkeletonBlock variant="card" />
      <SkeletonBlock variant="card" />
    </div>

    <section v-else-if="profileStore.pets.length" class="pets__stack">
      <div v-for="pet in profileStore.pets" :key="pet.id" class="pets__row">
        <PetCard
          :pet="pet"
          :active="profileStore.selectedPetId === pet.id"
          editable
          @select="profileStore.setSelectedPet(pet.id)"
          @edit="editPet(pet)"
        />
        <div class="pets__row-extra">
          <p v-if="pet.allergies.length" class="pets__allergy">
            <IconSvg name="info" :size="12" :stroke="2" />
            过敏：{{ pet.allergies.join('、') }}
          </p>
          <button type="button" class="pets__delete" @click="pendingDelete = pet">
            <IconSvg name="trash" :size="12" :stroke="2" />
            删除档案
          </button>
        </div>
      </div>
    </section>

    <EmptyState
      v-else
      icon="paw"
      title="还没有宠物档案"
      description="建一份档案，预约服务和推荐都会围绕它展开。"
      action-label="新增宠物"
      @action="openNewForm"
    />

    <p v-if="formError && !showForm" class="pets__error">{{ formError }}</p>

    <!-- 档案表单弹层 -->
    <BottomSheet :open="showForm" :title="form.id ? '编辑档案' : '新增宠物'" @close="showForm = false">
      <div class="pets__form">
        <FormField label="宠物昵称" required>
          <input v-model="form.name" placeholder="比如橘子、Mocha" />
        </FormField>

        <ImageUploadField v-model="form.avatar" label="宠物头像" hint="不传则用默认图" />

        <div class="pets__form-row">
          <span class="pets__form-label">宠物类型</span>
          <ChipSwitch v-model="form.type" :options="typeOptions" />
        </div>

        <div class="pets__form-row">
          <span class="pets__form-label">宠物性别</span>
          <ChipSwitch v-model="form.gender" :options="genderOptions" />
        </div>

        <FormField label="品种">
          <select v-model="form.breed">
            <option v-for="breed in petBreeds[form.type]" :key="breed" :value="breed">{{ breed }}</option>
          </select>
        </FormField>

        <div class="pets__form-grid">
          <FormField label="体重 (kg)">
            <input v-model="form.weight" type="number" min="0" step="0.1" placeholder="5.2" />
          </FormField>
          <div class="pets__form-row pets__form-row--col">
            <span class="pets__form-label">绝育状态</span>
            <ChipSwitch v-model="form.neutered" :options="neuteredOptions" />
          </div>
        </div>

        <FormField label="生日">
          <input v-model="form.birthday" type="date" />
        </FormField>

        <div class="pets__form-row pets__form-row--col">
          <span class="pets__form-label">毛色标记</span>
          <div class="pets__colors">
            <button
              v-for="color in petColorOptions"
              :key="color"
              type="button"
              class="pets__color"
              :class="{ 'pets__color--active': form.color === color }"
              :style="{ background: color }"
              :aria-label="`选择颜色 ${color}`"
              @click="form.color = color"
            />
          </div>
        </div>

        <FormField label="过敏信息" hint="用顿号或逗号分隔，比如：牛肉、鸡蛋">
          <input v-model="form.allergies" placeholder="牛肉、鸡蛋" />
        </FormField>

        <FormField label="服务偏好" hint="用顿号或逗号分隔">
          <input v-model="form.preferences" placeholder="洗护清洁、美容造型" />
        </FormField>

        <p v-if="formError" class="pets__error">{{ formError }}</p>

        <button
          type="button"
          class="button-primary pets__save"
          :disabled="profileStore.saving"
          @click="savePet"
        >
          {{ profileStore.saving ? '保存中…' : form.id ? '保存修改' : '创建档案' }}
        </button>
      </div>
    </BottomSheet>

    <ConfirmDialog
      :open="Boolean(pendingDelete)"
      title="删除这份档案？"
      :desc="pendingDelete ? `${pendingDelete.name} 的档案删除后无法恢复` : ''"
      confirm-label="删除"
      danger
      @confirm="removePet(pendingDelete.id)"
      @cancel="pendingDelete = null"
    />
  </div>
</template>

<style scoped>
.pets {
  display: grid;
  gap: var(--space-4);
  padding-top: var(--space-2);
  padding-bottom: var(--space-6);
  align-content: start;
}

.pets__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.pets__eyebrow {
  color: var(--color-primary);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-wider);
}

.pets__title {
  margin-top: 2px;
  font-size: var(--text-2xl);
  font-weight: var(--weight-semibold);
}

.pets__add {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 38px;
  padding: 0 var(--space-4);
  border-radius: var(--radius-full);
  background: var(--color-primary-deep);
  color: var(--color-text-invert);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  box-shadow: var(--shadow-brand);
  transition: transform var(--dur-fast) var(--ease-spring);
}

.pets__add:active {
  transform: scale(0.94);
}

.pets__stack {
  display: grid;
  gap: var(--space-3);
}

.pets__row {
  display: grid;
  gap: var(--space-2);
}

.pets__row-extra {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: 0 var(--space-2);
}

.pets__allergy {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text-mute);
  font-size: var(--text-xs);
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pets__delete {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  margin-left: auto;
  color: var(--color-text-tint);
  font-size: var(--text-xs);
  transition: color var(--dur-fast) var(--ease-out);
}

.pets__delete:active {
  color: var(--color-danger);
}

.pets__error {
  color: var(--color-danger);
  font-size: var(--text-sm);
}

/* ---------- 表单 ---------- */
.pets__form {
  display: grid;
  gap: var(--space-5);
  padding-bottom: var(--space-2);
}

.pets__form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.pets__form-row--col {
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
}

.pets__form-label {
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  color: var(--color-text-soft);
  letter-spacing: var(--tracking-wide);
}

.pets__form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  align-items: start;
}

.pets__colors {
  display: flex;
  gap: var(--space-2);
}

.pets__color {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-full);
  border: 2.5px solid transparent;
  transition: all var(--dur-fast) var(--ease-spring);
}

.pets__color:active {
  transform: scale(0.88);
}

.pets__color--active {
  border-color: var(--color-surface);
  box-shadow: 0 0 0 2px var(--color-primary-deep);
}

.pets__save {
  width: 100%;
}
</style>
