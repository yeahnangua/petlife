<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { sendAiConsultMessage } from '@/api/public'
import IconSvg from '@/components/IconSvg.vue'
import PriceText from '@/components/PriceText.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import {
  clearAiConsultHistory,
  loadAiConsultHistory,
  saveAiConsultHistory
} from '@/lib/aiConsultHistory'
import { useCatalogStore } from '@/stores/catalog'

const route = useRoute()
const router = useRouter()
const catalogStore = useCatalogStore()

const inputText = ref('')
const messages = ref([])
const sending = ref(false)
const productId = computed(() => {
  const value = route.query.productId
  return Array.isArray(value) ? value[0] || '' : value || ''
})
const product = computed(() => {
  if (!productId.value) return null
  return catalogStore.currentProduct?.id === productId.value ? catalogStore.currentProduct : null
})
const hasProductContext = computed(() => Boolean(product.value))
const productHint = computed(() => product.value?.subtitle || product.value?.suitable || '已带入当前商品信息')

const genericQuestions = ['给猫咪选主粮', '挑选清洁用品', '怎么搭配新手礼包']
const productQuestions = ['适合我家宠物吗', '成分有什么特点', '怎么搭配购买']
const quickQuestions = computed(() => (hasProductContext.value ? productQuestions : genericQuestions))
const FAKE_STREAM_CHAR_DELAY_MS = 24
const RECOMMENDATION_REVEAL_DELAY_MS = 500
const scheduledTimers = new Set()

function scheduleTimer(callback, delay) {
  const timer = setTimeout(() => {
    scheduledTimers.delete(timer)
    callback()
  }, delay)
  scheduledTimers.add(timer)
  return timer
}

function clearScheduledTimers() {
  scheduledTimers.forEach((timer) => clearTimeout(timer))
  scheduledTimers.clear()
}

function scrollMessages() {
  nextTick(() => {
    document.querySelector('.consult__messages')?.lastElementChild?.scrollIntoView?.({ block: 'end' })
  })
}

function restoreMessages(id = productId.value) {
  clearScheduledTimers()
  sending.value = false
  messages.value = loadAiConsultHistory(id).messages
}

function persistMessages() {
  saveAiConsultHistory({
    productId: productId.value,
    messages: messages.value
  })
}

function resetChat() {
  clearScheduledTimers()
  clearAiConsultHistory(productId.value)
  messages.value = []
  sending.value = false
  scrollMessages()
}

function openRecommendation(product) {
  if (!product?.id) return
  router.push({ name: 'product-detail', params: { id: product.id } })
}

function messageHistoryPayload() {
  return messages.value
    .map((message) => ({
      role: message.role,
      content: message.content
    }))
    .filter((message) => message.content)
}

function isActiveMessage(message) {
  return messages.value.includes(message)
}

function finishAssistantResponse(message, recommendations = []) {
  if (!isActiveMessage(message)) return

  if (recommendations.length > 0) {
    scheduleTimer(() => {
      if (!isActiveMessage(message)) return
      message.recommendations = recommendations
      sending.value = false
      persistMessages()
      scrollMessages()
    }, RECOMMENDATION_REVEAL_DELAY_MS)
    return
  }

  sending.value = false
  persistMessages()
  scrollMessages()
}

function streamAssistantReply(message, reply, recommendations = []) {
  const text = typeof reply === 'string' ? reply : ''
  message.isWaiting = false
  message.content = ''
  message.recommendations = []

  if (!text) {
    finishAssistantResponse(message, recommendations)
    return
  }

  let index = 0
  const appendNextCharacter = () => {
    if (!isActiveMessage(message)) return

    index += 1
    message.content = text.slice(0, index)
    scrollMessages()

    if (index < text.length) {
      scheduleTimer(appendNextCharacter, FAKE_STREAM_CHAR_DELAY_MS)
      return
    }

    finishAssistantResponse(message, recommendations)
  }

  scheduleTimer(appendNextCharacter, FAKE_STREAM_CHAR_DELAY_MS)
}

watch(
  productId,
  (id) => {
    restoreMessages(id)

    if (id) {
      catalogStore.fetchProductDetail(id)
    }
  },
  { immediate: true }
)

async function sendMessage(text = inputText.value) {
  const content = text.trim()

  if (!content || sending.value) return

  messages.value.push({ id: `user-${Date.now()}-${messages.value.length}`, role: 'user', content, recommendations: [] })
  messages.value.push({
    id: `ai-${Date.now()}-${messages.value.length}`,
    role: 'assistant',
    content: '',
    recommendations: [],
    isWaiting: true
  })
  const assistantMessage = messages.value.at(-1)
  inputText.value = ''
  sending.value = true
  persistMessages()
  scrollMessages()

  try {
    const response = await sendAiConsultMessage({
      message: content,
      messages: messageHistoryPayload(),
      productId: productId.value || undefined
    })

    streamAssistantReply(assistantMessage, response.reply, response.recommendations || [])
  } catch {
    streamAssistantReply(
      assistantMessage,
      'AI 服务暂时不可用，请稍后再试。你也可以先补充宠物年龄、体重、预算和过敏情况。',
      []
    )
  }
}
</script>

