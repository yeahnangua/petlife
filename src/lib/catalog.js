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

export function getMarketingRecommendation({
  petType = 'cat',
  products = [],
  services = [],
  profile = null,
  cartItems = []
} = {}) {
  const validCartCount = cartItems.filter((item) => item.valid).length
  const orderCount = Number(profile?.stats?.orderCount || 0)
  const points = Number(profile?.points || 0)
  const level = profile?.level || '普通会员'
  const matchedProducts = filterProductsByPetType(products, petType)
  const matchedServices = getServicesByPetType(services, petType)
  const product = matchedProducts.find((item) => item.stockStatus !== 'soldOut') || matchedProducts[0] || null
  const service = matchedServices[0] || null
  const petLabel = petType === 'dog' ? '狗狗' : '猫咪'
  const profileTags = [
    `${petLabel}家庭`,
    orderCount >= 8 ? '高复购用户' : '成长型用户',
    validCartCount > 0 ? '购物车待转化' : '可引导首购',
    points >= 2000 ? '高积分会员' : '积分成长中'
  ]

  const coupon = level.includes('铂金') || level.includes('黑金')
    ? {
        title: '铂金专属加购券',
        value: '满 299 减 60',
        hint: '结合会员等级与购物车状态触发，适合提升客单价。'
      }
    : {
        title: validCartCount > 0 ? '购物车唤醒券' : '新人尝鲜券',
        value: validCartCount > 0 ? '满 199 减 35' : '首单 8 折',
        hint: validCartCount > 0 ? '针对已加购未下单用户做限时转化。' : '降低首次购买决策门槛。'
      }

  return {
    title: `${petLabel}今日智能推荐`,
    profileTags,
    coupon,
    product,
    service,
    reasons: [
      `根据当前宠物类型优先筛选${petLabel}适用商品和服务。`,
      orderCount >= 8 ? '历史订单较多，优先展示高复购消耗品与会员权益。' : '订单数量仍在成长，优先展示低门槛入门组合。',
      validCartCount > 0 ? '检测到购物车有有效商品，推荐搭配优惠券促进结算。' : '购物车为空，推荐从场景化商品或预约服务开始转化。'
    ]
  }
}
