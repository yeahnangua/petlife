<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProductCard from '@/components/ProductCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import IconSvg from '@/components/IconSvg.vue'
import { findProduct, productReviews, products } from '@/mocks'
import { getFeaturedProducts } from '@/lib/catalog'
import { formatCurrency } from '@/lib/pricing'
import { useCartStore } from '@/stores/cart'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()

const product = computed(() => findProduct(route.params.id))
const reviews = computed(() => productReviews[route.params.id] ?? null)
const relatedProducts = computed(() => {
  if (!product.value) return []
  return getFeaturedProducts(
    products.filter((item) => item.id !== product.value.id),
    product.value.petType === 'all' ? 'cat' : product.value.petType
  )
})

const selectedSpecs = reactive({})
const notice = ref('')

const isSelectionComplete = computed(() => {
  if (!product.value) return false
  return product.value.specs.every((group) => Boolean(selectedSpecs[group.group]))
})

const selectedSpecLabel = computed(() => {
  if (!product.value) return ''
  return product.value.specs.map((group) => selectedSpecs[group.group]).filter(Boolean).join(' · ')
})

function chooseSpec(group, option) {
  selectedSpecs[group] = option
}

function addToCart() {
  if (!product.value || !isSelectionComplete.value) return
  cartStore.addProduct(product.value, selectedSpecLabel.value)
  notice.value = '已加入购物车，可继续逛逛。'
}

function buyNow() {
  addToCart()
  router.push('/order/confirm')
}
</script>

<template>
  <div v-if="product" class="detail page-stack">
    <section
      class="detail__hero"
      :style="{
        background: `linear-gradient(135deg, ${product.gradient?.[0] || '#DCE6DD'}, ${product.gradient?.[1] || '#F5EFE7'})`
      }"
    >
      <img :src="product.cover" :alt="product.title" />
    </section>

    <div class="detail__content page-pad page-stack">
      <section class="surface-card detail__summary">
        <div class="detail__summary-head">
          <div class="detail__tag-row">
            <span v-for="tag in product.tags" :key="tag" class="pill">{{ tag }}</span>
          </div>
          <span v-if="product.badge" class="detail__badge">{{ product.badge }}</span>
        </div>
        <h2>{{ product.title }}</h2>
        <p class="detail__subtitle">{{ product.subtitle }}</p>
        <div class="detail__price">
          <strong>{{ formatCurrency(product.memberPrice ?? product.price) }}</strong>
          <span v-if="product.originalPrice">{{ formatCurrency(product.originalPrice) }}</span>
        </div>
        <p class="detail__suitable">{{ product.suitable }}</p>
        <ul class="detail__bullets">
          <li v-for="item in product.summary" :key="item">{{ item }}</li>
        </ul>
      </section>

      <section class="surface-card detail__specs">
        <div class="section-heading">
          <h2 class="section-heading__title">规格选择</h2>
          <span class="section-heading__meta">{{ selectedSpecLabel || '请选择完整规格' }}</span>
        </div>

        <div v-for="group in product.specs" :key="group.group" class="detail__spec-group">
          <h3>{{ group.group }}</h3>
          <div class="detail__spec-options">
            <button
              v-for="option in group.options"
              :key="option"
              type="button"
              class="detail__spec-option"
              :class="{ 'is-active': selectedSpecs[group.group] === option }"
              @click="chooseSpec(group.group, option)"
            >
              {{ option }}
            </button>
          </div>
        </div>

        <p v-if="notice" class="detail__notice">
          <IconSvg name="check" :size="16" />
          {{ notice }}
        </p>
      </section>

      <section v-if="reviews" class="surface-card detail__reviews">
        <div class="section-heading">
          <div>
            <p class="section-heading__meta">用户口碑</p>
            <h2 class="section-heading__title">{{ reviews.score }} 分好评</h2>
          </div>
          <span class="section-heading__meta">{{ reviews.total }} 条评价</span>
        </div>

        <div class="detail__review-tags">
          <span v-for="tag in reviews.tags" :key="tag" class="pill">{{ tag }}</span>
        </div>

        <article v-for="item in reviews.items" :key="item.id" class="detail__review">
          <div class="detail__review-head">
            <strong>{{ item.user }}</strong>
            <span>{{ item.date }} · {{ item.spec }}</span>
          </div>
          <p>{{ item.content }}</p>
        </article>
      </section>

      <section class="page-stack">
        <div class="section-heading">
          <div>
            <p class="section-heading__meta">延展搭配</p>
            <h2 class="section-heading__title">相关推荐</h2>
          </div>
        </div>
        <div class="detail__related">
          <ProductCard
            v-for="item in relatedProducts"
            :key="item.id"
            :product="item"
          />
        </div>
      </section>
    </div>

    <div class="detail__action-bar">
      <button type="button" class="button-secondary" @click="addToCart">加入购物车</button>
      <button type="button" class="button-primary" :disabled="!isSelectionComplete" @click="buyNow">
        立即购买
      </button>
    </div>
  </div>

  <div v-else class="page-pad">
    <EmptyState
      title="这件商品暂时找不到了"
      description="可能已经下架，先回列表看看其他精选商品。"
      action-label="返回列表"
      @action="router.push('/products')"
    />
  </div>
</template>

<style scoped>
.detail {
  padding-bottom: calc(var(--shell-bottom-offset) + var(--action-bar-height) + var(--space-8));
}

.detail__hero {
  aspect-ratio: 1;
}

.detail__hero img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail__summary,
.detail__specs,
.detail__reviews {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-5);
}

.detail__summary-head,
.detail__tag-row,
.detail__price,
.detail__review-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.detail__badge {
  padding: 4px 10px;
  border-radius: var(--radius-full);
  background: var(--color-coral-soft);
  color: var(--color-coral);
  font-size: var(--text-xs);
}

.detail__summary h2 {
  font-size: var(--text-2xl);
}

.detail__subtitle,
.detail__suitable,
.detail__review p,
.detail__review-head span {
  color: var(--color-text-soft);
}

.detail__price strong {
  color: var(--color-coral);
  font-size: var(--text-3xl);
}

.detail__price span {
  color: var(--color-text-tint);
  text-decoration: line-through;
}

.detail__bullets {
  display: grid;
  gap: 8px;
}

.detail__bullets li::before {
  content: '·';
  margin-right: 8px;
}

.detail__spec-group {
  display: grid;
  gap: var(--space-3);
}

.detail__spec-group h3 {
  font-size: var(--text-md);
}

.detail__spec-options,
.detail__review-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.detail__spec-option {
  min-height: 36px;
  padding: 0 var(--space-4);
  border-radius: var(--radius-full);
  background: var(--color-surface-soft);
  color: var(--color-text-soft);
}

.detail__spec-option.is-active {
  background: var(--color-primary-deep);
  color: var(--color-text-invert);
}

.detail__notice {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--color-success);
  font-size: var(--text-sm);
}

.detail__review {
  display: grid;
  gap: var(--space-2);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border-soft);
}

.detail__related {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.detail__action-bar {
  position: fixed;
  right: max(var(--space-4), calc((100vw - var(--mobile-max)) / 2 + var(--space-4)));
  bottom: calc(var(--shell-bottom-offset) + var(--space-4));
  left: max(var(--space-4), calc((100vw - var(--mobile-max)) / 2 + var(--space-4)));
  z-index: var(--z-sticky);
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: calc(var(--radius-xl) + 2px);
  background: rgba(250, 245, 236, 0.94);
  box-shadow: var(--shadow-float);
  backdrop-filter: blur(22px);
}
</style>
