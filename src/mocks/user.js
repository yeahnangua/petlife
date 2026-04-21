/**
 * 用户 / 会员 / 优惠券 / 地址 mock
 */
export const user = {
  id: 'u-2001',
  nickname: '拾柒',
  avatar: 'https://i.pravatar.cc/160?img=47',
  phone: '135 **** 2788',
  level: 'PetLife · 挚友会员',
  levelProgress: 0.62,
  levelTo: '黑金会员',
  points: 1260,
  couponCount: 5,
  petCount: 3,
  joinDate: '2024-02',
  stats: {
    orderCount: 18,
    serviceCount: 7,
    savedAmount: 386
  }
}

export const coupons = [
  {
    id: 'c-01',
    type: 'fullReduce',
    amount: 30,
    threshold: 199,
    title: '全场满减券',
    scope: '全场商品可用',
    expire: '2026-05-31',
    status: 'usable',
    tag: '推荐'
  },
  {
    id: 'c-02',
    type: 'fullReduce',
    amount: 50,
    threshold: 299,
    title: '主粮专属券',
    scope: '主粮类目可用',
    expire: '2026-06-15',
    status: 'usable'
  },
  {
    id: 'c-03',
    type: 'discount',
    amount: 88,
    percent: 0.88,
    title: '新客 12 折',
    scope: '洗护 / 美容服务可用',
    expire: '2026-05-05',
    status: 'usable',
    tag: '服务'
  },
  {
    id: 'c-04',
    type: 'fullReduce',
    amount: 20,
    threshold: 99,
    title: '零食小券',
    scope: '零食类目可用',
    expire: '2026-04-30',
    status: 'expiringSoon'
  },
  {
    id: 'c-05',
    type: 'fullReduce',
    amount: 40,
    threshold: 199,
    title: '会员专享',
    scope: '全场可用',
    expire: '2026-07-01',
    status: 'usable',
    tag: '会员'
  }
]

export const addresses = [
  {
    id: 'addr-01',
    name: '拾柒',
    phone: '135 **** 2788',
    province: '上海市',
    city: '静安区',
    district: '南京西路街道',
    detail: '梅园里小区 12 号 3B 室',
    tag: '家',
    isDefault: true
  },
  {
    id: 'addr-02',
    name: '拾柒',
    phone: '135 **** 2788',
    province: '上海市',
    city: '徐汇区',
    district: '龙华街道',
    detail: '龙华中路 298 号某写字楼 18F',
    tag: '公司',
    isDefault: false
  }
]

export const memberBenefits = [
  { id: 'mb-1', title: '会员专享价', desc: '全品类 9 折起', icon: 'price', tone: 'sage' },
  { id: 'mb-2', title: '生日礼遇', desc: '双倍积分 & 专属礼盒', icon: 'gift', tone: 'coral' },
  { id: 'mb-3', title: '优先预约', desc: '热门时段优先锁定', icon: 'calendar', tone: 'amber' },
  { id: 'mb-4', title: '免费宠物体检', desc: '每季度 1 次门店体检', icon: 'leaf', tone: 'sage' },
  { id: 'mb-5', title: '积分商城', desc: '积分可兑换商品与服务', icon: 'star', tone: 'amber' },
  { id: 'mb-6', title: '专属客服', desc: '1V1 宠物顾问', icon: 'chat', tone: 'clay' }
]

export const newbiePack = {
  title: '新人 7 日礼包',
  subtitle: '3 张大额券 + 首单 8 折 + 试吃装',
  items: [
    { label: '满 199 减 50', desc: '全场通用' },
    { label: '首单 8 折', desc: '仅限新客首单' },
    { label: '¥0 试吃装', desc: '3 款明星商品' },
    { label: '专属客服', desc: '7 天贴身服务' }
  ]
}

export default {
  user,
  coupons,
  addresses,
  memberBenefits,
  newbiePack
}
