import { randomUUID } from 'node:crypto'
import { AppError } from '../utils/appError.js'
import {
  requireDateString,
  requireEnum,
  requireString,
  requireStringArray
} from '../utils/validators.js'
import {
  clearDefaultAddresses,
  createAddress,
  deleteAddress,
  findAddressById,
  listAddressesByUserId,
  updateAddress
} from '../repositories/addressRepository.js'
import {
  createPet,
  deletePet,
  findPetById,
  listPetsByUserId,
  updatePet
} from '../repositories/petRepository.js'
import {
  countBookingsByUserId,
  countOrdersByUserId,
  findUserById,
  updateUser
} from '../repositories/userRepository.js'

function now() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

function toBoolean(value) {
  return value === true || value === 1 || value === '1'
}

function mapAddress(row) {
  return {
    id: row.id,
    receiver_name: row.receiver_name,
    receiver_phone: row.receiver_phone,
    region: row.region,
    detail_address: row.detail_address,
    tag: row.tag,
    is_default: Boolean(row.is_default),
    created_at: row.created_at,
    updated_at: row.updated_at
  }
}

function mapPet(row) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    breed: row.breed,
    gender: row.gender,
    birthday: row.birthday,
    weight: row.weight,
    neutered: Boolean(row.neutered),
    allergies: JSON.parse(row.allergies_json || '[]'),
    preferences: JSON.parse(row.preferences_json || '[]'),
    avatar_url: row.avatar_url,
    color: row.color,
    created_at: row.created_at,
    updated_at: row.updated_at
  }
}

function validateAddressPayload(payload) {
  return {
    receiver_name: requireString(payload.receiver_name, 'receiver_name'),
    receiver_phone: requireString(payload.receiver_phone, 'receiver_phone'),
    region: requireString(payload.region, 'region'),
    detail_address: requireString(payload.detail_address, 'detail_address'),
    tag: requireString(payload.tag ?? '其他', 'tag'),
    is_default: toBoolean(payload.is_default)
  }
}

function requireMobilePhone(value, fieldName) {
  const phone = requireString(value, fieldName)

  if (!/^1\d{10}$/.test(phone)) {
    throw new AppError(400, 40000, `${fieldName} must be an 11-digit mobile number`)
  }

  return phone
}

function validateProfilePayload(payload) {
  return {
    nickname: requireString(payload.nickname, 'nickname'),
    phone: requireMobilePhone(payload.phone, 'phone'),
    avatar_url: requireString(payload.avatar_url, 'avatar_url')
  }
}

function validatePetPayload(payload) {
  const weight = Number(payload.weight)
  if (!Number.isFinite(weight) || weight <= 0) {
    throw new AppError(400, 40000, 'weight must be a positive number')
  }

  return {
    name: requireString(payload.name, 'name'),
    type: requireEnum(payload.type, ['cat', 'dog'], 'type'),
    breed: requireString(payload.breed, 'breed'),
    gender: requireEnum(payload.gender, ['male', 'female'], 'gender'),
    birthday: requireDateString(payload.birthday, 'birthday'),
    weight,
    neutered: toBoolean(payload.neutered),
    allergies: requireStringArray(payload.allergies, 'allergies'),
    preferences: requireStringArray(payload.preferences, 'preferences'),
    avatar_url: requireString(payload.avatar_url, 'avatar_url'),
    color: requireString(payload.color, 'color')
  }
}

function mapProfile(db, userId, user) {
  return {
    id: user.id,
    nickname: user.nickname,
    phone: user.phone,
    avatar_url: user.avatar_url,
    member_level: user.member_level,
    points: user.points,
    join_date: user.created_at.slice(0, 7),
    coupon_count: 0,
    pet_count: listPetsByUserId(db, userId).length,
    stats: {
      order_count: countOrdersByUserId(db, userId),
      service_count: countBookingsByUserId(db, userId),
      saved_amount: 0
    }
  }
}

export function getProfile(db, userId) {
  const user = findUserById(db, userId)
  if (!user) {
    throw new AppError(404, 40400, 'user not found')
  }

  return mapProfile(db, userId, user)
}

