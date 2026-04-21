const img = (id, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`

export const primaryCategories = [
  { id: 'cat', label: '猫', emoji: '🐈', color: '#6A8572' },
  { id: 'dog', label: '狗', emoji: '🐕', color: '#B58463' },
  { id: 'all', label: '通用', emoji: '✦', color: '#8AA3B4' }
]

export const quickEntries = [
  { id: 'food', label: '主粮', icon: 'bowl', tone: 'sage' },
  { id: 'snack', label: '零食', icon: 'bone', tone: 'amber' },
  { id: 'toy', label: '玩具', icon: 'ball', tone: 'coral' },
  { id: 'clean', label: '清洁', icon: 'drop', tone: 'sky' },
  { id: 'bath', label: '洗护', icon: 'bath', tone: 'sage' },
  { id: 'beauty', label: '美容', icon: 'scissor', tone: 'clay' },
  { id: 'boarding', label: '寄养', icon: 'home', tone: 'amber' },
  { id: 'newbie', label: '新人礼', icon: 'gift', tone: 'coral' }
]

export const serviceCategories = [
  { id: 'bath', label: '洗护清洁', icon: 'bath', tone: 'sage' },
  { id: 'beauty', label: '精致美容', icon: 'scissor', tone: 'coral' },
  { id: 'health', label: '健康护理', icon: 'leaf', tone: 'amber' },
  { id: 'boarding', label: '短期寄养', icon: 'home', tone: 'clay' }
]

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