<template>
  <div class="consult">
    <section class="consult__hero page-pad">
      <div class="consult__assistant">
        <span class="consult__avatar">
          <IconSvg name="chat" :size="24" :stroke="1.9" />
        </span>
        <div>
          <p class="consult__status">PetLife AI · 在线</p>
          <h1 class="consult__title font-display">AI 售前咨询</h1>
          <p class="consult__copy">告诉我宠物情况、预算和想解决的问题，先帮你把商品范围缩小。</p>
        </div>
      </div>
    </section>

    <div class="consult__body page-pad">
      <section v-if="catalogStore.loading.productDetail && productId" class="consult__product-loading">
        <SkeletonBlock variant="card" />
      </section>

      <section v-else-if="product" class="consult__product surface-card" data-test="consult-product-card">
        <img :src="product.cover" :alt="product.title" class="consult__product-cover" />
        <div class="consult__product-info">
          <span class="consult__product-label">正在咨询</span>
          <h2>{{ product.title }}</h2>
          <p>{{ productHint }}</p>
          <PriceText :value="product.memberPrice ?? product.price" size="md" />
        </div>
      </section>

      <section class="consult__quick">
        <div class="consult__quick-head">
          <p class="consult__section-label">快捷问题</p>
          <button
            v-if="messages.length"
            type="button"
            class="consult__reset"
            data-test="consult-reset"
            @click="resetChat"
          >
            重置聊天
          </button>
        </div>
        <div class="consult__chips">
          <button
            v-for="(question, index) in quickQuestions"
            :key="question"
            type="button"
            class="consult__chip"
            :data-test="`quick-question-${index}`"
            :disabled="sending"
            @click="sendMessage(question)"
          >
            {{ question }}
          </button>
        </div>
      </section>

      <section class="consult__messages" aria-live="polite">
        <article class="consult__message consult__message--assistant">
          <span class="consult__message-avatar">
            <IconSvg name="service" :size="16" :stroke="1.9" />
          </span>
          <p>
            {{
              hasProductContext
                ? `我看到你正在了解「${product.title}」。可以直接问适用、成分、规格或搭配。`
                : '欢迎咨询。你可以先告诉我宠物类型、年龄和预算。'
            }}
          </p>
        </article>

        <article
          v-for="message in messages"
          :key="message.id"
          class="consult__message"
          :class="`consult__message--${message.role}`"
        >
          <span v-if="message.role === 'assistant'" class="consult__message-avatar">
            <IconSvg name="service" :size="16" :stroke="1.9" />
          </span>
          <div class="consult__message-content">
            <p
              v-if="message.isWaiting"
              class="consult__typing"
              data-test="consult-waiting-dots"
              aria-label="正在等待回复"
            >
              <span>•</span>
              <span>•</span>
              <span>•</span>
            </p>
            <p v-else>{{ message.content }}</p>
            <div
              v-if="message.role === 'assistant' && message.recommendations?.length"
              class="consult__recommendations"
            >
              <button
                v-for="item in message.recommendations"
                :key="item.id"
                type="button"
                class="consult__recommendation-card"
                data-test="consult-recommendation-card"
                @click="openRecommendation(item)"
              >
                <img :src="item.cover" :alt="item.title" />
                <span class="consult__recommendation-body">
                  <strong>{{ item.title }}</strong>
                  <span class="consult__recommendation-meta">
                    <PriceText :value="item.memberPrice ?? item.price" size="sm" />
                    <em>{{ item.tagline || '推荐' }}</em>
                  </span>
                </span>
              </button>
            </div>
          </div>
        </article>
      </section>
    </div>

    <form class="consult__composer" @submit.prevent="sendMessage()">
      <input
        v-model="inputText"
        data-test="consult-input"
        type="text"
        placeholder="输入你的问题"
        aria-label="输入咨询问题"
      />
      <button type="submit" data-test="consult-send" :disabled="!inputText.trim() || sending">
        <IconSvg name="arrow-right" :size="18" :stroke="2.4" />
      </button>
    </form>
  </div>
</template>

<style scoped>
.consult {
  min-height: calc(100dvh - var(--shell-bottom-offset));
  padding-bottom: calc(var(--shell-bottom-offset) + 84px);
}

.consult__hero {
  padding-top: var(--space-4);
}

.consult__assistant {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-5);
  border-radius: var(--radius-xl);
  background:
    linear-gradient(135deg, rgba(46, 74, 56, 0.96), rgba(106, 133, 114, 0.82)),
    var(--color-primary-deep);
  color: var(--color-text-invert);
  box-shadow: var(--shadow-brand);
}

.consult__avatar {
  display: grid;
  place-items: center;
  flex: 0 0 52px;
  width: 52px;
  height: 52px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.14);
}

.consult__status {
  color: rgba(247, 244, 236, 0.72);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
}

.consult__title {
  margin-top: 2px;
  font-size: var(--text-2xl);
  font-weight: var(--weight-semibold);
}

