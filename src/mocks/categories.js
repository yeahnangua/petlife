/**
 * 分类数据
 * 一级: cat / dog / all
 * 二级: 按场景分组
 */
export const primaryCategories = [
  { id: 'cat', label: '猫', emoji: '🐈', color: '#6A8572' },
  { id: 'dog', label: '狗', emoji: '🐕', color: '#B58463' },
  { id: 'all', label: '通用', emoji: '✦', color: '#8AA3B4' }
]

export const secondaryCategories = {
  cat: [
    { id: 'cat-food', label: '主粮', icon: 'bowl' },
    { id: 'cat-snack', label: '零食', icon: 'bone' },
    { id: 'cat-litter', label: '猫砂', icon: 'granule' },
    { id: 'cat-toy', label: '玩具', icon: 'ball' },
    { id: 'cat-clean', label: '清洁', icon: 'drop' },
    { id: 'cat-care', label: '保健', icon: 'leaf' },
    { id: 'cat-travel', label: '出行', icon: 'box' }
  ],
  dog: [
    { id: 'dog-food', label: '主粮', icon: 'bowl' },
    { id: 'dog-snack', label: '零食', icon: 'bone' },
    { id: 'dog-toy', label: '玩具', icon: 'ball' },
    { id: 'dog-clean', label: '清洁', icon: 'drop' },
    { id: 'dog-care', label: '保健', icon: 'leaf' },
    { id: 'dog-travel', label: '出行', icon: 'box' }
  ],
  all: [
    { id: 'home', label: '居家用品', icon: 'home' },
    { id: 'health', label: '营养保健', icon: 'leaf' },
    { id: 'gift', label: '礼盒', icon: 'gift' },
    { id: 'clean', label: '清洁护理', icon: 'drop' }
  ]
}

/**
 * 首页快捷入口
 */
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

export default {
  primaryCategories,
  secondaryCategories,
  quickEntries
}
