<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import BottomSheet from '@/components/BottomSheet.vue'
import EmptyState from '@/components/EmptyState.vue'
import IconSvg from '@/components/IconSvg.vue'
import PriceText from '@/components/PriceText.vue'
import { scoreVisualSearchProducts } from '@/api/public'
import { buildProductImageSimilarities, recognizeImageElement } from '@/lib/imageRecognition'
import {
  loadVisualSearchHistory,
  rankVisualSearchMatches,
  removeVisualSearchRecord,
  saveVisualSearchHistory,
  toggleVisualSearchFavorite,
  upsertVisualSearchHistory
} from '@/lib/visualSearch'
import { useCatalogStore } from '@/stores/catalog'

const router = useRouter()
const catalogStore = useCatalogStore()

const searchKeyword = ref('')
const visualSearchStatus = ref('idle')
const showActionSheet = ref(false)
const showHistory = ref(false)
const fileInputRef = ref(null)
const previewImageRef = ref(null)
const previewUrl = ref('')
const selectedImageName = ref('cat-food-package.jpg')
const selectedPetType = ref('cat')
const recognitionResult = ref(null)
const recognitionError = ref('')
const aiSimilarityStatus = ref('idle')
const aiSimilarityError = ref('')
const matches = ref([])
const history = ref([])
const activeVisualSearchId = ref(0)

const labels = computed(() => {
  if (!matches.value.length) return ['宠物用品', '相似商品']
  return [...new Set(matches.value.flatMap((item) => item.labels))].slice(0, 3)
})

const statusTitle = computed(() => {
  if (visualSearchStatus.value === 'success') return `找到 ${matches.value.length} 个相似商品`
  if (visualSearchStatus.value === 'empty') return '没有找到相似商品'
  if (visualSearchStatus.value === 'error') return '识别失败，请重试'
  return '拍照搜商品'
})

onMounted(() => {
  history.value = loadVisualSearchHistory()
  catalogStore.fetchVisualSearchProducts()
})

onBeforeUnmount(() => {
  activeVisualSearchId.value += 1
  revokePreview()
})

function openVisualActions() {
  showActionSheet.value = true
}

function chooseCamera() {
  showActionSheet.value = false
  selectedPetType.value = 'cat'
  if (fileInputRef.value) {
    fileInputRef.value.setAttribute('capture', 'environment')
    fileInputRef.value.click()
  }
}

function chooseAlbum() {
  showActionSheet.value = false
  if (fileInputRef.value) {
    fileInputRef.value.removeAttribute('capture')
    fileInputRef.value.click()
  }
}

async function ensureVisualSearchProducts({ force = false } = {}) {
  if (catalogStore.visualSearchProducts.length && !force) {
    return catalogStore.visualSearchProducts
  }

  const loadedProducts = await catalogStore.fetchVisualSearchProducts({ force })
  const products = loadedProducts.length ? loadedProducts : catalogStore.visualSearchProducts

  if (!products.length) {
    throw new Error(catalogStore.error.visualSearch || '商品目录加载失败，请稍后重试。')
  }

  return products
}

async function useDemoImage() {
  showActionSheet.value = false
  revokePreview()
  selectedPetType.value = 'cat'
  selectedImageName.value = 'cat-food-package.jpg'
  recognitionResult.value = null
  recognitionError.value = ''
  aiSimilarityStatus.value = 'idle'
  aiSimilarityError.value = ''
  activeVisualSearchId.value += 1

  try {
    const products = await ensureVisualSearchProducts()
    previewUrl.value = products[0]?.cover || ''
    visualSearchStatus.value = previewUrl.value ? 'preview' : 'empty'
  } catch (error) {
    previewUrl.value = ''
    recognitionError.value = error instanceof Error ? error.message : '商品目录加载失败，请稍后重试。'
    visualSearchStatus.value = 'error'
  }
}

function openHistory() {
  showActionSheet.value = false
  showHistory.value = true
}

function toVisualSearchCandidate(product) {
  return {
    id: product.id,
    title: product.title,
    subtitle: product.subtitle,
    tags: product.tags || [],
    category: product.category,
    petType: product.petType
  }
}

function buildRankedMatches({
  products,
  recognition,
  imageSimilarities,
  aiResult = {}
}) {
  const enrichedRecognition = {
    ...recognition,
    displayLabels: aiResult.labels?.length ? aiResult.labels : recognition.displayLabels
  }

  return rankVisualSearchMatches({
    products,
    petType: selectedPetType.value,
    imageName: selectedImageName.value,
    recognition: enrichedRecognition,
    imageSimilarities,
    aiSimilarities: aiResult.aiSimilarities || {},
    limit: 6
  })
}

