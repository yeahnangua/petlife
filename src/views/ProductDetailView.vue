<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProductCard from '@/components/ProductCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import IconSvg from '@/components/IconSvg.vue'
import PriceText from '@/components/PriceText.vue'
import BottomSheet from '@/components/BottomSheet.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import { useToast } from '@/composables/useToast'
import { useCartStore } from '@/stores/cart'
import { useCatalogStore } from '@/stores/catalog'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const catalogStore = useCatalogStore()
const { success, error: toastError } = useToast()

const product = computed(() => catalogStore.currentProduct)
const relatedProducts = computed(() => catalogStore.relatedProducts)
const galleryImages = computed(() => {
  if (!product.value) {
    return []
  }

  const sourceImages = product.value.images?.length ? product.value.images : [product.value.cover]
  return [...new Set(sourceImages.filter(Boolean))]
})

const selectedSpecs = reactive({})
const sheetOpen = ref(false)
const pendingAction = ref('')
const activeSlide = ref(0)
const sliderEl = ref(null)

watch(
  () => route.params.id,
  (id) => {
    if (id) {
      catalogStore.fetchProductDetail(id)
    }
  },
  { immediate: true }
)

watch(
  product,
  () => {
    Object.keys(selectedSpecs).forEach((key) => {
      delete selectedSpecs[key]
    })
    activeSlide.value = 0
  },
  { immediate: true }
)

if (!cartStore.hydrated) {
  cartStore.fetchCart()
}

const cartCount = computed(() => cartStore.items.filter((item) => item.valid).length)

const isSelectionComplete = computed(() => {
  if (!product.value) return false
  return product.value.specs.every((group) => Boolean(selectedSpecs[group.group]))
})

const selectedSpecLabel = computed(() => {
  if (!product.value) return ''
  return product.value.specs.map((group) => selectedSpecs[group.group]).filter(Boolean).join(' · ')
})

const soldOut = computed(() => product.value?.stockStatus === 'soldOut')

function chooseSpec(group, option) {
  selectedSpecs[group] = option
}

function onSlideScroll() {
  const el = sliderEl.value
  if (!el) return
  activeSlide.value = Math.round(el.scrollLeft / el.clientWidth)
}

function openSheet(action) {
  pendingAction.value = action
  sheetOpen.value = true
}

async function addToCart() {
  if (!product.value || !isSelectionComplete.value || soldOut.value) return false

  try {
    await cartStore.addProduct(product.value, selectedSpecLabel.value)
    success('已加入购物车')
    return true
  } catch {
    toastError(cartStore.error || '加入购物车失败，请稍后重试')
    return false
  }
}

async function buyNow() {
  const added = await addToCart()

  if (added) {
    router.push('/order/confirm')
  }
}

function handleAction(action) {
  if (!isSelectionComplete.value) {
    openSheet(action)
    return
  }

  if (action === 'buy') {
    buyNow()
  } else {
    addToCart()
  }
}

function openAiConsult() {
  if (!product.value) return
  router.push({ path: '/ai-consult', query: { productId: product.value.id } })
}

async function confirmSheet() {
  if (!isSelectionComplete.value) return

  sheetOpen.value = false

  if (pendingAction.value === 'buy') {
    await buyNow()
  } else {
    await addToCart()
  }

  pendingAction.value = ''
}
</script>

