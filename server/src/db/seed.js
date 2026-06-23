import { fileURLToPath } from 'node:url'
import { products as catalogProducts } from '../../../src/mocks/products.js'
import { loadEnv } from '../config/env.js'
import { createDatabase } from './index.js'
import { migrate } from './migrate.js'

const timestamp = '2026-04-21 09:00:00'

const productById = new Map(catalogProducts.map((product) => [product.id, product]))
const productCategoryIds = {
  food: 'cat-food',
  snack: 'cat-snack',
  litter: 'cat-litter',
  toy: 'all-toy',
  clean: 'all-clean',
  travel: 'all-travel',
  care: 'all-care',
  home: 'all-home'
}
const productStockById = {
  'p-001': 48,
  'p-002': 120,
  'p-008': 0
}

function coverForCategory(category) {
  return catalogProducts.find((product) => product.category === category)?.cover || catalogProducts[0].cover
}

const users = [
  {
    id: 'u_demo_001',
    nickname: '拾柒',
    phone: '13527882788',
    avatar_url: 'https://i.pravatar.cc/160?img=47',
    member_level: 'PetLife · 挚友会员',
    points: 1260,
    created_at: timestamp,
    updated_at: timestamp
  }
]

const addresses = [
  {
    id: 'addr_001',
    user_id: 'u_demo_001',
    receiver_name: '拾柒',
    receiver_phone: '13527882788',
    region: '上海市 静安区 南京西路街道',
    detail_address: '梅园里小区 12 号 3B 室',
    tag: '家',
    is_default: 1,
    created_at: timestamp,
    updated_at: timestamp
  }
]

const pets = [
  {
    id: 'pet_001',
    user_id: 'u_demo_001',
    name: '橘子',
    type: 'cat',
    breed: '中华田园猫 · 橘猫',
    gender: 'male',
    birthday: '2023-06-12',
    weight: 5.2,
    neutered: 1,
    allergies_json: JSON.stringify(['牛肉']),
    preferences_json: JSON.stringify(['洗护清洁', '驱虫护理']),
    avatar_url: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=240&q=70',
    color: '#D97757',
    created_at: timestamp,
    updated_at: timestamp
  },
  {
    id: 'pet_002',
    user_id: 'u_demo_001',
    name: '小饭团',
    type: 'cat',
    breed: '英国短毛猫 · 蓝白',
    gender: 'female',
    birthday: '2024-08-30',
    weight: 3.8,
    neutered: 1,
    allergies_json: JSON.stringify([]),
    preferences_json: JSON.stringify(['造型美容']),
    avatar_url: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=240&q=70',
    color: '#8AA3B4',
    created_at: timestamp,
    updated_at: timestamp
  }
]

const categories = [
  {
    id: 'cat-food',
    name: '主粮',
    slug: 'food',
    pet_type: 'all',
    sort_order: 1,
    cover_url: coverForCategory('food'),
    is_enabled: 1,
    created_at: timestamp,
    updated_at: timestamp
  },
  {
    id: 'cat-snack',
    name: '零食',
    slug: 'snack',
    pet_type: 'all',
    sort_order: 2,
    cover_url: coverForCategory('snack'),
    is_enabled: 1,
    created_at: timestamp,
    updated_at: timestamp
  },
  {
    id: 'cat-litter',
    name: '猫砂',
    slug: 'litter',
    pet_type: 'cat',
    sort_order: 3,
    cover_url: coverForCategory('litter'),
    is_enabled: 1,
    created_at: timestamp,
    updated_at: timestamp
  },
  {
    id: 'all-toy',
    name: '玩具',
    slug: 'toy',
    pet_type: 'all',
    sort_order: 4,
    cover_url: coverForCategory('toy'),
    is_enabled: 1,
    created_at: timestamp,
    updated_at: timestamp
  },
  {
    id: 'all-clean',
    name: '清洁护理',
    slug: 'clean',
    pet_type: 'all',
    sort_order: 5,
    cover_url: coverForCategory('clean'),
    is_enabled: 1,
    created_at: timestamp,
    updated_at: timestamp
  },
  {
    id: 'all-travel',
    name: '出行用品',
    slug: 'travel',
    pet_type: 'all',
    sort_order: 6,
    cover_url: coverForCategory('travel'),
    is_enabled: 1,
    created_at: timestamp,
    updated_at: timestamp
  },
  {
    id: 'all-care',
    name: '营养保健',
    slug: 'care',
    pet_type: 'all',
    sort_order: 7,
    cover_url: coverForCategory('care'),
    is_enabled: 1,
    created_at: timestamp,
    updated_at: timestamp
  },
  {
    id: 'all-home',
    name: '居家用品',
    slug: 'home',
    pet_type: 'all',
    sort_order: 8,
    cover_url: coverForCategory('home'),
    is_enabled: 1,
    created_at: timestamp,
    updated_at: timestamp
  }
]

