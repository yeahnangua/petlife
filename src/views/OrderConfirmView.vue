<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import EmptyState from '@/components/EmptyState.vue'
import IconSvg from '@/components/IconSvg.vue'
import PriceText from '@/components/PriceText.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import StickyActionBar from '@/components/StickyActionBar.vue'
import { getAddresses, createOrder } from '@/api/user'
import { adaptAddress } from '@/adapters/profile'
import { formatCurrency, getOrderPriceBreakdown } from '@/lib/pricing'
import { useCartStore } from '@/stores/cart'

const router = useRouter()
const cartStore = useCartStore()

const loading = ref(false)
const note = ref('')
const addresses = ref([])
const selectedAddressId = ref('')
const submitError = ref('')
const submitting = ref(false)

const selectedItems = computed(() => cartStore.selectedItems)
const selectedAddress = computed(
  () => addresses.value.find((item) => item.id === selectedAddressId.value) ?? null
)
const priceBreakdown = computed(() => getOrderPriceBreakdown(selectedItems.value))

watch(
  addresses,
  (value) => {
    if (!value.length) {
      selectedAddressId.value = ''
      return
    }

    if (value.some((item) => item.id === selectedAddressId.value)) {
      return
    }

    selectedAddressId.value = value.find((item) => item.isDefault)?.id ?? value[0]?.id ?? ''
  },
  { immediate: true }
)

async function loadPage() {
  loading.value = true
  submitError.value = ''

  try {
    const [cartData, addressData] = await Promise.all([
      cartStore.fetchCart(),
      getAddresses()
    ])

    void cartData
    addresses.value = (addressData.list || []).map(adaptAddress)
  } catch (requestError) {
    submitError.value = requestError instanceof Error ? requestError.message : '订单确认页加载失败'
  } finally {
    loading.value = false
  }
}

async function submitOrder() {
  if (!selectedAddressId.value) {
    submitError.value = '下单前需要先添加收货地址'
    return
  }

  submitting.value = true
  submitError.value = ''

  try {
    const data = await createOrder({
      address_id: selectedAddressId.value,
      remark: note.value.trim()
    })
    await cartStore.fetchCart()
    router.replace({
      path: `/orders/${data.order.id}`,
      query: { backTo: '/' }
    })
  } catch (requestError) {
    submitError.value = requestError instanceof Error ? requestError.message : '提交订单失败'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadPage()
})
</script>

<template>
  <div class="oconfirm page-pad page-with-submit-bar">
    <div v-if="loading" class="oconfirm__stack">
      <SkeletonBlock variant="card" />
      <SkeletonBlock variant="text" :lines="3" />
    </div>

    <template v-else-if="selectedItems.length">
      <div class="oconfirm__stack">
        <!-- 收货地址 -->
        <section class="oconfirm__card surface-card">
          <header class="oconfirm__card-head">
            <h2 class="oconfirm__card-title">收货地址</h2>
            <button type="button" class="oconfirm__manage" @click="router.push('/addresses')">
              管理地址
              <IconSvg name="arrow-right" :size="12" :stroke="2.4" />
            </button>
          </header>

          <div v-if="addresses.length" class="oconfirm__addresses">
            <label
              v-for="address in addresses"
              :key="address.id"
              class="oconfirm__address"
              :class="{ 'oconfirm__address--active': selectedAddressId === address.id }"
            >
              <input v-model="selectedAddressId" type="radio" :value="address.id" class="sr-only" />
              <span class="oconfirm__address-radio" />
              <span class="oconfirm__address-body">
                <strong>
                  {{ address.name }}
                  <i v-if="address.tag" class="oconfirm__address-tag">{{ address.tag }}</i>
                  <i v-if="address.isDefault" class="oconfirm__address-tag oconfirm__address-tag--default">默认</i>
                </strong>
                <small>{{ address.phone }}</small>
                <p>{{ address.displayAddress }}</p>
              </span>
            </label>
          </div>
          <button v-else type="button" class="oconfirm__no-address" @click="router.push('/addresses/new')">
            <IconSvg name="plus" :size="16" :stroke="2.2" />
            还没有收货地址，点击新增
          </button>

          <p v-if="submitError" class="oconfirm__error">{{ submitError }}</p>
        </section>

        <!-- 商品清单 -->
        <section class="oconfirm__card surface-card">
          <h2 class="oconfirm__card-title">商品清单</h2>
          <article v-for="item in selectedItems" :key="item.id" class="oconfirm__item">
            <img :src="item.product.cover" :alt="item.product.title" loading="lazy" />
            <div class="oconfirm__item-info">
              <strong>{{ item.product.title }}</strong>
              <p>{{ item.specLabel }} · x{{ item.quantity }}</p>
            </div>
            <PriceText
              :value="(item.product.memberPrice ?? item.product.price) * item.quantity"
              size="sm"
            />
          </article>
        </section>

        <!-- 配送与备注 -->
        <section class="oconfirm__card surface-card">
          <h2 class="oconfirm__card-title">配送与备注</h2>
          <div class="oconfirm__row">
            <span class="oconfirm__row-label">
              <IconSvg name="truck" :size="15" :stroke="1.8" />
              配送方式
            </span>
            <strong class="oconfirm__row-value">宠物安心配送 · 次日达</strong>
          </div>
          <label class="oconfirm__note">
            <span>订单备注</span>
            <textarea v-model="note" rows="3" placeholder="告诉门店你的额外需求" />
          </label>
        </section>

        <!-- 金额明细 -->
        <section class="oconfirm__card surface-card">
          <h2 class="oconfirm__card-title">金额明细</h2>
          <div class="oconfirm__breakdown">
            <div><span>商品小计</span><strong>{{ formatCurrency(priceBreakdown.subtotal) }}</strong></div>
            <div><span>配送费</span><strong>{{ formatCurrency(priceBreakdown.shipping) }}</strong></div>
            <div class="oconfirm__total">
              <span>应付金额</span>
              <PriceText :value="priceBreakdown.payable" size="md" />
            </div>
          </div>
        </section>
      </div>

      <StickyActionBar>
        <div class="oconfirm__bar-info">
          <span class="oconfirm__bar-meta">
            {{ selectedAddress ? `${selectedAddress.tag || '寄送'} · ${selectedAddress.phone}` : '请先选择地址' }}
          </span>
          <PriceText :value="priceBreakdown.payable" size="lg" />
        </div>
        <button
          type="button"
          class="button-primary oconfirm__submit"
          :disabled="submitting"
          @click="submitOrder"
        >
          {{ submitting ? '提交中…' : '提交订单' }}
        </button>
      </StickyActionBar>
    </template>

    <EmptyState
      v-else
      icon="cart"
      title="没有可提交的商品"
      description="先从购物车里勾选商品，再来确认订单。"
      action-label="返回购物车"
      @action="router.push('/cart')"
    />
  </div>
