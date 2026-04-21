/**
 * 商品 mock
 * 图片使用 unsplash 的稳定 id, 若离线则各卡片会以渐变底兜底。
 * 接入 Codex 时建议把 imagery 抽象成 service 层。
 */

const img = (id, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`

export const products = [
  {
    id: 'p-001',
    title: '鲜肉全价猫粮',
    subtitle: '低敏冷鲜配方 · 成猫通用',
    petType: 'cat',
    category: 'food',
    price: 268,
    memberPrice: 248,
    originalPrice: 298,
    tags: ['低敏', '无谷', '鲜肉70%'],
    badge: '热卖',
    specs: [
      { group: '规格', options: ['1.5kg', '3kg', '6kg'] },
      { group: '口味', options: ['鸡肉', '三文鱼', '牛肉'] }
    ],
    images: [img('photo-1592194996308-7b43878e84a6'), img('photo-1587300003388-59208cc962cb')],
    cover: img('photo-1592194996308-7b43878e84a6', 600),
    stockStatus: 'inStock',
    rating: 4.9,
    reviewCount: 1283,
    sold: 12800,
    summary: ['鲜肉含量 70%，保留原始营养', '低敏配方，适合肠胃敏感猫咪', '自研冷鲜锁鲜工艺'],
    suitable: '适合 1-8 岁成猫 / 全品种',
    gradient: ['#A9C0AD', '#EEE4D1']
  },
  {
    id: 'p-002',
    title: '冻干鸡肉小食',
    subtitle: '单一原料 · 无添加',
    petType: 'cat',
    category: 'snack',
    price: 58,
    memberPrice: 52,
    originalPrice: 68,
    tags: ['单一原料', '高蛋白', '训练奖励'],
    specs: [
      { group: '规格', options: ['60g', '120g', '三袋装'] }
    ],
    images: [img('photo-1615485290382-441e4d049cb5')],
    cover: img('photo-1615485290382-441e4d049cb5', 600),
    stockStatus: 'inStock',
    rating: 4.8,
    reviewCount: 862,
    sold: 9200,
    summary: ['单一鸡胸肉原料', '-40℃ 真空冻干', '开袋即可训练奖励'],
    suitable: '适合 3 月龄以上',
    gradient: ['#D4A44C', '#F2E3C1']
  },
  {
    id: 'p-003',
    title: '天然豆腐猫砂',
    subtitle: '结团强 · 除臭升级',
    petType: 'cat',
    category: 'litter',
    price: 68,
    memberPrice: 62,
    tags: ['可冲厕', '低粉尘', '强除臭'],
    specs: [
      { group: '规格', options: ['2.5kg', '6包装'] },
      { group: '香型', options: ['原味', '绿茶', '桃香'] }
    ],
    images: [img('photo-1606471191009-63994c53433b')],
    cover: img('photo-1606471191009-63994c53433b', 600),
    stockStatus: 'inStock',
    rating: 4.7,
    reviewCount: 2041,
    sold: 22000,
    summary: ['纯天然豆腐渣原料', '结团迅速，方便清理', '可直接冲入马桶'],
    suitable: '通用',
    gradient: ['#C8D5CA', '#F4EFE4']
  },
  {
    id: 'p-004',
    title: '慢食逗猫玩具',
    subtitle: '益智互动 · 抗抑郁',
    petType: 'cat',
    category: 'toy',
    price: 89,
    memberPrice: 82,
    tags: ['互动', '益智', '缓解焦虑'],
    specs: [
      { group: '颜色', options: ['燕麦色', '苔绿色', '珊瑚橙'] }
    ],
    images: [img('photo-1514888286974-6c03e2ca1dba')],
    cover: img('photo-1514888286974-6c03e2ca1dba', 600),
    stockStatus: 'inStock',
    rating: 4.6,
    reviewCount: 432,
    sold: 3200,
    summary: ['手工编织材质', '多关卡益智设计', '缓解独处焦虑'],
    suitable: '全年龄猫咪',
    gradient: ['#E9A68B', '#F4DFD1']
  },
  {
    id: 'p-005',
    title: '低敏全犬种狗粮',
    subtitle: '鲜肉鸡胸 + 益生菌',
    petType: 'dog',
    category: 'food',
    price: 328,
    memberPrice: 298,
    originalPrice: 368,
    tags: ['低敏', '护肠胃', '鲜肉'],
    badge: '新品',
    specs: [
      { group: '规格', options: ['2kg', '5kg', '10kg'] },
      { group: '阶段', options: ['幼犬', '成犬', '老年犬'] }
    ],
    images: [img('photo-1601758123927-196d5d02d63e')],
    cover: img('photo-1601758123927-196d5d02d63e', 600),
    stockStatus: 'inStock',
    rating: 4.9,
    reviewCount: 961,
    sold: 8200,
    summary: ['鲜鸡胸肉冷鲜锁鲜', '添加复合益生菌', '全犬种通用配方'],
    suitable: '适合 1-7 岁成犬',
    gradient: ['#B58463', '#F2E2D0']
  },
  {
    id: 'p-006',
    title: '耐咬洁齿棒',
    subtitle: '天然橡胶 · 清洁牙垢',
    petType: 'dog',
    category: 'toy',
    price: 78,
    memberPrice: 72,
    tags: ['耐咬', '洁齿', '中大型犬'],
    specs: [
      { group: '尺码', options: ['S', 'M', 'L'] }
    ],
    images: [img('photo-1583337130417-3346a1be7dee')],
    cover: img('photo-1583337130417-3346a1be7dee', 600),
    stockStatus: 'inStock',
    rating: 4.8,
    reviewCount: 712,
    sold: 5800,
    summary: ['医用级天然橡胶', '独立凹槽储藏零食', '缓解啃咬破坏行为'],
    suitable: '中大型犬',
    gradient: ['#D97757', '#F3DFD0']
  },
  {
    id: 'p-007',
    title: '温和沐浴露 500ml',
    subtitle: '弱酸性 · 燕麦舒缓',
    petType: 'all',
    category: 'clean',
    price: 128,
    memberPrice: 118,
    tags: ['弱酸性', '燕麦精华', '柔顺'],
    specs: [
      { group: '适用', options: ['猫咪', '犬类', '敏感肌'] }
    ],
    images: [img('photo-1585155770447-2f66e2a397b5')],
    cover: img('photo-1585155770447-2f66e2a397b5', 600),
    stockStatus: 'inStock',
    rating: 4.7,
    reviewCount: 523,
    sold: 4100,
    summary: ['天然燕麦精华', '弱酸性温和配方', '留香持久不刺激'],
    suitable: '猫犬通用',
    gradient: ['#A9C0AD', '#F4EFE4']
  },
  {
    id: 'p-008',
    title: '便携外出包',
    subtitle: '透气 · 防走失 · 双背面',
    petType: 'all',
    category: 'travel',
    price: 298,
    memberPrice: 268,
    tags: ['透气', '双背面', '2-8kg'],
    specs: [
      { group: '颜色', options: ['苔绿色', '燕麦色', '深灰'] }
    ],
    images: [img('photo-1587729927069-a58e9fa1a0db')],
    cover: img('photo-1587729927069-a58e9fa1a0db', 600),
    stockStatus: 'soldOut',
    rating: 4.8,
    reviewCount: 245,
    sold: 1800,
    summary: ['双向开口便于互动', '承重 2-8kg', '附走失防护扣'],
    suitable: '猫犬通用',
    gradient: ['#8AA3B4', '#E5ECEF']
  }
]

/**
 * 场景化组合推荐
 * 用于首页 "BundleCard" 模块
 */
export const bundles = [
  {
    id: 'b-001',
    title: '新手养猫起步包',
    subtitle: '主粮 · 猫砂 · 逗猫棒 · 洗护',
    petType: 'cat',
    price: 398,
    originalPrice: 528,
    itemCount: 6,
    tag: '新人必备',
    productIds: ['p-001', 'p-003', 'p-004', 'p-007'],
    gradient: ['#A9C0AD', '#EEE4D1'],
    image: img('photo-1533738363-b7f9aef128ce')
  },
  {
    id: 'b-002',
    title: '换季护理组合',
    subtitle: '驱虫 · 沐浴 · 营养保健',
    petType: 'all',
    price: 266,
    originalPrice: 328,
    itemCount: 4,
    tag: '季节推荐',
    productIds: ['p-007'],
    gradient: ['#D97757', '#F3DFD0'],
    image: img('photo-1415369629372-26f2fe60c467')
  },
  {
    id: 'b-003',
    title: '出行无忧套装',
    subtitle: '外出包 · 洁齿棒 · 便携碗',
    petType: 'dog',
    price: 488,
    originalPrice: 628,
    itemCount: 5,
    tag: '出行',
    productIds: ['p-008', 'p-006'],
    gradient: ['#B58463', '#F2E2D0'],
    image: img('photo-1548199973-03cce0bbc87b')
  }
]

/**
 * 评价摘要 (商品详情用)
 */
export const productReviews = {
  'p-001': {
    score: 4.9,
    total: 1283,
    distribution: { 5: 82, 4: 12, 3: 4, 2: 1, 1: 1 },
    tags: ['适口性好', '毛发靓丽', '便便成型', '肠胃好'],
    items: [
      {
        id: 'r-1',
        user: '橘子的铲屎官',
        avatar: 'https://i.pravatar.cc/80?img=32',
        content: '我家橘猫吃了两个月，毛色明显变好，肠胃也没出过问题。',
        images: [img('photo-1592194996308-7b43878e84a6', 400)],
        date: '2026-03-22',
        spec: '3kg · 三文鱼'
      },
      {
        id: 'r-2',
        user: '茶茶Tea',
        avatar: 'https://i.pravatar.cc/80?img=47',
        content: '颗粒大小适中，挑食的猫也能接受，包装精致。',
        images: [],
        date: '2026-04-02',
        spec: '1.5kg · 鸡肉'
      }
    ]
  }
}

export const findProduct = (id) => products.find((p) => p.id === id)

export default {
  products,
  bundles,
  productReviews,
  findProduct
}
