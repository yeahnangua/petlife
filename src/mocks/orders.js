/**
 * 订单 mock
 * 区分商品订单 productOrder 与 服务订单 serviceOrder
 */
import { products, findProduct } from './products'
import { services, findService } from './services'

export const orderStatusTabs = [
  { id: 'all', label: '全部' },
  { id: 'pendingPayment', label: '待支付' },
  { id: 'pendingShipment', label: '待发货' },
  { id: 'pendingReceipt', label: '待收货' },
  { id: 'pendingService', label: '待服务' },
  { id: 'completed', label: '已完成' }
]

export const productOrders = [
  {
    id: 'po-20260418001',
    kind: 'product',
    status: 'pendingShipment',
    statusLabel: '待发货',
    createdAt: '2026-04-18 20:31',
    totalAmount: 352,
    itemCount: 2,
    items: [
      { ...findProduct('p-001'), quantity: 1, specLabel: '3kg · 鸡肉' },
      { ...findProduct('p-002'), quantity: 1, specLabel: '120g' }
    ],
    address: '上海市静安区南京西路街道 梅园里…'
  },
  {
    id: 'po-20260402013',
    kind: 'product',
    status: 'completed',
    statusLabel: '已完成',
    createdAt: '2026-04-02 12:08',
    totalAmount: 188,
    itemCount: 2,
    items: [
      { ...findProduct('p-003'), quantity: 2, specLabel: '2.5kg · 绿茶' }
    ],
    address: '上海市徐汇区龙华街道 龙华中路…'
  },
  {
    id: 'po-20260420007',
    kind: 'product',
    status: 'pendingPayment',
    statusLabel: '待支付',
    createdAt: '2026-04-20 11:02',
    totalAmount: 328,
    itemCount: 1,
    items: [
      { ...findProduct('p-005'), quantity: 1, specLabel: '5kg · 成犬' }
    ],
    address: '上海市静安区南京西路街道 梅园里…'
  }
]

export const serviceOrders = [
  {
    id: 'so-20260422001',
    kind: 'service',
    status: 'pendingService',
    statusLabel: '待服务',
    createdAt: '2026-04-19 17:12',
    totalAmount: 128,
    service: findService('s-001'),
    pet: { name: '橘子', type: 'cat', avatar: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=200&q=70' },
    scheduledAt: '2026-04-22 11:30',
    store: 'PetLife · 静安寺店'
  },
  {
    id: 'so-20260410002',
    kind: 'service',
    status: 'completed',
    statusLabel: '已完成',
    createdAt: '2026-04-08 09:45',
    totalAmount: 268,
    service: findService('s-002'),
    pet: { name: 'Mocha', type: 'dog', avatar: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=200&q=70' },
    scheduledAt: '2026-04-10 14:00',
    store: 'PetLife · 徐汇滨江店'
  }
]

export const allOrders = [...productOrders, ...serviceOrders].sort((a, b) =>
  a.createdAt < b.createdAt ? 1 : -1
)

export default {
  orderStatusTabs,
  productOrders,
  serviceOrders,
  allOrders
}