function saveSearchMatches(rankedMatches, historyId) {
  if (!rankedMatches.length) return

  history.value = upsertVisualSearchHistory(history.value, {
    id: historyId,
    imageUrl: previewUrl.value,
    labels: labels.value,
    matches: rankedMatches,
    searchedAt: new Date().toISOString()
  })
  saveVisualSearchHistory(history.value)
}

async function resolveAiSimilarities(recognition, products) {
  try {
    return await scoreVisualSearchProducts({
      recognition: {
        labels: recognition.labels || [],
        keywords: recognition.keywords || [],
        categoryHints: recognition.categoryHints || []
      },
      products: products.map(toVisualSearchCandidate)
    })
  } catch {
    return {
      aiSimilarities: {},
      labels: [],
      errorMessage: 'AI相似度暂不可用，已按图片相似度展示。'
    }
  }
}

function handleFileSelect(event) {
  const file = event.target.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    recognitionError.value = '请选择 JPG、PNG 或 WebP 图片后重试。'
    visualSearchStatus.value = 'error'
    return
  }

  revokePreview()
  selectedImageName.value = file.name
  selectedPetType.value = /dog|犬|狗/.test(file.name.toLowerCase()) ? 'dog' : 'cat'
  recognitionResult.value = null
  recognitionError.value = ''
  aiSimilarityStatus.value = 'idle'
  aiSimilarityError.value = ''
  activeVisualSearchId.value += 1
  previewUrl.value = URL.createObjectURL(file)
  visualSearchStatus.value = 'preview'
  event.target.value = ''
}

async function confirmVisualSearch() {
  activeVisualSearchId.value += 1
  const searchId = activeVisualSearchId.value
  const historyId = `vs-${Date.now()}`

  visualSearchStatus.value = 'recognizing'
  recognitionError.value = ''
  aiSimilarityStatus.value = 'idle'
  aiSimilarityError.value = ''

  try {
    const recognition = await recognizeImageElement(previewImageRef.value)
    recognitionResult.value = recognition
    selectedPetType.value = recognition.petType || selectedPetType.value
    const products = await ensureVisualSearchProducts({ force: true })
    const aiSimilarityPromise = resolveAiSimilarities(recognition, products)
    const imageSimilarities = await buildProductImageSimilarities(products, recognition.embedding || [])

    if (searchId !== activeVisualSearchId.value) {
      return
    }

    const rankedMatches = buildRankedMatches({
      products,
      recognition,
      imageSimilarities
    })

    matches.value = rankedMatches
    visualSearchStatus.value = rankedMatches.length ? 'success' : 'empty'

    if (rankedMatches.length) {
      aiSimilarityStatus.value = 'analyzing'
      saveSearchMatches(rankedMatches, historyId)
      aiSimilarityPromise.then((aiResult) => {
        if (searchId !== activeVisualSearchId.value || visualSearchStatus.value !== 'success') {
          return
        }

        aiSimilarityStatus.value = aiResult.errorMessage ? 'error' : 'done'
        aiSimilarityError.value = aiResult.errorMessage || ''

        if (aiResult.errorMessage) {
          return
        }

        const aiRankedMatches = buildRankedMatches({
          products,
          recognition,
          imageSimilarities,
          aiResult
        })
        matches.value = aiRankedMatches
        saveSearchMatches(aiRankedMatches, historyId)
      })
    } else {
      aiSimilarityStatus.value = 'idle'
    }
  } catch (error) {
    matches.value = []
    recognitionError.value = error instanceof Error ? error.message : '识图模型加载失败，请检查网络后重试'
    visualSearchStatus.value = 'error'
  }
}

function rerunHistory(item) {
  showHistory.value = false
  previewUrl.value = item.thumbUrl
  selectedImageName.value = `${item.labels.join('-')}.jpg`
  selectedPetType.value = item.labels.some((label) => label.includes('狗')) ? 'dog' : 'cat'
  confirmVisualSearch()
}

function toggleFavorite(id) {
  history.value = toggleVisualSearchFavorite(history.value, id)
  saveVisualSearchHistory(history.value)
}

function deleteHistory(id) {
  history.value = removeVisualSearchRecord(history.value, id)
  saveVisualSearchHistory(history.value)
}

function clearHistory() {
  history.value = []
  saveVisualSearchHistory(history.value)
}

function resetVisualSearch() {
  revokePreview()
  previewUrl.value = ''
  recognitionResult.value = null
  recognitionError.value = ''
  aiSimilarityStatus.value = 'idle'
  aiSimilarityError.value = ''
  matches.value = []
  visualSearchStatus.value = 'idle'
  activeVisualSearchId.value += 1
}