const products = catalogProducts.map((product, index) => ({
  id: product.id,
  category_id: productCategoryIds[product.category],
  title: product.title,
  subtitle: product.subtitle,
  pet_type: product.petType,
  price: product.price,
  member_price: product.memberPrice ?? product.price,
  original_price: product.originalPrice ?? product.price,
  stock: productStockById[product.id] ?? (product.stockStatus === 'soldOut' ? 0 : 36 + index * 7),
  stock_status: product.stockStatus,
  badge: product.badge || '',
  tags_json: JSON.stringify(product.tags || []),
  specs_json: JSON.stringify(product.specs || []),
  summary_json: JSON.stringify(product.summary || []),
  suitable_text: product.suitable || '',
  cover_url: product.cover,
  status: 'active',
  rating: product.rating ?? 0,
  review_count: product.reviewCount ?? 0,
  sold_count: product.sold ?? 0,
  created_at: timestamp,
  updated_at: timestamp
}))

let productImageSequence = 1
const productImages = catalogProducts.flatMap((product) => {
  const images = product.images?.length ? product.images : [product.cover]

  return images.map((imageUrl, index) => {
    const id = `pi_${String(productImageSequence).padStart(3, '0')}`
    productImageSequence += 1

    return {
      id,
      product_id: product.id,
      image_url: imageUrl,
      sort_order: index + 1
    }
  })
})

const services = [
  {
    id: 's-001',
    title: '基础洗护 · 标准套餐',
    subtitle: '温和洗护 · 全程 1 对 1',
    pet_type: 'all',
    price: 128,
    member_price: 108,
    original_price: 148,
    duration_minutes: 60,
    badge: '热门',
    highlights_json: JSON.stringify([
      '深层洁净洗浴',
      '耳道护理',
      '肛腺清理',
      '基础吹干',
      '指甲修剪'
    ]),
    summary_json: JSON.stringify(['短毛猫', '短毛犬 8kg 以内']),
    notice_json: JSON.stringify([
      '到店前请让宠物保持空腹 1 小时',
      '带上疫苗接种本以便工作人员确认',
      '服务过程全程有视频记录'
    ]),
    cover_url: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=800&q=70',
    status: 'active',
    rating: 4.9,
    review_count: 1280,
    created_at: timestamp,
    updated_at: timestamp
  },
  {
    id: 's-002',
    title: '造型美容 · 精致定制',
    subtitle: '一对一设计 · 气质造型',
    pet_type: 'dog',
    price: 298,
    member_price: 268,
    original_price: 338,
    duration_minutes: 120,
    badge: '精选',
    highlights_json: JSON.stringify([
      '全身 SPA 洗浴',
      '造型修剪（4 种风格可选）',
      '蓬松吹风定型',
      '香氛护理'
    ]),
    summary_json: JSON.stringify(['长毛犬', '造型犬种']),
    notice_json: JSON.stringify([
      '到店前请提前拍摄 3-5 张宠物照片以便沟通造型',
      '服务约需 2 小时，请预留充足时间',
      '过敏宠物请备注过敏成分'
    ]),
    cover_url: 'https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?auto=format&fit=crop&w=800&q=70',
    status: 'active',
    rating: 4.8,
    review_count: 542,
    created_at: timestamp,
    updated_at: timestamp
  }
]

