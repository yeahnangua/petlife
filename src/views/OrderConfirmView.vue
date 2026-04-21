<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import EmptyState from '@/components/EmptyState.vue'
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
const selectedAddress = computed(() => addresses.value.find((item) => item.id === selectedAddressId.value) ?? null)
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
    router.push(`/orders/${data.order.id}`)
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
  <div class="order-confirm page-pad page-stack page-with-submit-bar">
    <div v-if="loading" class="surface-card order-confirm__card order-confirm__state">
      正在加载订单确认信息...
    </div>

    <template v-else-if="selectedItems.length">
      <section class="surface-card order-confirm__card">
        <div class="section-heading">
          <h2 class="section-heading__title">收货地址</h2>
          <button type="button" class="section-link" @click="router.push('/addresses')">管理地址</button>
        </div>
        <div v-if="addresses.length" class="order-confirm__address-list">
          <label
            v-for="address in addresses"
            :key="address.id"
            class="order-confirm__option"
            :class="{ 'is-active': selectedAddressId === address.id }"
          >
            <input v-model="selectedAddressId" type="radio" :value="address.id" class="sr-only" />
            <strong>{{ address.tag }} · {{ address.name }}</strong>
            <p>{{ address.displayAddress }}</p>
          </label>
        </div>
        <div v-else class="surface-card order-confirm__empty-address">
          还没有收货地址，先去新增一条吧。
        </div>
        <p v-if="submitError" class="order-confirm__error">{{ submitError }}</p>
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
          <div class="is-total"><span>应付金额</span><strong>{{ formatCurrency(priceBreakdown.payable) }}</strong></div>
        </div>
      </section>

      <section class="order-confirm__submit page-submit-bar surface-card">
        <div>
          <p class="section-heading__meta">{{ selectedAddress?.tag }} · {{ selectedAddress?.phone }}</p>
          <h2 class="section-heading__title">{{ formatCurrency(priceBreakdown.payable) }}</h2>
        </div>
        <button type="button" class="button-primary order-confirm__submit-button" :disabled="submitting" @click="submitOrder">
          {{ submitting ? '提交中...' : '提交订单' }}
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

.order-confirm__address-list {
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

.order-confirm__empty-address,
.order-confirm__state {
  padding: var(--space-4);
  color: var(--color-text-soft);
  text-align: center;
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

.order-confirm__error {
  color: var(--color-coral);
  font-size: var(--text-sm);
}
</style>
