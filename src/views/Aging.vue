<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import { AgingService, type AgingEntry } from '@/apis/services/aging'

const entries = ref<AgingEntry[]>([])
const loading = ref(false)

function formatMoney(value: number) {
  return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function bucketLabel(bucket: AgingEntry['aging_bucket']) {
  if (bucket === 'current') return 'Current'
  if (bucket === '1-30') return '1–30 Days'
  if (bucket === '31-60') return '31–60 Days'
  return '61+ Days'
}

function bucketRank(bucket: AgingEntry['aging_bucket']) {
  if (bucket === '61+') return 4
  if (bucket === '31-60') return 3
  if (bucket === '1-30') return 2
  return 1
}

const orderedEntries = computed(() => {
  return [...entries.value].sort((a, b) => {
    const severityDiff = bucketRank(b.aging_bucket) - bucketRank(a.aging_bucket)
    if (severityDiff !== 0) {
      return severityDiff
    }

    return Number(b.balance) - Number(a.balance)
  })
})

const totalReceivable = computed(() => entries.value.reduce((sum, item) => sum + Number(item.balance || 0), 0))
const highRiskCount = computed(() => entries.value.filter((item) => item.aging_bucket === '61+').length)
const mediumRiskCount = computed(() => entries.value.filter((item) => item.aging_bucket === '31-60').length)
const dueSoonCount = computed(() => entries.value.filter((item) => item.aging_bucket === '1-30').length)

onMounted(async () => {
  loading.value = true
  try {
    entries.value = await AgingService.list()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <AppShell>
    <section class="page-card">
      <div class="page-header">
        <h1>Aging</h1>
        <p class="page-subtitle">Track receivable exposure by aging bucket for better collection prioritization.</p>
      </div>

      <div class="kpi-strip" v-show="!loading">
        <article class="kpi-item">
          <p class="kpi-label">Total Receivable</p>
          <p class="kpi-value">{{ formatMoney(totalReceivable) }}</p>
        </article>
        <article class="kpi-item">
          <p class="kpi-label">61+ Days (High Risk)</p>
          <p class="kpi-value">{{ highRiskCount }}</p>
        </article>
        <article class="kpi-item">
          <p class="kpi-label">31-60 Days</p>
          <p class="kpi-value">{{ mediumRiskCount }}</p>
        </article>
        <article class="kpi-item">
          <p class="kpi-label">1-30 Days</p>
          <p class="kpi-value">{{ dueSoonCount }}</p>
        </article>
      </div>

      <div class="form-section">
        <h3 class="form-title">How to Read This</h3>
        <p class="form-help">Rows are sorted by highest risk first, then by largest balance.</p>
        <p class="form-help">Current: settled · 1–30: due soon · 31–60: overdue · 61+: critical follow-up.</p>
      </div>

      <LoadingSkeleton v-if="loading" :rows="5" />

      <ul v-show="!loading">
        <li v-for="item in orderedEntries" :key="item.loan_id">
          <div>
            <strong>Loan #{{ item.loan_id.slice(0, 8) }}</strong>
            <div class="item-meta">Balance: {{ formatMoney(item.balance) }} · Total: {{ formatMoney(item.total) }}</div>
            <div class="item-meta">Principal: {{ formatMoney(item.principal) }} · Interest: {{ formatMoney(item.interest) }}</div>
            <div class="item-meta">Last Payment: {{ item.last_payment_date || 'No payment yet' }}</div>
          </div>
          <div class="item-actions">
            <span class="aging-badge" :class="`aging-${item.aging_bucket.replace('+', 'plus')}`">
              {{ bucketLabel(item.aging_bucket) }}
            </span>
            <RouterLink
              class="btn btn-secondary"
              :to="{ path: '/collections-workflow', query: { loanId: item.loan_id, action: 'log', bucket: item.aging_bucket } }"
            >
              Follow Up
            </RouterLink>
          </div>
        </li>
      </ul>
    </section>
  </AppShell>
</template>
