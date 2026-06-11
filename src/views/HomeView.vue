<script setup>
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import EmptyState from '@/components/EmptyState.vue'
import ProductCard from '@/components/ProductCard.vue'
import ServiceCard from '@/components/ServiceCard.vue'
import ChipSwitch from '@/components/ChipSwitch.vue'
import SectionHeading from '@/components/SectionHeading.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import IconSvg from '@/components/IconSvg.vue'
import { bundles, quickEntries } from '@/content/catalog'
import { getRecommendedBundles } from '@/lib/catalog'
import { useCatalogStore } from '@/stores/catalog'
import { useCartStore } from '@/stores/cart'
import { useProfileStore } from '@/stores/profile'

const router = useRouter()
const catalogStore = useCatalogStore()
const profileStore = useProfileStore()
const cartStore = useCartStore()

const petOptions = [
  { value: 'cat', label: '猫咪', icon: 'paw' },
  { value: 'dog', label: '狗狗', icon: 'bone' }
]

const activePetType = computed({
  get: () => profileStore.activePetType,
  set: (value) => profileStore.setPetType(value)
})

const featuredProducts = computed(() => catalogStore.homeProducts.slice(0, 4))
const featuredServices = computed(() => catalogStore.homeServices.slice(0, 2))
const recommendedBundles = computed(() => getRecommendedBundles(bundles, activePetType.value))
const cartCount = computed(() => cartStore.items.filter((item) => item.valid).length)

watch(
  activePetType,
  (value) => {
    catalogStore.fetchHomeData(value)
  },
  { immediate: true }
)

watch(
  () => profileStore.profile,
  (profile) => {
    if (!profile) {
      profileStore.fetchProfile()
    }
  },
  { immediate: true }
)

if (!cartStore.hydrated) {
  cartStore.fetchCart()
}

function openQuickEntry(entry) {
  if (['food', 'snack', 'toy', 'clean'].includes(entry.id)) {
    router.push({ path: '/products', query: { pet: activePetType.value, category: entry.id } })
    return
  }

  if (['bath', 'beauty', 'boarding'].includes(entry.id)) {
    router.push({ path: '/service', query: { pet: activePetType.value, category: entry.id } })
    return
  }

  router.push('/member')
}
</script>

