import { defineStore } from 'pinia'
import { pets } from '@/mocks'

const clonePets = () =>
  pets.map((pet) => ({
    ...pet,
    allergies: [...pet.allergies],
    preferences: [...pet.preferences]
  }))

export const useProfileStore = defineStore('profile', {
  state: () => ({
    pets: clonePets(),
    activePetType: 'cat',
    selectedPetId: pets[0]?.id ?? null
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
    savePet(payload) {
      const existing = this.pets.find((pet) => pet.id === payload.id)
      if (existing) {
        Object.assign(existing, payload)
      } else {
        this.pets.unshift({
          ...payload,
          id: payload.id || `pet-${Date.now()}`,
          allergies: payload.allergies || [],
          preferences: payload.preferences || []
        })
      }
    }
  }
})
