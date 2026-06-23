const CATEGORY_LABELS = {
  food: '主粮',
  snack: '零食',
  litter: '猫砂',
  clean: '清洁',
  toy: '玩具',
  travel: '出行',
  care: '保健',
  health: '营养保健',
  home: '居家用品',
  gift: '礼盒',
  bath: '洗护',
  beauty: '美容',
  boarding: '寄养'
}

const CATEGORY_GRADIENTS = {
  food: ['#A9C0AD', '#EEE4D1'],
  snack: ['#D8B08C', '#F7E8D7'],
  litter: ['#C8D5CA', '#F4EFE4'],
  clean: ['#A2BCCC', '#EDF5F7'],
  toy: ['#E3BC89', '#F4E7CF'],
  travel: ['#8AA3B4', '#E6EEF0'],
  care: ['#B7BFA9', '#EEE8D8'],
  health: ['#B7BFA9', '#EEE8D8'],
  home: ['#8AA3B4', '#E6EEF0'],
  gift: ['#D79B7D', '#F7E7DF'],
  bath: ['#92A88F', '#EFE8D9'],
  beauty: ['#D79B7D', '#F7E7DF'],
  boarding: ['#A59A88', '#ECE5DB'],
  all: ['#B7BFA9', '#EEE8D8']
}

function inferServiceCategory(item = {}) {
  const haystack = [item.title, item.subtitle, ...(Array.isArray(item.highlights) ? item.highlights : [])]
    .filter(Boolean)
    .join(' ')

  if (/寄养|日托/.test(haystack)) {
    return 'boarding'
  }

  if (/美容|造型/.test(haystack)) {
    return 'beauty'
  }

  if (/护理|驱虫|体检|健康/.test(haystack)) {
    return 'health'
  }

  return 'bath'
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value
  }

  return value ? [value] : []
}

function getGradient(key) {
  return CATEGORY_GRADIENTS[key] || CATEGORY_GRADIENTS.all
}

export function adaptCategory(item = {}) {
  return {
    id: item.id,
    name: item.name,
    label: item.name || CATEGORY_LABELS[item.slug] || '',
    slug: item.slug,
    petType: item.pet_type,
    cover: item.cover_url
  }
}

export function adaptProduct(item = {}) {
  const categoryKey = item.category_slug || item.slug || 'all'

  return {
    id: item.id,
    categoryId: item.category_id,
    category: categoryKey,
    title: item.title,
    subtitle: item.subtitle,
    petType: item.pet_type,
    price: item.price,
    memberPrice: item.member_price ?? item.price,
    originalPrice: item.original_price,
    stockStatus: item.stock_status,
    badge: item.badge,
    tags: toArray(item.tags),
    specs: toArray(item.specs),
    summary: toArray(item.summary),
    suitable: item.suitable_text || '',
    cover: item.cover_url,
    rating: item.rating ?? 0,
    reviewCount: item.review_count ?? 0,
    sold: item.sold_count ?? 0,
    gradient: getGradient(categoryKey)
  }
}

export function adaptProductDetail(item = {}) {
  return {
    ...adaptProduct(item),
    images: toArray(item.product_images).map((image) => image.image_url).filter(Boolean)
  }
}

export function adaptService(item = {}) {
  const categoryKey = item.category_slug || item.category || inferServiceCategory(item)

  return {
    id: item.id,
    category: categoryKey,
    title: item.title,
    tagline: item.subtitle,
    subtitle: item.subtitle,
    petType: item.pet_type,
    price: item.price,
    memberPrice: item.member_price ?? item.price,
    originalPrice: item.original_price,
    duration: item.duration_minutes,
    badge: item.badge,
    includes: toArray(item.highlights),
    suitable: toArray(item.summary),
    tips: toArray(item.notice),
    cover: item.cover_url,
    rating: item.rating ?? 0,
    reviewCount: item.review_count ?? 0,
    gradient: getGradient(categoryKey)
  }
}

export function adaptServiceDetail(item = {}) {
  return {
    ...adaptService(item),
    images: toArray(item.service_images).map((image) => image.image_url).filter(Boolean)
  }
}

export function adaptStore(item = {}) {
  return {
    id: item.id,
    name: item.name,
    phone: item.phone,
    address: item.address,
    businessHours: item.business_hours,
    cover: item.cover_url,
    status: item.status
  }
}

export function adaptStoreSlot(item = {}) {
  return {
    id: item.id,
    label: item.label,
    capacity: item.capacity,
    used: item.used,
    remaining: item.remaining,
    available: Boolean(item.isAvailable)
  }
}
