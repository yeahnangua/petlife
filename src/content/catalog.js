import { bundles as productBundles } from '@/mocks/products'

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

export const bundles = productBundles
