<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import EmptyState from '@/components/EmptyState.vue'
import { useCartStore } from '@/stores/cart'
import { formatCurrency } from '@/lib/pricing'

const router = useRouter()
const cartStore = useCartStore()

const validItems = computed(() => cartStore.items.filter((item) => item.valid))
const invalidItems = computed(() => cartStore.invalidItems)
</script>

<template>
  <div class="cart page-pad page-stack">
    <template v-if="cartStore.items.length">
      <section class="page-stack">
        <article
          v-for="item in validItems"
          :key="item.id"
          class="cart__item surface-card"
        >
          <button type="button" class="cart__check" @click="cartStore.toggleSelection(item.id)">
            {{ item.selected ? '✓' : '' }}
          </button>
          <img :src="item.product.cover" :alt="item.product.title" />
          <div class="cart__copy">
            <strong>{{ item.product.title }}</strong>
            <p>{{ item.specLabel }}</p>
            <div class="cart__meta">
              <span>{{ formatCurrency(item.product.memberPrice ?? item.product.price) }}</span>
              <div class="cart__qty">
                <button type="button" @click="cartStore.updateQuantity(item.id, -1)">-</button>
                <span>{{ item.quantity }}</span>
                <button type="button" @click="cartStore.updateQuantity(item.id, 1)">+</button>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section v-if="invalidItems.length" class="page-stack">
        <div class="section-heading">
          <h2 class="section-heading__title">失效商品</h2>
          <button type="button" class="section-link" @click="cartStore.removeInvalidItems()">
            清空
          </button>
        </div>
        <article
          v-for="item in invalidItems"
          :key="item.id"
          class="cart__item surface-card is-invalid"
        >
          <img :src="item.product.cover" :alt="item.product.title" />
          <div class="cart__copy">
            <strong>{{ item.product.title }}</strong>
            <p>{{ item.invalidReason }}</p>
          </div>
        </article>
      </section>

      <section class="cart__summary surface-card">
        <div>
          <p class="section-heading__meta">已选 {{ cartStore.summary.selectedCount }} 件</p>
          <h2 class="section-heading__title">{{ formatCurrency(cartStore.summary.total) }}</h2>
        </div>
        <button
          type="button"
          class="button-primary"
          :disabled="!cartStore.selectedItems.length"
          @click="router.push('/order/confirm')"
        >
          去结算
        </button>
      </section>
    </template>

    <EmptyState
      v-else
      title="购物车还是空的"
      description="先去看看今天的主粮、零食和护理好物。"
      action-label="去逛商品"
      @action="router.push('/products')"
    />
  </div>
</template>

<style scoped>
.cart {
  padding-bottom: var(--space-6);
}

.cart__item {
  display: grid;
  grid-template-columns: 24px 88px minmax(0, 1fr);
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-3);
}

.cart__item.is-invalid {
  grid-template-columns: 88px minmax(0, 1fr);
  opacity: 0.72;
}

.cart__item img {
  width: 88px;
  height: 88px;
  border-radius: var(--radius-lg);
  object-fit: cover;
}

.cart__check {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: var(--color-primary-deep);
  color: var(--color-text-invert);
}

.cart__copy {
  display: grid;
  gap: var(--space-2);
  min-width: 0;
}

.cart__copy p {
  color: var(--color-text-soft);
  font-size: var(--text-sm);
}

.cart__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.cart__meta span {
  color: var(--color-coral);
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
}

.cart__qty {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 36px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-full);
  background: var(--color-surface-soft);
}

.cart__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4);
}

.section-link {
  color: var(--color-primary-deep);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
}
</style>