export function updateUserProfile(db, userId, payload) {
  const currentUser = findUserById(db, userId)
  if (!currentUser) {
    throw new AppError(404, 40400, 'user not found')
  }

  const profile = validateProfilePayload(payload)
  const record = {
    id: userId,
    ...profile,
    updated_at: now()
  }

  updateUser(db, record)

  return mapProfile(db, userId, {
    ...currentUser,
    ...record
  })
}

export function getAddresses(db, userId) {
  return listAddressesByUserId(db, userId).map(mapAddress)
}

export function createUserAddress(db, userId, payload) {
  const address = validateAddressPayload(payload)
  const existingAddresses = listAddressesByUserId(db, userId)
  const nextIsDefault = address.is_default || existingAddresses.length === 0
  const timestamp = now()

  const transaction = db.transaction(() => {
    if (nextIsDefault) {
      clearDefaultAddresses(db, userId)
    }

    const record = {
      id: `addr_${randomUUID().slice(0, 8)}`,
      user_id: userId,
      ...address,
      is_default: nextIsDefault ? 1 : 0,
      created_at: timestamp,
      updated_at: timestamp
    }

    createAddress(db, record)
    return mapAddress(record)
  })

  return transaction()
}

export function updateUserAddress(db, userId, addressId, payload) {
  const currentAddress = findAddressById(db, userId, addressId)
  if (!currentAddress) {
    throw new AppError(404, 40400, 'address not found')
  }

  const address = validateAddressPayload(payload)
  const timestamp = now()

  const transaction = db.transaction(() => {
    if (address.is_default) {
      clearDefaultAddresses(db, userId, addressId)
    }

    const record = {
      id: addressId,
      user_id: userId,
      ...address,
      is_default: address.is_default ? 1 : 0,
      updated_at: timestamp
    }

    updateAddress(db, record)
    return mapAddress({
      ...currentAddress,
      ...record
    })
  })

  return transaction()
}

export function deleteUserAddress(db, userId, addressId) {
  const currentAddress = findAddressById(db, userId, addressId)
  if (!currentAddress) {
    throw new AppError(404, 40400, 'address not found')
  }

  const transaction = db.transaction(() => {
    deleteAddress(db, userId, addressId)

    if (currentAddress.is_default) {
      const nextAddress = listAddressesByUserId(db, userId)[0]
      if (nextAddress) {
        updateAddress(db, {
          ...nextAddress,
          user_id: userId,
          is_default: 1,
          updated_at: now()
        })
      }
    }
  })

  transaction()

  return { id: addressId }
}

export function getPets(db, userId) {
  return listPetsByUserId(db, userId).map(mapPet)
}

export function createUserPet(db, userId, payload) {
  const pet = validatePetPayload(payload)
  const timestamp = now()
  const record = {
    id: `pet_${randomUUID().slice(0, 8)}`,
    user_id: userId,
    ...pet,
    neutered: pet.neutered ? 1 : 0,
    allergies_json: JSON.stringify(pet.allergies),
    preferences_json: JSON.stringify(pet.preferences),
    created_at: timestamp,
    updated_at: timestamp
  }

  createPet(db, record)
  return mapPet(record)
}

export function updateUserPet(db, userId, petId, payload) {
  const currentPet = findPetById(db, userId, petId)
  if (!currentPet) {
    throw new AppError(404, 40400, 'pet not found')
  }

  const pet = validatePetPayload(payload)
  const record = {
    id: petId,
    user_id: userId,
    ...pet,
    neutered: pet.neutered ? 1 : 0,
    allergies_json: JSON.stringify(pet.allergies),
    preferences_json: JSON.stringify(pet.preferences),
    updated_at: now()
  }

  updatePet(db, record)

  return mapPet({
    ...currentPet,
    ...record
  })
}

export function deleteUserPet(db, userId, petId) {
  const currentPet = findPetById(db, userId, petId)
  if (!currentPet) {
    throw new AppError(404, 40400, 'pet not found')
  }

  deletePet(db, userId, petId)
  return { id: petId }
}
