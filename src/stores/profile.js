import { defineStore } from 'pinia'
import { pets } from '@/mocks'
import { createPet as createPetRequest, deletePet as deletePetRequest, getPets, getProfile, updatePet as updatePetRequest } from '@/api/user'
import { adaptPet, adaptProfile } from '@/adapters/profile'

const clonePets = () =>
  pets.map((pet) => ({
    ...pet,
    allergies: [...pet.allergies],
    preferences: [...pet.preferences]
  }))

function serializePetPayload(payload = {}) {
  return {
    name: payload.name,
    type: payload.type,
    breed: payload.breed,
    gender: payload.gender,
    birthday: payload.birthday,
    weight: Number(payload.weight),
    neutered: Boolean(payload.neutered),
    allergies: payload.allergies || [],
    preferences: payload.preferences || [],
    avatar_url: payload.avatar || payload.avatar_url || '',
    color: payload.color || ''
  }
}

export const useProfileStore = defineStore('profile', {
  state: () => ({
    profile: null,
    pets: clonePets(),
    activePetType: 'cat',
    selectedPetId: pets[0]?.id ?? null,
    loading: false,
    saving: false,
    error: ''
  }),
  getters: {
    hasPets: (state) => state.pets.length > 0,
    filteredPets: (state) => state.pets.filter((pet) => pet.type === state.activePetType),
    selectedPet: (state) => state.pets.find((pet) => pet.id === state.selectedPetId) ?? null
  },
  actions: {
    setPetType(value) {
      this.activePetType = value
    },
    setSelectedPet(id) {
      this.selectedPetId = id
    },
    async fetchProfile() {
      this.loading = true
      this.error = ''

      try {
        const data = await getProfile()
        this.profile = adaptProfile(data.profile)
      } catch (requestError) {
        this.error = requestError instanceof Error ? requestError.message : '个人资料加载失败'
      } finally {
        this.loading = false
      }
    },
    async fetchPets() {
      this.loading = true
      this.error = ''

      try {
        const data = await getPets()
        this.pets = (data.list || []).map(adaptPet)
        if (!this.pets.some((pet) => pet.id === this.selectedPetId)) {
          this.selectedPetId = this.pets[0]?.id ?? null
        }
      } catch (requestError) {
        this.error = requestError instanceof Error ? requestError.message : '宠物档案加载失败'
      } finally {
        this.loading = false
      }
    },
    async createPet(payload) {
      this.saving = true
      this.error = ''

      try {
        const data = await createPetRequest(serializePetPayload(payload))
        const createdPet = adaptPet(data.item)
        this.pets.unshift(createdPet)
        this.selectedPetId = createdPet.id
        return createdPet
      } catch (requestError) {
        this.error = requestError instanceof Error ? requestError.message : '新增宠物失败'
        throw requestError
      } finally {
        this.saving = false
      }
    },
    async updatePet(id, payload) {
      this.saving = true
      this.error = ''

      try {
        const data = await updatePetRequest(id, serializePetPayload(payload))
        const updatedPet = adaptPet(data.item)
        const index = this.pets.findIndex((pet) => pet.id === id)

        if (index >= 0) {
          this.pets.splice(index, 1, updatedPet)
        } else {
          this.pets.unshift(updatedPet)
        }

        if (!this.selectedPetId) {
          this.selectedPetId = updatedPet.id
        }

        return updatedPet
      } catch (requestError) {
        this.error = requestError instanceof Error ? requestError.message : '更新宠物失败'
        throw requestError
      } finally {
        this.saving = false
      }
    },
    async deletePet(id) {
      this.saving = true
      this.error = ''

      try {
        await deletePetRequest(id)
        this.pets = this.pets.filter((pet) => pet.id !== id)
        if (this.selectedPetId === id) {
          this.selectedPetId = this.pets[0]?.id ?? null
        }
      } catch (requestError) {
        this.error = requestError instanceof Error ? requestError.message : '删除宠物失败'
        throw requestError
      } finally {
        this.saving = false
      }
    },
    async savePet(payload) {
      if (payload.id) {
        return this.updatePet(payload.id, payload)
      }

      return this.createPet(payload)
    }
  }
})