</template>

<style scoped>
.oconfirm {
  padding-top: var(--space-2);
  padding-bottom: var(--space-6);
}

.oconfirm__stack {
  display: grid;
  gap: var(--space-3);
}

.oconfirm__card {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-5);
  border-radius: var(--radius-lg);
}

.oconfirm__card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.oconfirm__card-title {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
}

.oconfirm__manage {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--color-text-mute);
  font-size: var(--text-sm);
}

.oconfirm__addresses {
  display: grid;
  gap: var(--space-2);
}

.oconfirm__address {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1.5px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  cursor: pointer;
  transition: all var(--dur-base) var(--ease-out);
}

.oconfirm__address--active {
  border-color: var(--color-primary);
  background: var(--color-primary-tint);
}

.oconfirm__address-radio {
  width: 16px;
  height: 16px;
  margin-top: 3px;
  flex-shrink: 0;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  transition: all var(--dur-base) var(--ease-out);
}

.oconfirm__address--active .oconfirm__address-radio {
  border-width: 5px;
  border-color: var(--color-primary-deep);
}

.oconfirm__address-body {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.oconfirm__address-body strong {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
}

.oconfirm__address-tag {
  padding: 1px 7px;
  border-radius: var(--radius-full);
  background: var(--color-surface-warm);
  color: var(--color-text-mute);
  font-size: var(--text-2xs);
  font-style: normal;
  font-weight: var(--weight-medium);
}

.oconfirm__address-tag--default {
  background: var(--color-primary-soft);
  color: var(--color-primary-deep);
}

.oconfirm__address-body small {
  color: var(--color-text-mute);
  font-size: var(--text-xs);
}

.oconfirm__address-body p {
  color: var(--color-text-soft);
  font-size: var(--text-sm);
  line-height: var(--leading-snug);
}

.oconfirm__no-address {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-5);
  border: 1.5px dashed var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-mute);
  font-size: var(--text-sm);
}

.oconfirm__error {
  color: var(--color-danger);
  font-size: var(--text-sm);
}

.oconfirm__item {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) auto;
  gap: var(--space-3);
  align-items: center;
}

.oconfirm__item img {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-sm);
  object-fit: cover;
  background: var(--color-surface-warm);
}

.oconfirm__item-info {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.oconfirm__item-info strong {
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.oconfirm__item-info p {
  color: var(--color-text-mute);
  font-size: var(--text-xs);
}

.oconfirm__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.oconfirm__row-label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-soft);
  font-size: var(--text-sm);
}

.oconfirm__row-value {
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
}

.oconfirm__note {
  display: grid;
  gap: var(--space-2);
}

.oconfirm__note span {
  color: var(--color-text-soft);
  font-size: var(--text-sm);
}

.oconfirm__note textarea {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  font-size: var(--text-sm);
  resize: none;
  transition: border-color var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out);
}

.oconfirm__note textarea:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-tint);
}

.oconfirm__breakdown {
  display: grid;
  gap: var(--space-3);
}

.oconfirm__breakdown > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.oconfirm__breakdown span {
  color: var(--color-text-soft);
  font-size: var(--text-sm);
}

.oconfirm__breakdown strong {
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
}

.oconfirm__total {
  padding-top: var(--space-3);
  border-top: 1px dashed var(--color-divider);
}

.oconfirm__total span {
  font-weight: var(--weight-semibold);
  color: var(--color-text);
}

.oconfirm__bar-info {
  display: grid;
  gap: 1px;
  flex: 1;
  min-width: 0;
}

.oconfirm__bar-meta {
  color: var(--color-text-mute);
  font-size: var(--text-2xs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.oconfirm__submit {
  min-width: 132px;
}
</style>