.consult__copy {
  margin-top: 4px;
  color: rgba(247, 244, 236, 0.76);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

.consult__body {
  display: grid;
  gap: var(--space-4);
  padding-top: var(--space-4);
}

.consult__product {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-xl);
}

.consult__product-cover {
  flex: 0 0 76px;
  width: 76px;
  height: 76px;
  border-radius: var(--radius-md);
  object-fit: cover;
  background: var(--color-surface-warm);
}

.consult__product-info {
  display: grid;
  align-content: center;
  gap: 3px;
  min-width: 0;
}

.consult__product-label,
.consult__section-label {
  color: var(--color-primary);
  font-size: var(--text-2xs);
  font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-wider);
}

.consult__product-info h2 {
  color: var(--color-text);
  font-size: var(--text-md);
  font-weight: var(--weight-bold);
  line-height: var(--leading-snug);
}

.consult__product-info p {
  color: var(--color-text-mute);
  font-size: var(--text-xs);
  line-height: var(--leading-relaxed);
}

.consult__quick {
  display: grid;
  gap: var(--space-2);
}

.consult__quick-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.consult__reset {
  min-height: 28px;
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  color: var(--color-text-mute);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
}

.consult__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.consult__chip {
  min-height: 34px;
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  color: var(--color-text-soft);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  box-shadow: var(--shadow-xs);
}

.consult__chip:disabled {
  opacity: 0.55;
}

.consult__messages {
  display: grid;
  gap: var(--space-3);
}

.consult__message {
  display: flex;
  align-items: flex-end;
  gap: var(--space-2);
}

.consult__message:last-child {
  scroll-margin-bottom: calc(var(--shell-bottom-offset) + 96px);
}

.consult__message-content {
  display: grid;
  gap: var(--space-2);
  max-width: min(78%, 300px);
}

.consult__message > p {
  max-width: min(78%, 300px);
}

.consult__message p {
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-md);
  line-height: var(--leading-relaxed);
}

.consult__typing {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-width: 54px;
}

.consult__typing span {
  display: inline-block;
  animation: consultTypingWave 0.9s ease-in-out infinite;
}

.consult__typing span:nth-child(2) {
  animation-delay: 0.12s;
}

.consult__typing span:nth-child(3) {
  animation-delay: 0.24s;
}

@keyframes consultTypingWave {
  0%,
  70%,
  100% {
    transform: translateY(0);
    opacity: 0.45;
  }

  35% {
    transform: translateY(-5px);
    opacity: 1;
  }
}

.consult__message--assistant {
  justify-content: flex-start;
}

.consult__message--assistant p {
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg) var(--radius-lg) var(--radius-lg) 6px;
  background: var(--color-surface);
  color: var(--color-text-soft);
}

.consult__message--user {
  justify-content: flex-end;
}

.consult__message--user .consult__message-content {
  justify-items: end;
}

.consult__message--user p {
  border-radius: var(--radius-lg) var(--radius-lg) 6px var(--radius-lg);
  background: var(--color-primary-deep);
  color: var(--color-text-invert);
}

.consult__message-avatar {
  display: grid;
  place-items: center;
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  background: var(--color-primary-tint);
  color: var(--color-primary);
}

.consult__recommendations {
  display: grid;
  gap: var(--space-2);
  justify-items: start;
}

.consult__recommendation-card {
  display: grid;
  width: 190px;
  overflow: hidden;
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  text-align: left;
  box-shadow: var(--shadow-sm);
}

.consult__recommendation-card img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  background: var(--color-surface-warm);
}

.consult__recommendation-body {
  display: grid;
  gap: 5px;
  padding: var(--space-2) var(--space-3);
}

.consult__recommendation-body strong {
  overflow: hidden;
  color: var(--color-text);
  font-size: var(--text-sm);
  font-weight: var(--weight-bold);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.consult__recommendation-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.consult__recommendation-meta em {
  color: var(--color-primary);
  font-size: var(--text-2xs);
  font-style: normal;
  font-weight: var(--weight-bold);
  white-space: nowrap;
}

.consult__composer {
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
  background: color-mix(in srgb, var(--color-surface) 94%, transparent);
  box-shadow: var(--shadow-float);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.consult__composer input {
  flex: 1;
  min-width: 0;
  height: 42px;
  padding: 0 var(--space-4);
  border-radius: var(--radius-full);
  background: var(--color-surface-warm);
  color: var(--color-text);
  font-size: var(--text-sm);
}

.consult__composer input::placeholder {
  color: var(--color-text-tint);
}

.consult__composer button {
  display: grid;
  place-items: center;
  flex: 0 0 42px;
  width: 42px;
  height: 42px;
  border-radius: var(--radius-full);
  background: var(--color-coral);
  color: #fff;
  transition: transform var(--dur-fast) var(--ease-spring), opacity var(--dur-base) var(--ease-out);
}

.consult__composer button:active:not(:disabled) {
  transform: scale(0.92);
}

.consult__composer button:disabled {
  opacity: 0.45;
}
</style>