<template>
  <div class="home">
    <!-- 品牌头 -->
    <header class="home__brand page-pad">
      <div class="home__logo">
        <span class="home__logo-mark font-display">PetLife</span>
        <span class="home__logo-sub">宠物生活馆</span>
      </div>
      <div class="home__brand-actions">
        <button type="button" class="home__brand-btn" aria-label="搜索" @click="router.push('/category')">
          <IconSvg name="search" :size="19" :stroke="1.9" />
        </button>
        <button type="button" class="home__brand-btn" aria-label="购物车" @click="router.push('/cart')">
          <IconSvg name="cart" :size="19" :stroke="1.9" />
          <i v-if="cartCount > 0" class="home__brand-badge">{{ cartCount > 99 ? '99+' : cartCount }}</i>
        </button>
      </div>
    </header>

    <div class="home__stack page-pad">
      <!-- Hero · 深苔绿色块 -->
      <section class="home__hero anim-fade-up">
        <div class="home__hero-glow" />
        <IconSvg name="paw" :size="150" :stroke="1" class="home__hero-paw" />
        <span class="home__hero-pill">PetLife · 春季关怀季</span>
        <h2 class="home__hero-title font-display">把照顾宠物这件事，<br />做得更温柔一点。</h2>
        <p class="home__hero-copy">商品、洗护、寄养与会员权益，集中在同一份温柔的陪伴里。</p>
        <div class="home__hero-actions">
          <button type="button" class="home__hero-cta" @click="router.push('/service')">
            预约洗护
            <IconSvg name="arrow-right" :size="14" :stroke="2.4" />
          </button>
          <button type="button" class="home__hero-ghost" @click="router.push('/member')">新人礼包</button>
        </div>
        <div class="home__hero-stats">
          <div class="home__hero-stat">
            <strong class="font-display">2,840+</strong>
            <span>本月已服务</span>
          </div>
          <i class="home__hero-divider" />
          <div class="home__hero-stat">
            <strong class="font-display">¥386</strong>
            <span>会员平均立减</span>
          </div>
        </div>
      </section>

      <!-- 宠物切换 -->
      <section class="home__switch anim-fade-up">
        <div>
          <p class="home__switch-eyebrow">按宠物浏览</p>
          <h2 class="home__switch-title font-display">今天先看哪一类？</h2>
        </div>
        <ChipSwitch v-model="activePetType" :options="petOptions" />
      </section>

      <!-- 快捷入口 -->
      <section class="home__quick anim-fade-up">
        <button
          v-for="entry in quickEntries"
          :key="entry.id"
          type="button"
          class="home__quick-item"
          @click="openQuickEntry(entry)"
        >
          <span class="home__quick-icon" :data-tone="entry.tone">
            <IconSvg :name="entry.icon" :size="20" :stroke="1.7" />
          </span>
          <span class="home__quick-label">{{ entry.label }}</span>
        </button>
      </section>

      <!-- 热门服务 -->
      <section class="home__section anim-fade-up">
        <SectionHeading eyebrow="预约型服务" title="热门服务" more="查看全部" @more="router.push('/service')" />
        <SkeletonBlock v-if="catalogStore.loading.home" variant="image" />
        <EmptyState
          v-else-if="catalogStore.error.home"
          icon="service"
          title="服务目录暂时不可用"
          :description="catalogStore.error.home"
          action-label="重新加载"
          @action="catalogStore.fetchHomeData(activePetType)"
        />
        <EmptyState
          v-else-if="!featuredServices.length"
          icon="service"
          title="暂时没有可展示的服务"
          description="稍后回来看看新的门店服务。"
          action-label="查看全部"
          @action="router.push('/service')"
        />
        <div v-else class="home__services">
          <ServiceCard
            v-for="service in featuredServices"
            :key="service.id"
            :service="service"
            layout="hero"
          />
        </div>
      </section>

      <!-- 场景组合 -->
      <section class="home__section anim-fade-up">
        <SectionHeading eyebrow="按场景选购" title="组合推荐" />
        <article
          v-for="bundle in recommendedBundles"
          :key="bundle.id"
          class="home__bundle"
        >
          <img :src="bundle.image" :alt="bundle.title" loading="lazy" />
          <div class="home__bundle-copy">
            <span class="home__bundle-tag">{{ bundle.tag }}</span>
            <h3>{{ bundle.title }}</h3>
            <p>{{ bundle.subtitle }}</p>
            <div class="home__bundle-foot">
              <span class="home__bundle-price font-display">¥{{ bundle.price }}</span>
              <del class="home__bundle-original">¥{{ bundle.originalPrice }}</del>
              <span class="home__bundle-count">{{ bundle.itemCount }} 件好物</span>
            </div>
          </div>
        </article>
      </section>

      <!-- 热卖商品 -->
      <section class="home__section anim-fade-up">
        <SectionHeading
          eyebrow="精选好物"
          title="热卖商品"
          more="查看全部"
          @more="router.push({ path: '/products', query: { pet: activePetType } })"
        />
        <div v-if="catalogStore.loading.home" class="home__product-grid">
          <SkeletonBlock variant="card" />
          <SkeletonBlock variant="card" />
        </div>
        <EmptyState
          v-else-if="catalogStore.error.home"
          title="商品目录暂时不可用"
          :description="catalogStore.error.home"
          action-label="重新加载"
          @action="catalogStore.fetchHomeData(activePetType)"
        />
        <EmptyState
          v-else-if="!featuredProducts.length"
          title="今天还没有推荐商品"
          description="先去分类页看看完整目录。"
          action-label="去逛商品"
          @action="router.push('/products')"
        />
        <div v-else class="home__product-grid">
          <ProductCard
            v-for="product in featuredProducts"
            :key="product.id"
            :product="product"
          />
        </div>
      </section>

      <!-- 会员深色卡 -->
      <section class="home__member anim-fade-up" @click="router.push('/member')">
        <div class="home__member-info">
          <p class="home__member-eyebrow">MEMBERSHIP</p>
          <h2 class="home__member-level font-display">{{ profileStore.profile?.level || 'PetLife 会员' }}</h2>
          <p class="home__member-copy">
            积分 {{ profileStore.profile?.points ?? 0 }} · 累计订单 {{ profileStore.profile?.stats.orderCount ?? 0 }} 单
          </p>
        </div>
        <span class="home__member-cta">
          查看权益
          <IconSvg name="arrow-right" :size="13" :stroke="2.4" />
        </span>
      </section>
    </div>
  </div>