function revokePreview() {
  if (previewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value)
  }
}

function goTextSearch() {
  router.push({ path: '/products', query: { keyword: searchKeyword.value || undefined } })
}

function formatTime(value) {
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.max(0, Math.floor(diff / 60000))
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  if (days < 7) return `${days} 天前`
  return new Date(value).toLocaleDateString('zh-CN')
}
</script>

<template>
  <div class="search page-pad">
    <section class="search__hero">
      <p class="search__eyebrow">VISUAL SEARCH</p>
      <h2 class="search__title font-display">{{ statusTitle }}</h2>
      <p class="search__copy">上传商品照片，识别主体特征后展示相似商品、相似度和推荐理由。</p>

      <div class="search__bar">
        <IconSvg name="search" :size="18" :stroke="2" />
        <input v-model="searchKeyword" type="search" placeholder="输入猫粮、玩具、洗护用品" @keyup.enter="goTextSearch" />
        <button type="button" class="search__camera" aria-label="打开拍照搜商品" @click="openVisualActions">
          <IconSvg name="image" :size="20" :stroke="1.9" />
        </button>
      </div>

      <div class="search__actions">
        <button type="button" class="button-primary" @click="openVisualActions">拍照搜商品</button>
        <button type="button" class="search__ghost" @click="useDemoImage">使用示例图</button>
      </div>
    </section>

    <section v-if="visualSearchStatus === 'idle'" class="search__guide">
      <article>
        <span><IconSvg name="image" :size="20" :stroke="1.8" /></span>
        <strong>清晰主体</strong>
        <p>商品包装、玩具或用品主体尽量占画面中心。</p>
      </article>
      <article>
        <span><IconSvg name="check" :size="20" :stroke="2" /></span>
        <strong>确认再识别</strong>
        <p>预览页可重新选择，避免传错图片。</p>
      </article>
      <article>
        <span><IconSvg name="star" :size="20" :stroke="1.8" /></span>
        <strong>历史可复搜</strong>
        <p>最近记录保存在本地，可收藏或删除。</p>
      </article>
    </section>

    <section v-if="visualSearchStatus === 'preview'" class="search__preview">
      <div class="search__preview-media">
        <img ref="previewImageRef" :src="previewUrl" crossorigin="anonymous" alt="待识别商品图片" />
      </div>
      <div class="search__preview-body">
        <p class="search__hint">请确认商品主体清晰可见</p>
        <div class="search__preview-actions">
          <button type="button" class="search__ghost" @click="resetVisualSearch">重新选择</button>
          <button type="button" class="button-primary" @click="confirmVisualSearch">确认识别</button>
        </div>
      </div>
    </section>

    <section v-if="visualSearchStatus === 'recognizing'" class="search__loading">
      <span class="search__spinner" />
      <strong>正在识别商品特征</strong>
      <p>MobileNet 正在分析图片标签，并对比商品主图相似度。</p>
    </section>

    <section v-if="visualSearchStatus === 'success'" class="search__results">
      <header class="search__result-head">
        <img :src="previewUrl" alt="查询图片缩略图" />
        <div>
          <p>识别标签</p>
          <div class="search__tags">
            <span v-for="label in labels" :key="label">{{ label }}</span>
          </div>
          <p v-if="aiSimilarityStatus === 'analyzing'" class="search__ai-warning">
            <span class="search__ai-spinner" aria-hidden="true" />
            <span>AI正在分析，稍后会按 AI 相似度重新排序。</span>
          </p>
          <p v-else-if="aiSimilarityError" class="search__ai-warning">{{ aiSimilarityError }}</p>
        </div>
      </header>

      <div class="search__grid">
        <article v-for="match in matches" :key="match.product.id" class="search__card" @click="router.push(`/product/${match.product.id}`)">
          <div class="search__card-media">
            <img :src="match.product.cover" :alt="match.product.title" />
            <span>{{ match.similarity }}% 相似</span>
          </div>
          <div class="search__card-body">
            <h3>{{ match.product.title }}</h3>
            <div class="search__score-breakdown" aria-label="相似度构成">
              <span v-if="match.aiSimilarity !== null">AI相似度 {{ match.aiSimilarity }}%</span>
              <span v-if="match.imageSimilarity !== null">图片相似度 {{ match.imageSimilarity }}%</span>
            </div>
            <p>{{ match.reason }}</p>
            <PriceText :value="match.product.memberPrice" :original="match.product.originalPrice" size="sm" />
          </div>
        </article>
      </div>
    </section>

    <EmptyState
      v-if="visualSearchStatus === 'empty'"
      icon="image"
      title="未找到相似商品"
      description="换张主体更清晰的图片，或改用文字搜索。"
      action-label="重新选择图片"
      @action="openVisualActions"
    />

    <EmptyState
      v-if="visualSearchStatus === 'error'"
      icon="image"
      title="图片无法识别"
      :description="recognitionError || '请选择 JPG、PNG 或 WebP 图片后重试。'"
      action-label="重新选择图片"
      @action="openVisualActions"
    />

    <BottomSheet :open="showActionSheet" title="选择图片来源" @close="showActionSheet = false">
      <div class="search__sheet-actions">
        <button type="button" @click="chooseCamera">
          <IconSvg name="image" :size="20" :stroke="1.9" />
          <span>拍照搜索</span>
          <small>调用后置摄像头拍摄商品</small>
        </button>
        <button type="button" @click="chooseAlbum">
          <IconSvg name="image" :size="20" :stroke="1.9" />
          <span>从相册选择</span>
          <small>上传已有商品照片或截图</small>
        </button>
        <button type="button" @click="openHistory">
          <IconSvg name="history" :size="20" :stroke="1.9" />
          <span>查看图搜历史</span>
          <small>重新搜索、收藏或删除记录</small>
        </button>
      </div>
    </BottomSheet>

    <BottomSheet :open="showHistory" title="图搜历史" @close="showHistory = false">
      <div class="search__history-head">
        <p>图片搜索记录仅保存在本地。</p>
        <button v-if="history.length" type="button" @click="clearHistory">清空</button>
      </div>

      <div v-if="history.length" class="search__history">
        <article v-for="item in history" :key="item.id" class="search__history-item">
          <img :src="item.thumbUrl" alt="历史搜索缩略图" />
          <button type="button" class="search__history-main" @click="rerunHistory(item)">
            <strong>{{ item.labels.join(' · ') }}</strong>
            <span>{{ formatTime(item.searchedAt) }} · 找到 {{ item.resultCount }} 个商品</span>
            <small v-if="item.topProductTitle">Top1：{{ item.topProductTitle }}</small>
          </button>
          <button type="button" class="search__history-icon" :aria-label="item.favorite ? '取消收藏' : '收藏记录'" @click="toggleFavorite(item.id)">
            <IconSvg name="star" :size="16" :stroke="item.favorite ? 2.6 : 1.7" />
          </button>
          <button type="button" class="search__history-icon" aria-label="删除记录" @click="deleteHistory(item.id)">
            <IconSvg name="close" :size="16" :stroke="2" />
          </button>
        </article>
      </div>

      <EmptyState
        v-else
        icon="image"
        title="暂无图搜历史"
        description="试试拍照搜商品，历史记录会出现在这里。"
        action-label="开始图搜"
        @action="openVisualActions"
      />
    </BottomSheet>

    <input ref="fileInputRef" type="file" accept="image/*" class="search__file" @change="handleFileSelect" />
  </div>
