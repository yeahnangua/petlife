export function filterProductsByPetType(items, petType = 'cat') {
  return items.filter((item) => item.petType === petType || item.petType === 'all')
}

export function getFeaturedProducts(items, petType = 'cat', limit = 4) {
  return filterProductsByPetType(items, petType).slice(0, limit)
}

export function getRecommendedBundles(items, petType = 'cat', limit = 3) {
  return items
    .filter((item) => item.petType === petType || item.petType === 'all')
    .slice(0, limit)
}

export function getProductsByCategory(items, petType = 'cat', category = '') {
  return filterProductsByPetType(items, petType).filter((item) => !category || item.category === category)
}

export function getServicesByPetType(items, petType = 'cat') {
  return items.filter((item) => item.petType === petType || item.petType === 'all')
}
