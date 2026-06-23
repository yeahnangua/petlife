<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import EmptyState from '@/components/EmptyState.vue'
import IconSvg from '@/components/IconSvg.vue'
import PriceText from '@/components/PriceText.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import Stepper from '@/components/Stepper.vue'
import StickyActionBar from '@/components/StickyActionBar.vue'
import { useCartStore } from '@/stores/cart'

const router = useRouter()
const cartStore = useCartStore()

onMounted(() => {
  cartStore.fetchCart()
})

const validItems = computed(() => cartStore.items.filter((item) => item.valid))
const invalidItems = computed(() => cartStore.invalidItems)

function setQuantity(item, value) {
  const delta = value - item.quantity
  if (delta !== 0) {
    cartStore.updateQuantity(item.id, delta)
  }
}
</script>

<template>
  <div class="cart page-pad" :class="{ 'page-with-submit-bar': validItems.length }">
    <header class="cart__head">
      <p class="cart__eyebrow">CART</p>
      <h1 class="cart__title font-display">购物车</h1>
    </header>

    <div v-if="cartStore.loading" class="cart__stack">
      <SkeletonBlock variant="card" />
      <SkeletonBlock variant="card" />
    </div>

    <EmptyState
      v-else-if="cartStore.error && !cartStore.items.length"
      title="购物车加载失败"
      :description="cartStore.error"
      action-label="重试"
      @action="cartStore.fetchCart()"
    />

    <template v-else-if="cartStore.items.length">
      <section class="cart__stack">
        <article v-for="item in validItems" :key="item.id" class="cart__item surface-card">
          <button
            type="button"
            class="cart__check"
            :class="{ 'cart__check--on': item.selected }"
            :aria-label="item.selected ? '取消选择' : '选择商品'"
            @click="cartStore.toggleSelection(item.id)"
          >
            <IconSvg v-if="item.selected" name="check" :size="12" :stroke="3" />
          </button>
          <img class="cart__thumb" :src="item.product.cover" :alt="item.product.title" loading="lazy" />
          <div class="cart__info">
            <h3 class="cart__name">{{ item.product.title }}</h3>
            <p class="cart__spec">{{ item.specLabel }}</p>
            <div class="cart__row">
              <PriceText :value="item.product.memberPrice ?? item.product.price" size="sm" />
              <Stepper
                :model-value="item.quantity"
                @update:model-value="(value) => setQuantity(item, value)"
              />
            </div>
          </div>
        </article>
      </section>

      <section v-if="invalidItems.length" class="cart__invalid">
        <div class="cart__invalid-head">
          <h2 class="cart__invalid-title">失效商品</h2>
          <button type="button" class="cart__clear" @click="cartStore.clearInvalidItems()">
            <IconSvg name="trash" :size="13" :stroke="2" />
            清空
          </button>
        </div>
        <article v-for="item in invalidItems" :key="item.id" class="cart__item cart__item--invalid surface-card">
          <span class="cart__invalid-flag">失效</span>
          <img class="cart__thumb" :src="item.product.cover" :alt="item.product.title" loading="lazy" />
          <div class="cart__info">
            <h3 class="cart__name">{{ item.product.title }}</h3>
            <p class="cart__spec cart__spec--reason">{{ item.invalidReason }}</p>
          </div>
        </article>
      </section>

      <StickyActionBar>
        <div class="cart__summary">
          <span class="cart__summary-count">已选 {{ cartStore.summary.selectedCount }} 件</span>
          <PriceText :value="cartStore.summary.total" size="lg" />
        </div>
        <button
          type="button"
          class="button-primary cart__checkout"
          :disabled="!cartStore.selectedItems.length"
          @click="router.push('/order/confirm')"
        >
          去结算
        </button>
      </StickyActionBar>
    </template>

    <EmptyState
      v-else
      icon="cart"
      title="购物车还是空的"
      description="先去看看今天的主粮、零食和护理好物。"
      action-label="去逛商品"
      @action="router.push('/products')"
    />
  </div>
</template>

<style scoped>
.cart {
  display: grid;
  gap: var(--space-4);
  padding-bottom: var(--space-6);
  align-content: start;
}

.cart__head {
  padding-top: calc(var(--safe-top) + var(--space-5));
}

.cart__eyebrow {
  color: var(--color-primary);
  font-size: var(--text-2xs);
  font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-wider);
}

.cart__title {
  margin-top: 2px;
  font-size: var(--text-3xl);
  font-weight: var(--weight-semibold);
}

.cart__stack {
  display: grid;
  gap: var(--space-3);
}

.cart__item {
  display: grid;
  grid-template-columns: 22px 84px minmax(0, 1fr);
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-3);
  border-radius: var(--radius-lg);
}

.cart__item--invalid {
  grid-template-columns: auto 84px minmax(0, 1fr);
  opacity: 0.75;
}

.cart__check {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  color: var(--color-text-invert);
  transition: all var(--dur-base) var(--ease-out);
}

.cart__check--on {
  border-color: var(--color-primary-deep);
  background: var(--color-primary-deep);
}

.cart__thumb {
  width: 84px;
  height: 84px;
  border-radius: var(--radius-md);
  object-fit: cover;
  background: var(--color-surface-warm);
}

.cart__item--invalid .cart__thumb {
  filter: grayscale(0.8);
}

.cart__info {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.cart__name {
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cart__spec {
  justify-self: start;
  padding: 2px 8px;
  border-radius: var(--radius-xs);
  background: var(--color-surface-warm);
  color: var(--color-text-mute);
  font-size: var(--text-xs);
}

.cart__spec--reason {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}

.cart__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-top: 2px;
}

.cart__invalid {
  display: grid;
  gap: var(--space-3);
}

.cart__invalid-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cart__invalid-title {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
}

.cart__clear {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text-mute);
  font-size: var(--text-sm);
}

.cart__invalid-flag {
  padding: 2px 7px;
  border-radius: var(--radius-xs);
  background: var(--color-bg-deep);
  color: var(--color-text-tint);
  font-size: var(--text-2xs);
  font-weight: var(--weight-semibold);
}

.cart__summary {
  display: grid;
  gap: 1px;
  flex: 1;
}

.cart__summary-count {
  color: var(--color-text-mute);
  font-size: var(--text-2xs);
}

.cart__checkout {
  min-width: 128px;
}
</style>