</template>

<style scoped>
.search {
  display: grid;
  gap: var(--space-4);
  padding-top: var(--space-3);
  padding-bottom: var(--space-6);
}

.search__hero {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-5);
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, #edf6ee 0%, #fff7e8 100%);
  border: 1px solid rgba(74, 116, 84, 0.13);
  box-shadow: var(--shadow-xs);
}

.search__eyebrow {
  color: var(--color-primary);
  font-size: var(--text-2xs);
  font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-wider);
}

.search__title {
  font-size: var(--text-2xl);
  font-weight: var(--weight-semibold);
}

.search__copy {
  color: var(--color-text-soft);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

.search__bar {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) 44px;
  align-items: center;
  gap: var(--space-2);
  min-height: 48px;
  padding: 0 var(--space-2) 0 var(--space-4);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-full);
  background: var(--color-surface);
}

.search__bar input {
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--color-text);
  font-size: var(--text-sm);
}

.search__camera {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: var(--radius-full);
  background: var(--color-primary-deep);
  color: var(--color-text-invert);
  box-shadow: var(--shadow-brand);
}

.search__actions,
.search__preview-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.search__ghost {
  min-height: 42px;
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  color: var(--color-text-soft);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
}

.search__guide {
  display: grid;
  gap: var(--space-3);
}

.search__guide article {
  display: grid;
  grid-template-columns: 42px minmax(0, auto);
  gap: 2px var(--space-3);
  align-items: center;
  padding: var(--space-4);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.search__guide span {
  grid-row: span 2;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: var(--radius-full);
  background: var(--color-primary-tint);
  color: var(--color-primary);
}

.search__guide strong {
  font-size: var(--text-md);
}

.search__guide p {
  color: var(--color-text-mute);
  font-size: var(--text-xs);
}

.search__preview,
.search__loading,
.search__results {
  overflow: hidden;
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-xs);
}

