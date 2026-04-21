function formatAddress(order = {}) {
  return [order.receiver_region_snapshot, order.receiver_address_snapshot].filter(Boolean).join(' ')
}

function adaptOrderItem(item = {}) {
  return {
    id: `${item.product_id}-${item.spec_label_snapshot}`,
    productId: item.product_id,
    title: item.product_title_snapshot,
    cover: item.product_cover_snapshot,
    specLabel: item.spec_label_snapshot,
    quantity: item.quantity,
    unitPrice: item.unit_price_snapshot,
    totalAmount: item.line_total
  }
}

export function adaptOrder(order = {}) {
  const items = Array.isArray(order.items) ? order.items.map(adaptOrderItem) : []

  return {
    id: order.id,
    kind: 'product',
    orderNo: order.order_no,
    status: order.status,
    statusLabel: order.status_label,
    createdAt: order.created_at,
    totalAmount: order.total_amount,
    itemCount: order.item_count ?? items.reduce((sum, item) => sum + (item.quantity || 0), 0),
    address: formatAddress(order),
    remark: order.remark,
    items
  }
}

export function adaptBooking(booking = {}) {
  return {
    id: booking.id,
    kind: 'service',
    orderNo: booking.booking_no,
    status: booking.status,
    statusLabel: booking.status_label,
    createdAt: booking.created_at,
    totalAmount: booking.service_price_snapshot,
    service: {
      title: booking.service_title_snapshot,
      cover: booking.service_cover_snapshot
    },
    pet: {
      name: booking.pet_name_snapshot,
      avatar: booking.pet_avatar_snapshot
    },
    scheduledAt: [booking.booking_date, booking.time_slot_label_snapshot].filter(Boolean).join(' '),
    store: booking.store_name_snapshot
  }
}
