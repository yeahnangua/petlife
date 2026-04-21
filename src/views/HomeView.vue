<script setup>
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import EmptyState from '@/components/EmptyState.vue'
import ProductCard from '@/components/ProductCard.vue'
import ServiceCard from '@/components/ServiceCard.vue'
import PetChipSwitch from '@/components/PetChipSwitch.vue'
import IconSvg from '@/components/IconSvg.vue'
import { bundles, quickEntries, user } from '@/mocks'
import { getRecommendedBundles } from '@/lib/catalog'
import { useCatalogStore } from '@/stores/catalog'
import { useProfileStore } from '@/stores/profile'

const router = useRouter()
const catalogStore = useCatalogStore()
const profileStore = useProfileStore()

const activePetType = computed({
  get: () => profileStore.activePetType,
  set: (value) => profileStore.setPetType(value)
})

const featuredProducts = computed(() => catalogStore.homeProducts.slice(0, 4))
const featuredServices = computed(() => catalogStore.homeServices.slice(0, 2))
const recommendedBundles = computed(() => getRecommendedBundles(bundles, activePetType.value))

watch(
  activePetType,
  (value) => {
    catalogStore.fetchHomeData(value)
  },
  { immediate: true }
)

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
  <div class="home page-pad page-stack">
    <section class="home__hero surface-card">
      <div class="home__hero-copy">
        <span class="pill">PetLife · 春季关怀季</span>
        <h2 class="font-display">把照顾宠物这件事，做得更温柔一点。</h2>
        <p>
          商品、洗护、美容、寄养与会员权益集中在同一个移动端体验里，
          面向真正重视陪伴感的养宠人群。
        </p>
        <div class="home__hero-actions">
          <button type="button" class="button-primary" @click="router.push('/service')">
            预约洗护
          </button>
          <button type="button" class="button-secondary" @click="router.push('/member')">
            新人礼包
          </button>
        </div>
      </div>
      <div class="home__hero-visual">
        <div class="home__hero-stat">
          <span>本月已服务</span>
          <strong>2,840+</strong>
        </div>
        <div class="home__hero-stat">
          <span>会员立减</span>
          <strong>¥386</strong>
        </div>
      </div>
    </section>

    <section class="home__switch">
      <div class="section-heading">
        <div>
          <p class="section-heading__meta">按宠物浏览</p>
          <h2 class="section-heading__title">今天更想先看哪一类？</h2>
        </div>
        <PetChipSwitch v-model="activePetType" />
      </div>
    </section>

    <section class="home__quick surface-card">
      <div class="section-heading">
        <h2 class="section-heading__title">快捷入口</h2>
        <span class="section-heading__meta">8 个常用场景</span>
      </div>

      <div class="home__quick-grid">
        <button
          v-for="entry in quickEntries"
          :key="entry.id"
          type="button"
          class="home__quick-item"
          @click="openQuickEntry(entry)"
        >
          <span class="home__quick-icon">
            <IconSvg :name="entry.icon" :size="20" />
          </span>
          <span>{{ entry.label }}</span>
        </button>
      </div>
    </section>

    <section class="page-stack">
      <div class="section-heading">
        <div>
          <p class="section-heading__meta">预约型服务</p>
          <h2 class="section-heading__title">热门服务</h2>
        </div>
        <button type="button" class="section-link" @click="router.push('/service')">查看全部</button>
      </div>

      <div v-if="catalogStore.loading.home" class="surface-card home__state">
        正在加载服务目录...
      </div>
      <EmptyState
        v-else-if="catalogStore.error.home"
        icon="service"
        :title="catalogStore.error.home"
        description="服务目录暂时没有加载成功，稍后重试。"
        action-label="刷新"
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
      <ServiceCard
        v-else
        v-for="service in featuredServices"
        :key="service.id"
        :service="service"
      />
    </section>

    <section class="page-stack">
      <div class="section-heading">
        <div>
          <p class="section-heading__meta">按场景选购</p>
          <h2 class="section-heading__title">组合推荐</h2>
        </div>
      </div>

      <article
        v-for="bundle in recommendedBundles"
        :key="bundle.id"
        class="home__bundle surface-card"
      >
        <img :src="bundle.image" :alt="bundle.title" />
        <div class="home__bundle-copy">
          <span class="pill">{{ bundle.tag }}</span>
          <h3>{{ bundle.title }}</h3>
          <p>{{ bundle.subtitle }}</p>
          <strong>¥{{ bundle.price }}</strong>
        </div>
      </article>
    </section>

    <section class="page-stack">
      <div class="section-heading">
        <div>
          <p class="section-heading__meta">精选好物</p>
          <h2 class="section-heading__title">热卖商品</h2>
        </div>
        <button
          type="button"
          class="section-link"
          @click="router.push({ path: '/products', query: { pet: activePetType.value } })"
        >
          查看全部
        </button>
      </div>

      <div v-if="catalogStore.loading.home" class="surface-card home__state">
        正在加载商品目录...
      </div>
      <EmptyState
        v-else-if="catalogStore.error.home"
        title="商品目录暂时不可用"
        description="接口请求失败，稍后刷新试试。"
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

    <section class="home__member surface-card">
      <div>
        <p class="section-heading__meta">会员权益</p>
        <h2 class="section-heading__title">{{ user.level }}</h2>
        <p class="home__member-copy">
          当前积分 {{ user.points }}，距离 {{ user.levelTo }} 还差一点点。
        </p>
      </div>
      <button type="button" class="button-secondary" @click="router.push('/member')">
        查看权益
      </button>
    </section>
  </div>
</template>

<style scoped>
.home {
  padding-bottom: var(--space-6);
}

.home__hero {
  display: grid;
  gap: var(--space-5);
  padding: var(--space-5);
  background:
    radial-gradient(circle at top left, rgba(217, 119, 87, 0.18), transparent 34%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.82), rgba(237, 229, 211, 0.88));
}

.home__hero-copy {
  display: grid;
  gap: var(--space-4);
}

.home__hero-copy h2 {
  max-width: 12ch;
  font-size: clamp(30px, 8vw, 42px);
  line-height: 1.02;
}

.home__hero-copy p,
.home__member-copy {
  color: var(--color-text-soft);
}

.home__hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.home__hero-visual {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.home__hero-stat {
  display: grid;
  gap: 6px;
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.66);
}

.home__hero-stat span {
  color: var(--color-text-mute);
  font-size: var(--text-sm);
}

.home__hero-stat strong {
  font-size: var(--text-2xl);
}

.home__quick {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4);
}

.home__quick-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-3);
}

.home__quick-item {
  display: grid;
  justify-items: center;
  gap: var(--space-2);
  padding: var(--space-3) 0;
  border-radius: var(--radius-lg);
  background: var(--color-surface-soft);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
}

.home__quick-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: var(--radius-full);
  background: var(--color-primary-tint);
  color: var(--color-primary-deep);
}

.home__bundle {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: var(--space-4);
  padding: var(--space-3);
}

.home__bundle img {
  width: 88px;
  height: 88px;
  border-radius: var(--radius-lg);
  object-fit: cover;
}

.home__bundle-copy {
  display: grid;
  gap: 6px;
}

.home__bundle-copy p {
  color: var(--color-text-soft);
  font-size: var(--text-sm);
}

.home__bundle-copy strong {
  color: var(--color-coral);
  font-size: var(--text-xl);
}

.home__product-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.home__state {
  padding: var(--space-5);
  color: var(--color-text-soft);
  text-align: center;
}

.home__member {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-5);
}

.section-link {
  color: var(--color-primary-deep);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
}
</style>