const serviceImages = [
  { id: 'si_001', service_id: 's-001', image_url: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=800&q=70', sort_order: 1 },
  { id: 'si_002', service_id: 's-001', image_url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=70', sort_order: 2 },
  { id: 'si_003', service_id: 's-002', image_url: 'https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?auto=format&fit=crop&w=800&q=70', sort_order: 1 }
]

const stores = [
  {
    id: 'store-1',
    name: 'PetLife 生活馆 · 静安寺店',
    phone: '021-62081234',
    address: '上海市静安区南京西路 1788 号',
    business_hours: '10:00-20:00',
    cover_url: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=800&q=70',
    status: 'active',
    created_at: timestamp,
    updated_at: timestamp
  },
  {
    id: 'store-2',
    name: 'PetLife 生活馆 · 徐汇滨江店',
    phone: '021-64191234',
    address: '上海市徐汇区龙腾大道 2200 号',
    business_hours: '10:00-20:00',
    cover_url: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=800&q=70',
    status: 'active',
    created_at: timestamp,
    updated_at: timestamp
  }
]

const timeSlots = [
  {
    id: 't-1',
    label: '10:00',
    start_time: '10:00',
    end_time: '11:00',
    capacity: 3,
    sort_order: 1,
    is_enabled: 1,
    created_at: timestamp,
    updated_at: timestamp
  },
  {
    id: 't-2',
    label: '11:30',
    start_time: '11:30',
    end_time: '12:30',
    capacity: 1,
    sort_order: 2,
    is_enabled: 1,
    created_at: timestamp,
    updated_at: timestamp
  },
  {
    id: 't-3',
    label: '14:30',
    start_time: '14:30',
    end_time: '15:30',
    capacity: 2,
    sort_order: 3,
    is_enabled: 1,
    created_at: timestamp,
    updated_at: timestamp
  }
]

const cartItems = [
  {
    id: 'ci_001',
    user_id: 'u_demo_001',
    product_id: 'p-001',
    spec_key: '3kg|鸡肉',
    spec_label: '3kg · 鸡肉',
    quantity: 1,
    selected: 1,
    created_at: timestamp,
    updated_at: timestamp
  },
  {
    id: 'ci_002',
    user_id: 'u_demo_001',
    product_id: 'p-008',
    spec_key: '苔绿色',
    spec_label: '苔绿色',
    quantity: 1,
    selected: 0,
    created_at: timestamp,
    updated_at: timestamp
  }
]

const orders = [
  {
    id: 'order_001',
    order_no: 'PO20260402013',
    user_id: 'u_demo_001',
    status: 'completed',
    status_label: '已完成',
    total_amount: 248,
    remark: '工作日请放前台',
    receiver_name_snapshot: '拾柒',
    receiver_phone_snapshot: '13527882788',
    receiver_region_snapshot: '上海市 静安区 南京西路街道',
    receiver_address_snapshot: '梅园里小区 12 号 3B 室',
    created_at: '2026-04-02 12:08:00',
    updated_at: '2026-04-02 12:08:00'
  }
]

const orderItems = [
  {
    id: 'order_item_001',
    order_id: 'order_001',
    product_id: 'p-001',
    product_title_snapshot: productById.get('p-001').title,
    product_cover_snapshot: productById.get('p-001').cover,
    spec_label_snapshot: '3kg · 鸡肉',
    unit_price_snapshot: 248,
    quantity: 1,
    line_total: 248
  }
]

const bookings = [
  {
    id: 'booking_001',
    booking_no: 'BK20260410002',
    user_id: 'u_demo_001',
    pet_id: 'pet_001',
    pet_name_snapshot: '橘子',
    pet_type_snapshot: 'cat',
    service_id: 's-001',
    service_title_snapshot: '基础洗护 · 标准套餐',
    service_cover_snapshot: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=800&q=70',
    service_price_snapshot: 108,
    store_id: 'store-1',
    store_name_snapshot: 'PetLife 生活馆 · 静安寺店',
    time_slot_id: 't-2',
    time_slot_label_snapshot: '11:30',
    booking_date: '2026-04-10',
    status: 'completed',
    status_label: '已完成',
    contact_phone: '13527882788',
    note: '猫咪胆小，请轻声安抚。',
    created_at: '2026-04-08 09:45:00',
    updated_at: '2026-04-10 13:30:00'
  }
]

function insertRows(db, tableName, columns, rows) {
  const placeholders = columns.map((column) => `@${column}`).join(', ')
  const statement = db.prepare(
    `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`
  )

  for (const row of rows) {
    statement.run(row)
  }
}

export function seed(db) {
  const applySeed = db.transaction(() => {
    db.exec(`
      DELETE FROM order_items;
      DELETE FROM orders;
      DELETE FROM bookings;
      DELETE FROM cart_items;
      DELETE FROM product_images;
      DELETE FROM service_images;
      DELETE FROM products;
      DELETE FROM services;
      DELETE FROM categories;
      DELETE FROM time_slots;
      DELETE FROM stores;
      DELETE FROM pets;
      DELETE FROM addresses;
      DELETE FROM users;
    `)

    insertRows(db, 'users', ['id', 'nickname', 'phone', 'avatar_url', 'member_level', 'points', 'created_at', 'updated_at'], users)
    insertRows(db, 'addresses', ['id', 'user_id', 'receiver_name', 'receiver_phone', 'region', 'detail_address', 'tag', 'is_default', 'created_at', 'updated_at'], addresses)
    insertRows(db, 'pets', ['id', 'user_id', 'name', 'type', 'breed', 'gender', 'birthday', 'weight', 'neutered', 'allergies_json', 'preferences_json', 'avatar_url', 'color', 'created_at', 'updated_at'], pets)
    insertRows(db, 'categories', ['id', 'name', 'slug', 'pet_type', 'sort_order', 'cover_url', 'is_enabled', 'created_at', 'updated_at'], categories)
    insertRows(db, 'products', ['id', 'category_id', 'title', 'subtitle', 'pet_type', 'price', 'member_price', 'original_price', 'stock', 'stock_status', 'badge', 'tags_json', 'specs_json', 'summary_json', 'suitable_text', 'cover_url', 'status', 'rating', 'review_count', 'sold_count', 'created_at', 'updated_at'], products)
    insertRows(db, 'product_images', ['id', 'product_id', 'image_url', 'sort_order'], productImages)
    insertRows(db, 'services', ['id', 'title', 'subtitle', 'pet_type', 'price', 'member_price', 'original_price', 'duration_minutes', 'badge', 'highlights_json', 'summary_json', 'notice_json', 'cover_url', 'status', 'rating', 'review_count', 'created_at', 'updated_at'], services)
    insertRows(db, 'service_images', ['id', 'service_id', 'image_url', 'sort_order'], serviceImages)
    insertRows(db, 'stores', ['id', 'name', 'phone', 'address', 'business_hours', 'cover_url', 'status', 'created_at', 'updated_at'], stores)
    insertRows(db, 'time_slots', ['id', 'label', 'start_time', 'end_time', 'capacity', 'sort_order', 'is_enabled', 'created_at', 'updated_at'], timeSlots)
    insertRows(db, 'cart_items', ['id', 'user_id', 'product_id', 'spec_key', 'spec_label', 'quantity', 'selected', 'created_at', 'updated_at'], cartItems)
    insertRows(db, 'orders', ['id', 'order_no', 'user_id', 'status', 'status_label', 'total_amount', 'remark', 'receiver_name_snapshot', 'receiver_phone_snapshot', 'receiver_region_snapshot', 'receiver_address_snapshot', 'created_at', 'updated_at'], orders)
    insertRows(db, 'order_items', ['id', 'order_id', 'product_id', 'product_title_snapshot', 'product_cover_snapshot', 'spec_label_snapshot', 'unit_price_snapshot', 'quantity', 'line_total'], orderItems)
    insertRows(db, 'bookings', ['id', 'booking_no', 'user_id', 'pet_id', 'pet_name_snapshot', 'pet_type_snapshot', 'service_id', 'service_title_snapshot', 'service_cover_snapshot', 'service_price_snapshot', 'store_id', 'store_name_snapshot', 'time_slot_id', 'time_slot_label_snapshot', 'booking_date', 'status', 'status_label', 'contact_phone', 'note', 'created_at', 'updated_at'], bookings)
  })

  applySeed()
}

function runCli() {
  const config = loadEnv()
  const db = createDatabase(config.dbPath)

  try {
    migrate(db)
    seed(db)
    console.log(`Seeded database at ${config.dbPath}`)
  } finally {
    db.close()
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli()
}
