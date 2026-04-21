/**
 * 购物车 mock
 * 仅承载商品; 服务预约走独立链路, 不混入此处.
 */
import { findProduct } from './products'

export const cartItems = [
  {
    id: 'ci-1',
    productId: 'p-001',
    product: findProduct('p-001'),
    specLabel: '3kg · 鸡肉',
    quantity: 1,
    selected: true,
    valid: true
  },
  {
    id: 'ci-2',
    productId: 'p-002',
    product: findProduct('p-002'),
    specLabel: '120g',
    quantity: 2,
    selected: true,
    valid: true
  },
  {
    id: 'ci-3',
    productId: 'p-007',
    product: findProduct('p-007'),
    specLabel: '敏感肌',
    quantity: 1,
    selected: false,
    valid: true
  },
  {
    id: 'ci-4',
    productId: 'p-008',
    product: findProduct('p-008'),
    specLabel: '苔绿色',
    quantity: 1,
    selected: false,
    valid: false,
    invalidReason: '商品已售罄'
  }
]

export default { cartItems }
