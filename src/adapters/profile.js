function calculateAgeLabel(birthday) {
  if (!birthday) {
    return ''
  }

  const birthDate = new Date(birthday)

  if (Number.isNaN(birthDate.getTime())) {
    return ''
  }

  const today = new Date()
  let years = today.getFullYear() - birthDate.getFullYear()
  let months = today.getMonth() - birthDate.getMonth()

  if (today.getDate() < birthDate.getDate()) {
    months -= 1
  }

  if (months < 0) {
    years -= 1
    months += 12
  }

  if (years < 0) {
    return ''
  }

  if (years === 0) {
    return `${Math.max(months, 0)}月`
  }

  return `${years}岁 ${Math.max(months, 0)}月`
}

export function adaptProfile(profile = {}) {
  return {
    id: profile.id,
    nickname: profile.nickname,
    avatar: profile.avatar_url,
    phone: profile.phone,
    level: profile.member_level,
    joinDate: profile.join_date,
    points: profile.points ?? 0,
    couponCount: profile.coupon_count ?? 0,
    stats: {
      orderCount: profile.stats?.order_count ?? 0,
      serviceCount: profile.stats?.service_count ?? 0,
      savedAmount: profile.stats?.saved_amount ?? 0
    }
  }
}

export function adaptAddress(item = {}) {
  return {
    id: item.id,
    name: item.receiver_name,
    phone: item.receiver_phone,
    region: item.region,
    detail: item.detail_address,
    tag: item.tag,
    isDefault: Boolean(item.is_default),
    displayAddress: [item.region, item.detail_address].filter(Boolean).join(' ')
  }
}

export function adaptPet(item = {}) {
  return {
    id: item.id,
    name: item.name,
    type: item.type,
    breed: item.breed,
    gender: item.gender,
    birthday: item.birthday,
    age: calculateAgeLabel(item.birthday),
    weight: item.weight,
    neutered: Boolean(item.neutered),
    allergies: Array.isArray(item.allergies) ? item.allergies : [],
    preferences: Array.isArray(item.preferences) ? item.preferences : [],
    avatar: item.avatar_url,
    color: item.color
  }
}
