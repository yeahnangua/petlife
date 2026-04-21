function findOptionLabel(options, value, fallback = '') {
  const match = options.find((item) => item.value === value)
  return match?.label || fallback || String(value ?? '')
}

export const petTypeOptions = [
  { value: 'cat', label: '猫咪' },
  { value: 'dog', label: '狗狗' },
  { value: 'all', label: '通用' }
]

export const publishStatusOptions = [
  { value: 'active', label: '启用中' },
  { value: 'inactive', label: '已停用' }
]

export const publishStatusFilterOptions = [
  { value: 'all', label: '全部状态' },
  ...publishStatusOptions
]

export const stockStatusOptions = [
  { value: 'inStock', label: '有库存' },
  { value: 'soldOut', label: '已售罄' }
]

export const orderStatusOptions = [
  { value: 'pendingShipment', label: '待发货' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' }
]

export const orderStatusFilterOptions = [
  { value: '', label: '全部状态' },
  ...orderStatusOptions
]

export const bookingStatusOptions = [
  { value: 'pendingService', label: '待服务' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' }
]

export const bookingStatusFilterOptions = [
  { value: '', label: '全部状态' },
  ...bookingStatusOptions
]

export const enabledFilterOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'true', label: '已启用' },
  { value: 'false', label: '已停用' }
]

export function getPetTypeLabel(value) {
  return findOptionLabel(petTypeOptions, value)
}

export function getPublishStatusLabel(value) {
  return findOptionLabel(publishStatusOptions, value)
}

export function getStockStatusLabel(value) {
  return findOptionLabel(stockStatusOptions, value)
}

export function getOrderStatusLabel(value) {
  return findOptionLabel(orderStatusOptions, value)
}

export function getBookingStatusLabel(value) {
  return findOptionLabel(bookingStatusOptions, value)
}

export function getEnabledLabel(value) {
  return value ? '已启用' : '已停用'
}

export function getDisplayStatusLabel(status, label = '') {
  if (label && label !== status) {
    return label
  }

  if (status === 'pendingShipment' || status === 'completed' || status === 'cancelled') {
    return getOrderStatusLabel(status)
  }

  if (status === 'pendingService') {
    return getBookingStatusLabel(status)
  }

  if (status === 'active' || status === 'inactive') {
    return getPublishStatusLabel(status)
  }

  return label || status
}