</template>

<style scoped>
.home {
  padding-bottom: var(--space-4);
}

/* ---------- 品牌头 ---------- */
.home__brand {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: calc(var(--safe-top) + var(--space-4));
  padding-bottom: var(--space-4);
}

.home__logo {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
}

.home__logo-mark {
  font-size: var(--text-2xl);
  font-weight: var(--weight-bold);
  color: var(--color-primary-deep);
}

.home__logo-sub {
  color: var(--color-text-mute);
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wider);
}

.home__brand-actions {
  display: flex;
  gap: var(--space-2);
}

.home__brand-btn {
  position: relative;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-xs);
  transition: transform var(--dur-fast) var(--ease-spring);
}

.home__brand-btn:active {
  transform: scale(0.9);
}

.home__brand-badge {
  position: absolute;
  top: -4px;
  right: -5px;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-full);
  background: var(--color-coral);
  color: #fff;
  font-size: 9px;
  font-weight: var(--weight-bold);
  font-style: normal;
  box-shadow: 0 0 0 2px var(--color-bg);
  animation: pop-in var(--dur-base) var(--ease-spring);
}

.home__stack {
  display: grid;
  gap: var(--space-7);
}

/* 渐进入场节奏 */
.home__stack > .anim-fade-up:nth-child(2) { animation-delay: 60ms; }
.home__stack > .anim-fade-up:nth-child(3) { animation-delay: 120ms; }
.home__stack > .anim-fade-up:nth-child(4) { animation-delay: 180ms; }

/* ---------- Hero ---------- */
.home__hero {
  position: relative;
  overflow: hidden;
  display: grid;
  gap: var(--space-3);
  padding: var(--space-7) var(--space-5) var(--space-5);
  border-radius: var(--radius-2xl);
  background: linear-gradient(152deg, #2E4A38 0%, var(--color-primary-deep) 58%, #1E3024 100%);
  color: var(--color-text-invert);
  box-shadow: var(--shadow-brand);
}

.home__hero-glow {
  position: absolute;
  top: -70px;
  right: -60px;
  width: 230px;
  height: 230px;
  border-radius: var(--radius-full);
  background: radial-gradient(circle, rgba(217, 113, 78, 0.35), transparent 68%);
  pointer-events: none;
}

.home__hero-paw {
  position: absolute;
  right: -28px;
  bottom: 48px;
  color: rgba(247, 244, 236, 0.07);
  transform: rotate(-18deg);
  pointer-events: none;
}

.home__hero-pill {
  justify-self: start;
  padding: 5px 12px;
  border: 1px solid rgba(247, 244, 236, 0.28);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-wide);
  color: rgba(247, 244, 236, 0.85);
}

.home__hero-title {
  font-size: clamp(26px, 7.4vw, 34px);
  font-weight: var(--weight-semibold);
  line-height: 1.18;
}

.home__hero-copy {
  max-width: 30ch;
  color: rgba(247, 244, 236, 0.72);
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
}

.home__hero-actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.home__hero-cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 var(--space-5);
  border-radius: var(--radius-full);
  background: var(--color-text-invert);
  color: var(--color-primary-deep);
  font-size: var(--text-md);
  font-weight: var(--weight-bold);
  transition: transform var(--dur-fast) var(--ease-spring);
}

.home__hero-cta:active {
  transform: scale(0.95);
}

.home__hero-ghost {
  min-height: 44px;
  padding: 0 var(--space-5);
  border: 1px solid rgba(247, 244, 236, 0.32);
  border-radius: var(--radius-full);
  color: var(--color-text-invert);
  font-size: var(--text-md);
  font-weight: var(--weight-medium);
  transition: transform var(--dur-fast) var(--ease-spring), background-color var(--dur-base) var(--ease-out);
}

.home__hero-ghost:active {
  transform: scale(0.95);
  background: rgba(247, 244, 236, 0.1);
}

.home__hero-stats {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  margin-top: var(--space-3);
  padding-top: var(--space-4);
  border-top: 1px solid rgba(247, 244, 236, 0.14);
}

.home__hero-stat {
  display: grid;
  gap: 2px;
}

.home__hero-stat strong {
  font-size: var(--text-2xl);
  font-weight: var(--weight-semibold);
}