<template>
  <div v-if="catalogStore.loading.productDetail" class="page-pad detail__loading">
    <SkeletonBlock variant="image" />
    <SkeletonBlock variant="text" :lines="3" />
  </div>

  <div v-else-if="product" class="detail">
    <!-- 通栏轮播 -->
    <section class="detail__slider-wrap">
      <div ref="sliderEl" class="detail__slider hide-scroll" @scroll.passive="onSlideScroll">
        <div v-for="image in galleryImages" :key="image" class="detail__slide">
          <img :src="image" :alt="product.title" />
        </div>
      </div>
      <div v-if="galleryImages.length > 1" class="detail__dots">
        <i
          v-for="(image, index) in galleryImages"
          :key="image"
          :class="{ 'detail__dot--active': activeSlide === index }"
          class="detail__dot"
        />
      </div>
      <span v-if="soldOut" class="detail__soldout-flag">已售罄</span>
    </section>

    <div class="detail__content page-pad">
      <!-- 标题与价格 -->
      <section class="detail__summary surface-card anim-fade-up">
        <div class="detail__tags">
          <span v-if="product.badge" class="detail__badge">{{ product.badge }}</span>
          <span v-for="tag in product.tags" :key="tag" class="detail__tag">{{ tag }}</span>
        </div>
        <h1 class="detail__title font-display">{{ product.title }}</h1>
        <p v-if="product.subtitle" class="detail__subtitle">{{ product.subtitle }}</p>
        <div class="detail__price-row">
          <PriceText :value="product.memberPrice ?? product.price" size="xl" :original="product.originalPrice" />
          <span class="detail__member-chip">会员价</span>
        </div>
        <div class="detail__stats">
          <span v-if="product.rating" class="detail__stat">
            <IconSvg name="star" :size="13" :stroke="2" />
            {{ product.rating }} 分
          </span>
          <i v-if="product.rating && product.reviewCount" class="detail__stat-sep" />
          <span v-if="product.reviewCount" class="detail__stat">{{ product.reviewCount }} 条评价</span>
          <i v-if="product.sold" class="detail__stat-sep" />
          <span v-if="product.sold" class="detail__stat">已售 {{ product.sold }}</span>
        </div>
      </section>

      <!-- 规格入口 -->
      <button type="button" class="detail__spec-entry surface-card anim-fade-up" @click="openSheet('')">
        <span class="detail__spec-entry-label">规格</span>
        <span class="detail__spec-entry-value" :class="{ 'detail__spec-entry-value--unset': !selectedSpecLabel }">
          {{ selectedSpecLabel || '请选择规格' }}
        </span>
        <IconSvg name="arrow-right" :size="15" :stroke="2" class="detail__spec-entry-arrow" />
      </button>

      <!-- 适用与卖点 -->
      <section v-if="product.suitable || product.summary.length" class="detail__notes surface-card anim-fade-up">
        <p v-if="product.suitable" class="detail__suitable">
          <IconSvg name="paw" :size="15" :stroke="1.9" />
          {{ product.suitable }}
        </p>
        <ul v-if="product.summary.length" class="detail__bullets">
          <li v-for="item in product.summary" :key="item">
            <IconSvg name="check" :size="13" :stroke="2.4" />
            {{ item }}
          </li>
        </ul>
      </section>

      <!-- 评分卡 -->
      <section v-if="product.reviewCount" class="detail__reviews surface-card anim-fade-up">
        <div class="detail__reviews-score">
          <strong class="font-display">{{ product.rating }}</strong>
          <span>综合评分</span>
        </div>
        <p class="detail__reviews-copy">{{ product.reviewCount }} 条评价 · 已售 {{ product.sold }} 件</p>
      </section>

      <!-- 相关推荐 -->
      <section v-if="relatedProducts.length" class="detail__related-block anim-fade-up">
        <p class="detail__related-eyebrow">延展搭配</p>
        <h2 class="detail__related-title font-display">相关推荐</h2>
        <div class="detail__related">
          <ProductCard v-for="item in relatedProducts" :key="item.id" :product="item" />
        </div>
      </section>
    </div>

    <!-- 底部操作栏 -->
    <div class="detail__action-bar">
      <button type="button" class="detail__cart-btn" aria-label="购物车" @click="router.push('/cart')">
        <IconSvg name="cart" :size="20" :stroke="1.8" />
        <i v-if="cartCount > 0" class="detail__cart-badge">{{ cartCount > 99 ? '99+' : cartCount }}</i>
      </button>
      <button type="button" class="button-secondary detail__add-btn" :disabled="soldOut" @click="handleAction('add')">
        加入购物车
      </button>
      <button type="button" class="button-primary detail__buy-btn" :disabled="soldOut" @click="handleAction('buy')">
        {{ soldOut ? '已售罄' : '立即购买' }}
      </button>
    </div>

    <button type="button" class="detail__ai-consult" data-test="detail-ai-consult" @click="openAiConsult">
      <IconSvg name="chat" :size="18" :stroke="2" />
      <span>AI咨询</span>
    </button>

    <!-- 规格选择弹层 -->
    <BottomSheet :open="sheetOpen" title="选择规格" @close="sheetOpen = false">
      <div class="sheet-product">
        <img :src="galleryImages[0]" :alt="product.title" class="sheet-product__thumb" />
        <div class="sheet-product__info">
          <PriceText :value="product.memberPrice ?? product.price" size="lg" />
          <p class="sheet-product__label">{{ selectedSpecLabel || '请选择完整规格' }}</p>
        </div>
      </div>

      <div v-for="group in product.specs" :key="group.group" class="sheet-spec">
        <h4 class="sheet-spec__name">{{ group.group }}</h4>
        <div class="sheet-spec__options">
          <button
            v-for="option in group.options"
            :key="option"
            type="button"
            class="sheet-spec__option"
            :class="{ 'sheet-spec__option--active': selectedSpecs[group.group] === option }"
            @click="chooseSpec(group.group, option)"
          >
            {{ option }}
          </button>
        </div>
      </div>

      <button
        type="button"
        class="button-primary sheet-confirm"
        :disabled="!isSelectionComplete || soldOut"
        @click="confirmSheet"
      >
        {{ soldOut ? '已售罄' : pendingAction === 'buy' ? '立即购买' : pendingAction === 'add' ? '加入购物车' : '确定' }}
      </button>
    </BottomSheet>
  </div>

  <div v-else class="page-pad detail__missing">
    <EmptyState
      icon="box"
      title="这件商品暂时找不到了"
      :description="catalogStore.error.productDetail || '可能已经下架，先回列表看看其他精选商品。'"
      action-label="返回列表"
      @action="router.push('/products')"
    />
  </div>