.search__preview-media {
  aspect-ratio: 1 / 0.78;
  background: var(--color-surface-warm);
}

.search__preview-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.search__preview-body {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4);
}

.search__hint {
  color: var(--color-text-soft);
  font-size: var(--text-sm);
}

.search__loading {
  display: grid;
  justify-items: center;
  gap: var(--space-3);
  padding: var(--space-10) var(--space-5);
  text-align: center;
}

.search__loading p {
  color: var(--color-text-mute);
  font-size: var(--text-sm);
}

.search__spinner {
  width: 46px;
  height: 46px;
  border: 3px solid var(--color-primary-tint);
  border-top-color: var(--color-primary);
  border-radius: var(--radius-full);
  animation: search-spin 0.8s linear infinite;
}

@keyframes search-spin {
  to {
    transform: rotate(360deg);
  }
}

.search__result-head {
  display: grid;
  grid-template-columns: 68px minmax(0, 1fr);
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border-soft);
}

.search__result-head img {
  width: 68px;
  height: 68px;
  border-radius: var(--radius-md);
  object-fit: cover;
}

.search__result-head p {
  margin-bottom: var(--space-2);
  color: var(--color-text-mute);
  font-size: var(--text-xs);
}

.search__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.search__tags span {
  padding: 4px 9px;
  border-radius: var(--radius-full);
  background: var(--color-primary-tint);
  color: var(--color-primary);
  font-size: var(--text-2xs);
  font-weight: var(--weight-semibold);
}

.search__result-head .search__ai-warning {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: var(--space-2) 0 0;
  color: var(--color-text-soft);
  font-size: var(--text-2xs);
  line-height: var(--leading-snug);
}

.search__ai-spinner {
  width: 12px;
  height: 12px;
  flex: 0 0 auto;
  border: 2px solid color-mix(in srgb, var(--color-primary) 24%, transparent);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: search-ai-spin 0.75s linear infinite;
}

@keyframes search-ai-spin {
  to {
    transform: rotate(360deg);
  }
}

.search__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
  padding: var(--space-4);
}

.search__card {
  overflow: hidden;
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.search__card-media {
  position: relative;
  aspect-ratio: 1 / 0.9;
  background: var(--color-surface-warm);
}

.search__card-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.search__card-media span {
  position: absolute;
  left: var(--space-2);
  bottom: var(--space-2);
  padding: 3px 8px;
  border-radius: var(--radius-full);
  background: rgba(35, 33, 28, 0.78);
  color: var(--color-text-invert);
  font-size: var(--text-2xs);
}

.search__card-body {
  display: grid;
  gap: 5px;
  padding: var(--space-3);
}

.search__card-body h3 {
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-snug);
}

.search__score-breakdown {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.search__score-breakdown span {
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  background: var(--color-primary-tint);
  color: var(--color-primary);
  font-size: var(--text-2xs);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-snug);
}

.search__card-body p {
  color: var(--color-text-mute);
  font-size: var(--text-2xs);
  line-height: var(--leading-snug);
}

.search__sheet-actions {
  display: grid;
  gap: var(--space-2);
}

.search__sheet-actions button {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 2px var(--space-3);
  align-items: center;
  min-height: 62px;
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  background: var(--color-surface-warm);
  text-align: left;
}

.search__sheet-actions svg {
  grid-row: span 2;
  color: var(--color-primary);
}

.search__sheet-actions span {
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
}

.search__sheet-actions small {
  color: var(--color-text-mute);
  font-size: var(--text-xs);
}

.search__history-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.search__history-head p {
  color: var(--color-text-mute);
  font-size: var(--text-xs);
}

.search__history-head button {
  color: var(--color-danger);
  font-size: var(--text-sm);
}

.search__history {
  display: grid;
  gap: var(--space-2);
}

.search__history-item {
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr) 32px 32px;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
}

.search__history-item img {
  width: 54px;
  height: 54px;
  border-radius: var(--radius-md);
  object-fit: cover;
}

.search__history-main {
  display: grid;
  gap: 2px;
  min-width: 0;
  text-align: left;
}

.search__history-main strong,
.search__history-main span,
.search__history-main small {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.search__history-main strong {
  font-size: var(--text-sm);
}

.search__history-main span,
.search__history-main small {
  color: var(--color-text-mute);
  font-size: var(--text-2xs);
}

.search__history-icon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background: var(--color-surface-warm);
  color: var(--color-text-soft);
}

.search__file {
  display: none;
}
</style>
