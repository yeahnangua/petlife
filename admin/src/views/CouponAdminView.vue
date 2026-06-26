<script setup>
import { onMounted, reactive, ref } from 'vue'
import {
  createCouponCampaign,
  issueCoupon,
  listCouponCampaigns,
  listUserCoupons,
  updateCouponCampaign,
  updateUserCoupon
} from '@/api/coupons'

const loading = ref(false)
const saving = ref(false)
const error = ref('')
const campaigns = ref([])
const issuedCoupons = ref([])
const issueUserId = ref('u_demo_001')
const issuedFilterUserId = ref('u_demo_001')

const campaignStatusText = {
  active: '启用',
  disabled: '停用'
}

const userCouponStatusText = {
  available: '可用',
  used: '已使用',
  disabled: '已停用',
  expired: '已过期'
}

const campaignForm = reactive({
  name: '',
  description: '',
  discount_amount: 0,
  min_order_amount: 0,
  total_limit: 0,
  valid_from: '2026-06-01 00:00:00',
  valid_to: '2026-12-31 23:59:59'
})

async function loadPage() {
  loading.value = true
  error.value = ''

  try {
    const [campaignData, issuedData] = await Promise.all([
      listCouponCampaigns(),
      fetchIssuedCoupons()
    ])
    campaigns.value = campaignData.list || []
    issuedCoupons.value = issuedData.list || []
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : '优惠券加载失败'
  } finally {
    loading.value = false
  }
}

function fetchIssuedCoupons() {
  return listUserCoupons({ user_id: issuedFilterUserId.value.trim() })
}

async function filterIssuedCoupons() {
  loading.value = true
  error.value = ''

  try {
    const data = await fetchIssuedCoupons()
    issuedCoupons.value = data.list || []
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : '用户券加载失败'
  } finally {
    loading.value = false
  }
}

function formatCampaignStatus(status) {
  return campaignStatusText[status] || status
}

function formatUserCouponStatus(status) {
  return userCouponStatusText[status] || status
}

function serializeCampaignForm() {
  return {
    name: campaignForm.name.trim(),
    description: campaignForm.description.trim(),
    discount_amount: Number(campaignForm.discount_amount),
    min_order_amount: Number(campaignForm.min_order_amount),
    total_limit: Number(campaignForm.total_limit),
    valid_from: campaignForm.valid_from.trim(),
    valid_to: campaignForm.valid_to.trim()
  }
}

function resetCampaignForm() {
  campaignForm.name = ''
  campaignForm.description = ''
  campaignForm.discount_amount = 0
  campaignForm.min_order_amount = 0
  campaignForm.total_limit = 0
  campaignForm.valid_from = '2026-06-01 00:00:00'
  campaignForm.valid_to = '2026-12-31 23:59:59'
}

async function submitCampaign() {
  saving.value = true
  error.value = ''

  try {
    const data = await createCouponCampaign(serializeCampaignForm())
    campaigns.value = [data.item, ...campaigns.value]
    resetCampaignForm()
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : '优惠券活动保存失败'
  } finally {
    saving.value = false
  }
}

async function updateCampaignStatus(campaign, status) {
  saving.value = true
  error.value = ''

  try {
    const data = await updateCouponCampaign(campaign.id, {
      name: campaign.name,
      description: campaign.description,
      discount_amount: campaign.discount_amount,
      min_order_amount: campaign.min_order_amount,
      total_limit: campaign.total_limit,
      status,
      valid_from: campaign.valid_from,
      valid_to: campaign.valid_to
    })
    campaigns.value = campaigns.value.map((item) => (item.id === data.item.id ? data.item : item))
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : '活动状态更新失败'
  } finally {
    saving.value = false
  }
}

async function submitIssue(campaignId) {
  saving.value = true
  error.value = ''

  try {
    const data = await issueCoupon(campaignId, { user_id: issueUserId.value.trim() })
    if (data.item.user_id === issuedFilterUserId.value.trim()) {
      issuedCoupons.value = [data.item, ...issuedCoupons.value]
    }
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : '发放优惠券失败'
  } finally {
    saving.value = false
  }
}

async function updateIssuedCouponStatus(couponId, status) {
  saving.value = true
  error.value = ''

  try {
    const data = await updateUserCoupon(couponId, { status })
    issuedCoupons.value = issuedCoupons.value.map((item) => (item.id === data.item.id ? data.item : item))
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : '用户券状态更新失败'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadPage()
})
</script>