</template>

<style scoped>
.detail {
  padding-bottom: calc(var(--shell-bottom-offset) + var(--action-bar-height) + var(--space-8));
}

.detail__loading,
.detail__missing {
  display: grid;
  gap: var(--space-4);
  padding-top: var(--space-4);
}

/* ---------- 轮播 ---------- */
.detail__slider-wrap {
  position: relative;
}

.detail__slider {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
}

.detail__slide {
  flex: 0 0 100%;
  scroll-snap-align: center;
  aspect-ratio: 1 / 0.94;
  background: var(--color-surface-warm);
}

.detail__slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail__dots {
  position: absolute;
  bottom: var(--space-6);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 5px;
  padding: 5px 8px;
  border-radius: var(--radius-full);
  background: rgba(35, 33, 28, 0.32);
  backdrop-filter: blur(4px);
}

.detail__dot {
  width: 5px;
  height: 5px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.55);
  transition: all var(--dur-base) var(--ease-out);
}

.detail__dot--active {
  width: 14px;
  background: #fff;
}

.detail__soldout-flag {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  padding: 5px 12px;
  border-radius: var(--radius-full);
  background: rgba(35, 33, 28, 0.72);
  color: var(--color-text-invert);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-wide);
}

/* ---------- 内容 ---------- */
.detail__content {
  display: grid;
  gap: var(--space-3);
  margin-top: calc(-1 * var(--space-5));
  position: relative;
}

.detail__summary {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-5);
  border-radius: var(--radius-xl);
}

.detail__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.detail__badge {
  padding: 3px 10px;
  border-radius: var(--radius-full);
  background: var(--color-coral);
  color: #fff;
  font-size: var(--text-2xs);
  font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-wide);
}

.detail__tag {
  padding: 3px 10px;
  border-radius: var(--radius-full);
  background: var(--color-primary-tint);
  color: var(--color-primary-deep);
  font-size: var(--text-2xs);
  font-weight: var(--weight-medium);
}

.detail__title {
  font-size: var(--text-2xl);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-snug);
}

.detail__subtitle {
  color: var(--color-text-mute);
  font-size: var(--text-sm);
}

.detail__price-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-1);
}

.detail__member-chip {
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: var(--color-amber-soft);
  color: #8C6A23;
  font-size: var(--text-2xs);
  font-weight: var(--weight-bold);
}

.detail__stats {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-mute);
  font-size: var(--text-xs);
}

.detail__stat {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.detail__stat:first-child {
  color: var(--color-amber);
  font-weight: var(--weight-semibold);
}

.detail__stat-sep {
  width: 3px;
  height: 3px;
  border-radius: var(--radius-full);
  background: var(--color-text-tint);
}

/* ---------- 规格入口 ---------- */
.detail__spec-entry {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  text-align: left;
  border-radius: var(--radius-lg);
  transition: transform var(--dur-fast) var(--ease-spring);
}

.detail__spec-entry:active {
  transform: scale(0.98);
}

.detail__spec-entry-label {
  flex-shrink: 0;
  color: var(--color-text-mute);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
}

.detail__spec-entry-value {
  flex: 1;
  min-width: 0;
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.detail__spec-entry-value--unset {
  color: var(--color-text-tint);
  font-weight: var(--weight-regular);
}

.detail__spec-entry-arrow {
  color: var(--color-text-tint);
}

/* ---------- 适用与卖点 ---------- */
.detail__notes {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-5);
  border-radius: var(--radius-lg);
}

.detail__suitable {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-primary-tint);
  color: var(--color-primary-deep);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
}

