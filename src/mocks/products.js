/**
 * 商品 mock
 * 前台图搜直接使用这份数据；后端 seed 中保留同款商品和配图。
 */

const productImage = (key) => `/images/products/${key}.svg`

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
    tags: ['低敏', '无谷', '鲜肉70%', '猫粮'],
    badge: '热卖',
    specs: [
      { group: '规格', options: ['1.5kg', '3kg', '6kg'] },
      { group: '口味', options: ['鸡肉', '三文鱼', '牛肉'] }
    ],
    images: [productImage('cat-food')],
    cover: productImage('cat-food'),
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
    tags: ['单一原料', '高蛋白', '训练奖励', '冻干'],
    specs: [
      { group: '规格', options: ['60g', '120g', '三袋装'] }
    ],
    images: [productImage('cat-snack')],
    cover: productImage('cat-snack'),
    stockStatus: 'inStock',
    rating: 4.8,
    reviewCount: 862,
    sold: 9200,
    summary: ['单一鸡胸肉原料', '-40℃ 真空冻干', '开袋即可训练奖励'],
    suitable: '适合 3 月龄以上猫咪',
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
    tags: ['可冲厕', '低粉尘', '强除臭', '猫砂'],
    specs: [
      { group: '规格', options: ['2.5kg', '6包装'] },
      { group: '香型', options: ['原味', '绿茶', '桃香'] }
    ],
    images: [productImage('cat-litter')],
    cover: productImage('cat-litter'),
    stockStatus: 'inStock',
    rating: 4.7,
    reviewCount: 2041,
    sold: 22000,
    summary: ['纯天然豆腐渣原料', '结团迅速，方便清理', '可直接冲入马桶'],
    suitable: '猫咪通用',
    gradient: ['#C8D5CA', '#F4EFE4']
  },
  {
    id: 'p-004',
    title: '羽毛逗猫棒套装',
    subtitle: '替换羽片 · 互动消耗',
    petType: 'cat',
    category: 'toy',
    price: 49,
    memberPrice: 42,
    tags: ['逗猫', '羽毛', '互动', '玩具'],
    specs: [
      { group: '款式', options: ['经典羽毛', '铃铛羽毛', '替换羽片装'] }
    ],
    images: [productImage('cat-wand')],
    cover: productImage('cat-wand'),
    stockStatus: 'inStock',
    rating: 4.6,
    reviewCount: 432,
    sold: 3200,
    summary: ['弹性杆身不易折', '可替换羽片，延长使用周期', '增加追逐跳跃运动量'],
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
    tags: ['低敏', '护肠胃', '鲜肉', '狗粮'],
    badge: '新品',
    specs: [
      { group: '规格', options: ['2kg', '5kg', '10kg'] },
      { group: '阶段', options: ['幼犬', '成犬', '老年犬'] }
    ],
    images: [productImage('dog-food')],
    cover: productImage('dog-food'),
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
    tags: ['耐咬', '洁齿', '橡胶', '玩具'],
    specs: [
      { group: '尺码', options: ['S', 'M', 'L'] }
    ],
    images: [productImage('dog-chew')],
    cover: productImage('dog-chew'),
    stockStatus: 'inStock',
    rating: 4.8,
    reviewCount: 712,
    sold: 5800,
    summary: ['医用级天然橡胶', '独立凹槽可藏零食', '缓解啃咬破坏行为'],
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
    tags: ['弱酸性', '燕麦精华', '柔顺', '沐浴露'],
    specs: [
      { group: '适用', options: ['猫咪', '犬类', '敏感肌'] }
    ],
    images: [productImage('shampoo')],
    cover: productImage('shampoo'),
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
    originalPrice: 328,
    tags: ['透气', '双背面', '2-8kg', '外出包'],
    specs: [
      { group: '颜色', options: ['苔绿色', '燕麦色', '深灰'] }
    ],
    images: [productImage('carrier')],
    cover: productImage('carrier'),
    stockStatus: 'soldOut',
    rating: 4.8,
    reviewCount: 245,
    sold: 1800,
    summary: ['双向开口便于互动', '承重 2-8kg', '附走失防护扣'],
    suitable: '猫犬通用',
    gradient: ['#8AA3B4', '#E5ECEF']
  },
  {
    id: 'p-009',
    title: '猫薄荷毛绒鱼',
    subtitle: '可拆洗内胆 · 自带铃纸',
    petType: 'cat',
    category: 'toy',
    price: 39,
    memberPrice: 35,
    tags: ['猫薄荷', '毛绒', '抓咬', '玩具'],
    badge: '加购',
    specs: [
      { group: '尺寸', options: ['20cm', '30cm'] }
    ],
    images: [productImage('cat-fish-toy')],
    cover: productImage('cat-fish-toy'),
    stockStatus: 'inStock',
    rating: 4.7,
    reviewCount: 389,
    sold: 5100,
    summary: ['内置猫薄荷包', '外层短绒不易掉毛', '可替换内胆重复使用'],
    suitable: '适合爱抓咬猫咪',
    gradient: ['#A9C0AD', '#EEE4D1']
  },
  {
    id: 'p-010',
    title: '益生菌营养膏',
    subtitle: '肠胃调理 · 换粮过渡',
    petType: 'all',
    category: 'care',
    price: 96,
    memberPrice: 88,
    originalPrice: 118,
    tags: ['益生菌', '营养膏', '肠胃', '保健'],
    specs: [
      { group: '规格', options: ['80g', '三支装'] }
    ],
    images: [productImage('supplement')],
    cover: productImage('supplement'),
    stockStatus: 'inStock',
    rating: 4.8,
    reviewCount: 658,
    sold: 6700,
    summary: ['复合益生菌配方', '换粮期帮助肠胃适应', '猫犬均可舔食'],
    suitable: '猫犬通用 / 3 月龄以上',
    gradient: ['#B7BFA9', '#EEE8D8']
  },
  {
    id: 'p-011',
    title: '鸡肉训练奖励粒',
    subtitle: '小颗粒 · 外出训练',
    petType: 'dog',
    category: 'snack',
    price: 69,
    memberPrice: 62,
    originalPrice: 79,
    tags: ['训练奖励', '鸡肉', '低脂', '狗零食'],
    specs: [
      { group: '规格', options: ['100g', '250g', '四袋装'] }
    ],
    images: [productImage('dog-treat')],
    cover: productImage('dog-treat'),
    stockStatus: 'inStock',
    rating: 4.7,
    reviewCount: 512,
    sold: 4600,
    summary: ['小颗粒便于随身携带', '鸡胸肉低脂配方', '训练回馈不粘手'],
    suitable: '适合 3 月龄以上犬类',
    gradient: ['#D8B08C', '#F7E8D7']
  },
  {
    id: 'p-012',
    title: '静音自动饮水机',
    subtitle: '循环活水 · 2L 容量',
    petType: 'all',
    category: 'home',
    price: 188,
    memberPrice: 168,
    originalPrice: 228,
    tags: ['饮水机', '静音', '循环过滤', '居家'],
    specs: [
      { group: '颜色', options: ['奶白', '雾蓝'] }
    ],
    images: [productImage('fountain')],
    cover: productImage('fountain'),
    stockStatus: 'inStock',
    rating: 4.8,
    reviewCount: 744,
    sold: 3900,
    summary: ['2L 大容量水箱', '三层滤芯循环过滤', '低噪水泵适合夜间使用'],
    suitable: '猫犬通用',
    gradient: ['#8AA3B4', '#E5ECEF']
  },
  {
    id: 'p-013',
    title: '防滑牵引胸背带',
    subtitle: '轻量透气 · 夜间反光',
    petType: 'dog',
    category: 'travel',
    price: 138,
    memberPrice: 126,
    originalPrice: 158,
    tags: ['胸背带', '牵引', '反光', '出行'],
    specs: [
      { group: '尺码', options: ['S', 'M', 'L', 'XL'] },
      { group: '颜色', options: ['苔绿色', '岩灰', '橙红'] }
    ],
    images: [productImage('harness')],
    cover: productImage('harness'),
    stockStatus: 'inStock',
    rating: 4.6,
    reviewCount: 276,
    sold: 2100,
    summary: ['胸背受力减少勒颈', '夜间反光织带', '快拆扣便于穿脱'],
    suitable: '小中大型犬',
    gradient: ['#B58463', '#F2E2D0']
  },
  {
    id: 'p-014',
    title: '宠物除味喷雾',
    subtitle: '猫砂盆 · 窝垫可用',
    petType: 'all',
    category: 'clean',
    price: 76,
    memberPrice: 68,
    originalPrice: 88,
    tags: ['除味', '喷雾', '清洁', '猫砂盆'],
    specs: [
      { group: '香型', options: ['无香', '绿茶', '白茶'] }
    ],
    images: [productImage('deodorizer')],
    cover: productImage('deodorizer'),
    stockStatus: 'inStock',
    rating: 4.6,
    reviewCount: 418,
    sold: 3600,
    summary: ['可用于猫砂盆和窝垫', '植物来源除味成分', '不含刺激性酒精'],
    suitable: '猫犬家庭通用',
    gradient: ['#A9C0AD', '#F4EFE4']
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
    productIds: ['p-001', 'p-003', 'p-004', 'p-007', 'p-009'],
    gradient: ['#A9C0AD', '#EEE4D1'],
    image: productImage('cat-bundle')
  },
  {
    id: 'b-002',
    title: '换季护理组合',
    subtitle: '洗护 · 营养膏 · 除味喷雾',
    petType: 'all',
    price: 266,
    originalPrice: 328,
    itemCount: 4,
    tag: '季节推荐',
    productIds: ['p-007', 'p-010', 'p-014'],
    gradient: ['#D97757', '#F3DFD0'],
    image: productImage('care-bundle')
  },
  {
    id: 'b-003',
    title: '出行无忧套装',
    subtitle: '外出包 · 胸背带 · 便携奖励',
    petType: 'dog',
    price: 488,
    originalPrice: 628,
    itemCount: 5,
    tag: '出行',
    productIds: ['p-008', 'p-011', 'p-013'],
    gradient: ['#B58463', '#F2E2D0'],
    image: productImage('travel-bundle')
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
        images: [productImage('cat-food')],
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