<template>
  <section class="admin-list-page">
    <div class="admin-list-page__header">
      <div>
        <p class="admin-list-page__meta">优惠券管理</p>
        <h2>活动创建与用户发券</h2>
      </div>
    </div>

    <p v-if="error" class="admin-list-page__error">{{ error }}</p>

    <section class="coupon-form">
      <label>
        <span>活动名称</span>
        <input v-model="campaignForm.name" data-test="campaign-name" />
      </label>
      <label>
        <span>说明</span>
        <input v-model="campaignForm.description" data-test="campaign-description" />
      </label>
      <label>
        <span>优惠金额</span>
        <input v-model="campaignForm.discount_amount" type="number" min="0" data-test="campaign-discount" />
      </label>
      <label>
        <span>使用门槛</span>
        <input v-model="campaignForm.min_order_amount" type="number" min="0" data-test="campaign-threshold" />
      </label>
      <label>
        <span>发行上限</span>
        <input v-model="campaignForm.total_limit" type="number" min="0" data-test="campaign-limit" />
      </label>
      <label>
        <span>生效时间</span>
        <input v-model="campaignForm.valid_from" data-test="campaign-valid-from" />
      </label>
      <label>
        <span>失效时间</span>
        <input v-model="campaignForm.valid_to" data-test="campaign-valid-to" />
      </label>
      <button type="button" class="button-primary" :disabled="saving" data-test="create-campaign" @click="submitCampaign">
        创建优惠券
      </button>
    </section>

    <div class="coupon-issue">
      <label>
        <span>发放用户 ID</span>
        <input v-model="issueUserId" data-test="issue-user-id" />
      </label>
    </div>

    <div v-if="loading" class="admin-list-page__state">正在加载优惠券...</div>
    <div v-else class="admin-table">
      <header class="admin-table__row admin-table__row--head coupon-row">
        <span>活动</span>
        <span>规则</span>
        <span>状态</span>
        <span>发行</span>
        <span>操作</span>
      </header>
      <article v-for="item in campaigns" :key="item.id" class="admin-table__row coupon-row">
        <span>{{ item.name }}</span>
        <span>满 {{ item.min_order_amount }} 减 {{ item.discount_amount }} · {{ item.description }}</span>
        <span>{{ formatCampaignStatus(item.status) }}</span>
        <span>{{ item.issued_count }} / {{ item.total_limit || '不限' }}</span>
        <div class="admin-table__actions">
          <button type="button" :disabled="item.status === 'disabled'" :data-test="`issue-${item.id}`" @click="submitIssue(item.id)">发放</button>
          <button
            v-if="item.status === 'disabled'"
            type="button"
            :data-test="`enable-${item.id}`"
            @click="updateCampaignStatus(item, 'active')"
          >
            启用
          </button>
          <button
            v-else
            type="button"
            :data-test="`disable-${item.id}`"
            @click="updateCampaignStatus(item, 'disabled')"
          >
            停用
          </button>
        </div>
      </article>
    </div>

    <section class="issued-section">
      <div class="issued-section__header">
        <h3>用户券</h3>
        <div class="coupon-filter">
          <label>
            <span>筛选用户 ID</span>
            <input
              v-model="issuedFilterUserId"
              data-test="coupon-filter-user-id"
              @keyup.enter="filterIssuedCoupons"
            />
          </label>
          <button
            type="button"
            class="button-primary"
            :disabled="loading"
            data-test="filter-user-coupons"
            @click="filterIssuedCoupons"
          >
            查询用户券
          </button>
        </div>
      </div>
      <div class="admin-table">
        <header class="admin-table__row admin-table__row--head issued-row">
          <span>券</span>
          <span>用户</span>
          <span>状态</span>
          <span>操作</span>
        </header>
        <article v-for="item in issuedCoupons" :key="item.id" class="admin-table__row issued-row">
          <span>{{ item.name }}</span>
          <span>{{ item.user_id }}</span>
          <span>{{ formatUserCouponStatus(item.status) }}</span>
          <div class="admin-table__actions">
            <button
              v-if="item.status === 'disabled'"
              type="button"
              :data-test="`enable-${item.id}`"
              @click="updateIssuedCouponStatus(item.id, 'available')"
            >
              启用
            </button>
            <button
              v-else-if="item.status === 'available'"
              type="button"
              :data-test="`disable-${item.id}`"
              @click="updateIssuedCouponStatus(item.id, 'disabled')"
            >
              停用
            </button>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>

<style scoped>
.admin-list-page {
  display: grid;
  gap: 18px;
}

.admin-list-page__header,
.admin-table__row,
.admin-table__actions,
.coupon-form,
.coupon-issue,
.issued-section__header,
.coupon-filter {
  display: flex;
  align-items: center;
}

.admin-list-page__header {
  justify-content: space-between;
}

.admin-list-page__meta {
  color: #8f6d50;
  font-size: 12px;
}

.admin-list-page__state,
.admin-list-page__error {
  padding: 16px;
  border-radius: 18px;
  background: #fff7ef;
}

.admin-list-page__error {
  color: #b4472f;
}

.coupon-form,
.coupon-issue,
.coupon-filter {
  flex-wrap: wrap;
  gap: 12px;
}

.coupon-form,
.coupon-issue {
  padding: 16px;
  border-radius: 18px;
  background: #fffaf4;
}

.coupon-form label,
.coupon-issue label,
.coupon-filter label {
  display: grid;
  gap: 6px;
  min-width: 150px;
  font-size: 12px;
  color: #8f6d50;
}

.coupon-form input,
.coupon-issue input,
.coupon-filter input {
  min-height: 36px;
  padding: 0 10px;
  border: 1px solid #ead8c8;
  border-radius: 10px;
  background: #fff;
  color: #33261f;
}

.admin-table {
  overflow: hidden;
  border: 1px solid #ead8c8;
  border-radius: 18px;
  background: #fffaf4;
}

.admin-table__row {
  min-height: 54px;
  padding: 0 16px;
  border-bottom: 1px solid #f0dfd0;
}

.admin-table__row:last-child {
  border-bottom: 0;
}

.admin-table__row--head {
  min-height: 42px;
  background: #f5e8db;
  color: #7c5c45;
  font-size: 12px;
  font-weight: 700;
}

.coupon-row {
  display: grid;
  grid-template-columns: 1.1fr 1.6fr 0.7fr 0.8fr 1fr;
  gap: 12px;
}

.issued-row {
  display: grid;
  grid-template-columns: 1.4fr 1fr 0.8fr 1fr;
  gap: 12px;
}

.admin-table__actions {
  gap: 8px;
}

.admin-table__actions button,
.button-primary {
  min-height: 34px;
  padding: 0 12px;
  border: 0;
  border-radius: 10px;
  background: #2f251f;
  color: #fff8f0;
  cursor: pointer;
}

.admin-table__actions button:disabled,
.button-primary:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.button-primary {
  background: #8f5f38;
}

.issued-section {
  display: grid;
  gap: 12px;
}

.issued-section__header {
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
</style>