.detail__bullets {
  display: grid;
  gap: var(--space-2);
}

.detail__bullets li {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  color: var(--color-text-soft);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

.detail__bullets li :deep(.icon-svg) {
  flex-shrink: 0;
  transform: translateY(1px);
  color: var(--color-primary);
}

/* ---------- 评分 ---------- */
.detail__reviews {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  border-radius: var(--radius-lg);
}

.detail__reviews-score {
  display: grid;
  justify-items: center;
}

.detail__reviews-score strong {
  color: var(--color-amber);
  font-size: var(--text-3xl);
  font-weight: var(--weight-semibold);
}

.detail__reviews-score span {
  color: var(--color-text-tint);
  font-size: var(--text-2xs);
}

.detail__reviews-copy {
  color: var(--color-text-soft);
  font-size: var(--text-sm);
}

/* ---------- 相关推荐 ---------- */
.detail__related-block {
  margin-top: var(--space-3);
}

.detail__related-eyebrow {
  color: var(--color-primary);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-wider);
}

.detail__related-title {
  margin: 2px 0 var(--space-3);
  font-size: var(--text-2xl);
  font-weight: var(--weight-semibold);
}

.detail__related {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

/* ---------- 操作栏 ---------- */
.detail__action-bar {
  position: fixed;
  right: max(var(--space-4), calc((100vw - var(--mobile-max)) / 2 + var(--space-4)));
  bottom: calc(var(--shell-bottom-offset) + var(--space-4));
  left: max(var(--space-4), calc((100vw - var(--mobile-max)) / 2 + var(--space-4)));
  z-index: var(--z-sticky);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--color-surface) 92%, transparent);
  box-shadow: var(--shadow-float);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.detail__cart-btn {
  position: relative;
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  flex-shrink: 0;
  border-radius: var(--radius-full);
  background: var(--color-surface-warm);
  color: var(--color-text);
}

.detail__cart-badge {
  position: absolute;
  top: -2px;
  right: -3px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-full);
  background: var(--color-coral);
  color: #fff;
  font-size: 9px;
  font-weight: var(--weight-bold);
  font-style: normal;
}

.detail__add-btn {
  flex: 1;
  min-height: 46px;
}

.detail__buy-btn {
  flex: 1.25;
  min-height: 46px;
}

.detail__ai-consult {
  position: fixed;
  right: max(var(--space-4), calc((100vw - var(--mobile-max)) / 2 + var(--space-4)));
  bottom: calc(var(--shell-bottom-offset) + var(--action-bar-height) + var(--space-6));
  z-index: calc(var(--z-sticky) + 1);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 0 var(--space-3);
  border: 1px solid rgba(217, 113, 78, 0.28);
  border-radius: var(--radius-full);
  background: var(--color-coral);
  color: #fff;
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
  box-shadow: 0 10px 24px rgba(217, 113, 78, 0.28);
  transition: transform var(--dur-fast) var(--ease-spring), box-shadow var(--dur-base) var(--ease-out);
}

.detail__ai-consult:active {
  transform: scale(0.94);
  box-shadow: 0 6px 14px rgba(217, 113, 78, 0.22);
}

/* ---------- 规格弹层 ---------- */
.sheet-product {
  display: flex;
  gap: var(--space-3);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-divider);
}

.sheet-product__thumb {
  width: 76px;
  height: 76px;
  border-radius: var(--radius-md);
  object-fit: cover;
  background: var(--color-surface-warm);
}

.sheet-product__info {
  display: grid;
  align-content: center;
  gap: 4px;
}

.sheet-product__label {
  color: var(--color-text-mute);
  font-size: var(--text-sm);
}

.sheet-spec {
  padding: var(--space-4) 0;
}

.sheet-spec__name {
  margin-bottom: var(--space-3);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  color: var(--color-text-soft);
}

.sheet-spec__options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.sheet-spec__option {
  min-height: 38px;
  padding: 0 var(--space-4);
  border: 1.5px solid var(--color-border-soft);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  color: var(--color-text-soft);
  font-size: var(--text-sm);
  transition: all var(--dur-base) var(--ease-out);
}

.sheet-spec__option--active {
  border-color: var(--color-primary-deep);
  background: var(--color-primary-deep);
  color: var(--color-text-invert);
  font-weight: var(--weight-semibold);
}

.sheet-confirm {
  width: 100%;
  margin-top: var(--space-3);
}
</style>
