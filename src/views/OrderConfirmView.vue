<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import EmptyState from '@/components/EmptyState.vue'
import { addresses, coupons } from '@/mocks'
import { formatCurrency, getOrderPriceBreakdown } from '@/lib/pricing'
import { useCartStore } from '@/stores/cart'

const router = useRouter()
const cartStore = useCartStore()

const note = ref('')
const selectedAddressId = ref(addresses.find((item) => item.isDefault)?.id ?? addresses[0]?.id ?? '')
const selectedCouponId = ref(coupons[0]?.id ?? '')

const selectedItems = computed(() => cartStore.selectedItems)
const selectedAddress = computed(() => addresses.find((item) => item.id === selectedAddressId.value))
const selectedCoupon = computed(() => coupons.find((item) => item.id === selectedCouponId.value) ?? null)
const priceBreakdown = computed(() => getOrderPriceBreakdown(selectedItems.value, selectedCoupon.value))

function submitOrder() {
  router.push({ path: '/orders', query: { status: 'pendingPayment', created: 'product' } })
}
</script>

<template>
  <div class="order-confirm page-pad page-stack page-with-submit-bar">
    <template v-if="selectedItems.length">
      <section class="surface-card order-confirm__card">
        <div class="section-heading">
          <h2 class="section-heading__title">收货地址</h2>
        </div>
        <div class="order-confirm__address-list">
          <label
            v-for="address in addresses"
            :key="address.id"
            class="order-confirm__option"
            :class="{ 'is-active': selectedAddressId === address.id }"
          >
            <input v-model="selectedAddressId" type="radio" :value="address.id" class="sr-only" />
            <strong>{{ address.tag }} · {{ address.name }}</strong>
            <p>{{ address.province }}{{ address.city }}{{ address.district }} {{ address.detail }}</p>
          </label>
        </div>
      </section>

      <section class="surface-card order-confirm__card">
        <div class="section-heading">
          <h2 class="section-heading__title">商品清单</h2>
        </div>
        <article
          v-for="item in selectedItems"
          :key="item.id"
          class="order-confirm__item"
        >
          <img :src="item.product.cover" :alt="item.product.title" />
          <div>
            <strong>{{ item.product.title }}</strong>
            <p>{{ item.specLabel }} · x{{ item.quantity }}</p>
          </div>
          <span>{{ formatCurrency((item.product.memberPrice ?? item.product.price) * item.quantity) }}</span>
        </article>
      </section>

      <section class="surface-card order-confirm__card">
        <div class="section-heading">
          <h2 class="section-heading__title">优惠券</h2>
        </div>
        <div class="order-confirm__coupon-list">
          <label
            v-for="coupon in coupons"
            :key="coupon.id"
            class="order-confirm__option"
            :class="{ 'is-active': selectedCouponId === coupon.id }"
          >
            <input v-model="selectedCouponId" type="radio" :value="coupon.id" class="sr-only" />
            <strong>{{ coupon.title }}</strong>
            <p>{{ coupon.scope }} · {{ coupon.amount }} 元优惠</p>
          </label>
        </div>
      </section>

      <section class="surface-card order-confirm__card">
        <div class="section-heading">
          <h2 class="section-heading__title">配送与备注</h2>
        </div>
        <div class="order-confirm__field">
          <span>配送方式</span>
          <strong>宠物安心配送 · 次日达</strong>
        </div>
        <label class="order-confirm__textarea">
          <span>订单备注</span>
          <textarea v-model="note" rows="3" placeholder="告诉门店你的额外需求" />
        </label>
      </section>

      <section class="surface-card order-confirm__card">
        <div class="order-confirm__breakdown">
          <div><span>商品小计</span><strong>{{ formatCurrency(priceBreakdown.subtotal) }}</strong></div>
          <div><span>配送费</span><strong>{{ formatCurrency(priceBreakdown.shipping) }}</strong></div>
          <div><span>优惠抵扣</span><strong>-{{ formatCurrency(priceBreakdown.discount) }}</strong></div>
          <div class="is-total"><span>应付金额</span><strong>{{ formatCurrency(priceBreakdown.payable) }}</strong></div>
        </div>
      </section>

      <section class="order-confirm__submit page-submit-bar surface-card">
        <div>
          <p class="section-heading__meta">{{ selectedAddress?.tag }} · {{ selectedAddress?.phone }}</p>
          <h2 class="section-heading__title">{{ formatCurrency(priceBreakdown.payable) }}</h2>
        </div>
        <button type="button" class="button-primary" @click="submitOrder">
          提交订单
        </button>
      </section>
    </template>

    <EmptyState
      v-else
      title="没有可提交的商品"
      description="先从购物车里勾选商品，再来确认订单。"
      action-label="返回购物车"
      @action="router.push('/cart')"
    />
  </div>
</template>

<style scoped>
.order-confirm__card,
.order-confirm__submit {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4);
}

.order-confirm__address-list,
.order-confirm__coupon-list {
  display: grid;
  gap: var(--space-3);
}

.order-confirm__option {
  display: grid;
  gap: 6px;
  padding: var(--space-3);
  border: 1px solid transparent;
  border-radius: var(--radius-lg);
  background: var(--color-surface-soft);
}

.order-confirm__option.is-active {
  border-color: var(--color-primary);
  background: var(--color-primary-tint);
}

.order-confirm__option p,
.order-confirm__item p {
  color: var(--color-text-soft);
  font-size: var(--text-sm);
}

.order-confirm__item {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) auto;
  gap: var(--space-3);
  align-items: center;
}

.order-confirm__item img {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-md);
  object-fit: cover;
}

.order-confirm__item span,
.order-confirm__breakdown .is-total strong {
  color: var(--color-coral);
}

.order-confirm__field,
.order-confirm__breakdown > div,
.order-confirm__submit {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.order-confirm__textarea {
  display: grid;
  gap: var(--space-2);
}

.order-confirm__textarea textarea {
  width: 100%;
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  background: var(--color-surface-soft);
  resize: vertical;
}

.order-confirm__breakdown {
  display: grid;
  gap: var(--space-3);
}

.order-confirm__breakdown span {
  color: var(--color-text-soft);
}
</style>