.home__hero-stat span {
  color: rgba(247, 244, 236, 0.6);
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
}

.home__hero-divider {
  width: 1px;
  height: 30px;
  background: rgba(247, 244, 236, 0.14);
}

/* ---------- 宠物切换 ---------- */
.home__switch {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-3);
}

.home__switch-eyebrow {
  margin-bottom: 2px;
  color: var(--color-primary);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-wider);
}

.home__switch-title {
  font-size: var(--text-2xl);
  font-weight: var(--weight-semibold);
}

/* ---------- 快捷入口 ---------- */
.home__quick {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-4) var(--space-2);
  padding: var(--space-5) var(--space-3);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-xs);
}

.home__quick-item {
  display: grid;
  justify-items: center;
  gap: var(--space-2);
  transition: transform var(--dur-fast) var(--ease-spring);
}

.home__quick-item:active {
  transform: scale(0.92);
}

.home__quick-icon {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 18px;
}

.home__quick-icon[data-tone='sage'] {
  background: var(--color-primary-tint);
  color: var(--color-primary);
}

.home__quick-icon[data-tone='coral'] {
  background: var(--color-coral-soft);
  color: var(--color-coral);
}

.home__quick-icon[data-tone='amber'] {
  background: var(--color-amber-soft);
  color: var(--color-amber);
}

.home__quick-icon[data-tone='sky'] {
  background: var(--color-info-soft);
  color: var(--color-sky);
}

.home__quick-icon[data-tone='clay'] {
  background: #F2E6DC;
  color: var(--color-clay);
}

.home__quick-label {
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-text-soft);
}

/* ---------- 区块 ---------- */
.home__section {
  display: grid;
  gap: var(--space-4);
}

.home__services {
  display: grid;
  gap: var(--space-3);
}

/* ---------- 组合推荐 ---------- */
.home__bundle {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: var(--space-4);
  padding: var(--space-3);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-xs);
}

.home__bundle img {
  width: 96px;
  height: 96px;
  border-radius: var(--radius-md);
  object-fit: cover;
  background: var(--color-surface-warm);
}

.home__bundle-copy {
  display: grid;
  align-content: center;
  gap: 4px;
  min-width: 0;
}

.home__bundle-tag {
  justify-self: start;
  padding: 2px 9px;
  border-radius: var(--radius-full);
  background: var(--color-amber-soft);
  color: #8C6A23;
  font-size: var(--text-2xs);
  font-weight: var(--weight-bold);
}

.home__bundle-copy h3 {
  font-size: var(--text-body);
  font-weight: var(--weight-semibold);
}

.home__bundle-copy p {
  color: var(--color-text-mute);
  font-size: var(--text-xs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.home__bundle-foot {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  margin-top: 2px;
}

.home__bundle-price {
  color: var(--color-coral);
  font-size: var(--text-xl);
  font-weight: var(--weight-semibold);
}

.home__bundle-original {
  color: var(--color-text-tint);
  font-size: var(--text-xs);
}

.home__bundle-count {
  margin-left: auto;
  color: var(--color-text-tint);
  font-size: var(--text-2xs);
}

/* ---------- 商品 ---------- */
.home__product-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

/* ---------- 会员卡 ---------- */
.home__member {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-5);
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, #2A2620 0%, #3A332A 100%);
  color: #F4E7CC;
  cursor: pointer;
  transition: transform var(--dur-fast) var(--ease-spring);
}

.home__member:active {
  transform: scale(0.98);
}

.home__member::after {
  content: '';
  position: absolute;
  top: -40px;
  right: 56px;
  width: 130px;
  height: 130px;
  border-radius: var(--radius-full);
  background: radial-gradient(circle, rgba(201, 154, 69, 0.3), transparent 70%);
  pointer-events: none;
}

.home__member-eyebrow {
  color: rgba(244, 231, 204, 0.55);
  font-size: var(--text-2xs);
  font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-wider);
}

.home__member-level {
  margin-top: 3px;
  font-size: var(--text-xl);
  font-weight: var(--weight-semibold);
}

.home__member-copy {
  margin-top: 3px;
  color: rgba(244, 231, 204, 0.62);
  font-size: var(--text-xs);
}

.home__member-cta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  padding: 9px 14px;
  border: 1px solid rgba(201, 154, 69, 0.55);
  border-radius: var(--radius-full);
  color: var(--color-amber);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
}
</style>
