/**
 * 服务 mock
 * 与商品结构刻意拉开差异: 有 duration / storeOptions / timeSlots
 */

const img = (id, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`

export const serviceCategories = [
  { id: 'bath', label: '洗护清洁', icon: 'bath', tone: 'sage' },
  { id: 'beauty', label: '精致美容', icon: 'scissor', tone: 'coral' },
  { id: 'health', label: '健康护理', icon: 'leaf', tone: 'amber' },
  { id: 'boarding', label: '短期寄养', icon: 'home', tone: 'clay' }
]

export const services = [
  {
    id: 's-001',
    title: '基础洗护 · 标准套餐',
    category: 'bath',
    petType: 'all',
    duration: 60,
    price: 128,
    memberPrice: 108,
    rating: 4.9,
    reviewCount: 1280,
    cover: img('photo-1516734212186-a967f81ad0d7'),
    tagline: '温和洗护 · 全程 1 对 1',
    includes: [
      '深层洁净洗浴',
      '耳道护理',
      '肛腺清理',
      '基础吹干',
      '指甲修剪'
    ],
    suitable: ['短毛猫', '短毛犬 8kg 以内'],
    tips: [
      '到店前请让宠物保持空腹 1 小时',
      '带上疫苗接种本以便工作人员确认',
      '服务过程全程有视频记录'
    ],
    storeOptions: [
      { id: 'store-1', name: 'PetLife 生活馆 · 静安寺店', address: '上海市静安区南京西路 1788 号', distance: '0.8km' },
      { id: 'store-2', name: 'PetLife 生活馆 · 徐汇滨江店', address: '上海市徐汇区龙腾大道 2200 号', distance: '3.2km' }
    ],
    timeSlots: [
      { id: 't-1', label: '10:00', available: true },
      { id: 't-2', label: '11:30', available: true },
      { id: 't-3', label: '13:00', available: false },
      { id: 't-4', label: '14:30', available: true },
      { id: 't-5', label: '16:00', available: true },
      { id: 't-6', label: '17:30', available: false },
      { id: 't-7', label: '19:00', available: true }
    ],
    gradient: ['#A9C0AD', '#F4EFE4']
  },
  {
    id: 's-002',
    title: '造型美容 · 精致定制',
    category: 'beauty',
    petType: 'dog',
    duration: 120,
    price: 298,
    memberPrice: 268,
    rating: 4.8,
    reviewCount: 542,
    cover: img('photo-1541364983171-a8ba01e95cfc'),
    tagline: '一对一设计 · 气质造型',
    includes: [
      '全身 SPA 洗浴',
      '造型修剪（4 种风格可选）',
      '蓬松吹风定型',
      '香氛护理'
    ],
    suitable: ['长毛犬', '造型犬种'],
    tips: [
      '到店前请提前拍摄 3-5 张宠物照片以便沟通造型',
      '服务约需 2 小时，请预留充足时间',
      '过敏宠物请备注过敏成分'
    ],
    storeOptions: [
      { id: 'store-1', name: 'PetLife 生活馆 · 静安寺店', address: '上海市静安区南京西路 1788 号', distance: '0.8km' },
      { id: 'store-3', name: 'PetLife 生活馆 · 杨浦万象城店', address: '上海市杨浦区大连路 599 号', distance: '5.1km' }
    ],
    timeSlots: [
      { id: 't-1', label: '10:00', available: true },
      { id: 't-2', label: '12:30', available: true },
      { id: 't-3', label: '15:00', available: false },
      { id: 't-4', label: '17:30', available: true }
    ],
    gradient: ['#D97757', '#F3DFD0']
  },
  {
    id: 's-003',
    title: '驱虫护理 · 季度',
    category: 'health',
    petType: 'all',
    duration: 30,
    price: 188,
    memberPrice: 168,
    rating: 4.9,
    reviewCount: 320,
    cover: img('photo-1548199973-03cce0bbc87b'),
    tagline: '内外驱虫 · 执业兽医操作',
    includes: [
      '体重测量',
      '内外驱虫一次',
      '毛发健康检查',
      '护理建议报告'
    ],
    suitable: ['3 月龄以上猫犬'],
    tips: [
      '需提供疫苗与上次驱虫记录',
      '饭后 2 小时内不建议操作',
      '过敏体质请务必提前告知'
    ],
    storeOptions: [
      { id: 'store-1', name: 'PetLife 生活馆 · 静安寺店', address: '上海市静安区南京西路 1788 号', distance: '0.8km' }
    ],
    timeSlots: [
      { id: 't-1', label: '09:30', available: true },
      { id: 't-2', label: '11:00', available: true },
      { id: 't-3', label: '14:00', available: true },
      { id: 't-4', label: '16:30', available: true }
    ],
    gradient: ['#D4A44C', '#F2E3C1']
  },
  {
    id: 's-004',
    title: '短期寄养 · 日托',
    category: 'boarding',
    petType: 'all',
    duration: 480,
    price: 228,
    memberPrice: 198,
    rating: 4.7,
    reviewCount: 215,
    cover: img('photo-1601758228041-f3b2795255f1'),
    tagline: '全天陪伴 · 监控直连',
    includes: [
      '独立舒适房间',
      '2 次饮食照料',
      '2 次陪伴互动',
      '24h 视频监控',
      '离店体检摘要'
    ],
    suitable: ['性格温和、已绝育猫犬'],
    tips: [
      '需提供疫苗本与健康证明',
      '高龄或术后宠物请咨询客服',
      '入托期间提供每日报告'
    ],
    storeOptions: [
      { id: 'store-2', name: 'PetLife 生活馆 · 徐汇滨江店', address: '上海市徐汇区龙腾大道 2200 号', distance: '3.2km' },
      { id: 'store-3', name: 'PetLife 生活馆 · 杨浦万象城店', address: '上海市杨浦区大连路 599 号', distance: '5.1km' }
    ],
    timeSlots: [
      { id: 't-1', label: '08:00 - 18:00', available: true },
      { id: 't-2', label: '09:00 - 19:00', available: true },
      { id: 't-3', label: '10:00 - 20:00', available: false }
    ],
    gradient: ['#B58463', '#F2E2D0']
  }
]

/**
 * 近 7 天可选日期 (mock)
 */
export const serviceDates = [
  { date: '2026-04-21', label: '今天', weekday: '周二', available: true },
  { date: '2026-04-22', label: '明天', weekday: '周三', available: true },
  { date: '2026-04-23', label: '4/23', weekday: '周四', available: true },
  { date: '2026-04-24', label: '4/24', weekday: '周五', available: true },
  { date: '2026-04-25', label: '4/25', weekday: '周六', available: false },
  { date: '2026-04-26', label: '4/26', weekday: '周日', available: true },
  { date: '2026-04-27', label: '4/27', weekday: '周一', available: true }
]

export const findService = (id) => services.find((s) => s.id === id)

export default {
  serviceCategories,
  services,
  serviceDates,
  findService
}
