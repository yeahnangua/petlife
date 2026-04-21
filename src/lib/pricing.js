export function formatCurrency(value) {
  return `¥${Number(value || 0).toFixed(0)}`
}

export function getCartSummary(items = []) {
  const validSelected = items.filter((item) => item.valid && item.selected)

  return {
    selectedCount: validSelected.reduce((sum, item) => sum + item.quantity, 0),
    invalidCount: items.filter((item) => !item.valid).length,
    subtotal: validSelected.reduce(
      (sum, item) => sum + item.quantity * (item.product.memberPrice ?? item.product.price),
      0
    ),
    total: validSelected.reduce(
      (sum, item) => sum + item.quantity * (item.product.memberPrice ?? item.product.price),
      0
    )
  }
}

export function getOrderPriceBreakdown(items = [], coupon = null) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * (item.product.memberPrice ?? item.product.price),
    0
  )
  const discount = coupon?.amount ?? 0
  const shipping = subtotal > 0 ? 12 : 0

  return {
    subtotal,
    shipping,
    discount,
    payable: Math.max(subtotal + shipping - discount, 0)
  }
}
