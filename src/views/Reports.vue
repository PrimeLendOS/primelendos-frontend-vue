<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import Chart from 'chart.js/auto'
import AppShell from '@/components/AppShell.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import { AgingService } from '@/apis/services/aging'
import JwtService from '@/apis/jwt'
import { DashboardService, type DashboardSummary } from '@/apis/services/dashboard'
import {
  FundingService,
  type CashflowTrend,
  type FundingAccount,
  type FundingSummary,
  type FundingTransaction,
} from '@/apis/services/funding'
import { ReportService } from '@/apis/services/reports'
import { useAuthStore } from '@/store/auth'

const loading = ref(false)
const fromDate = ref('')
const toDate = ref('')
const selectedPreset = ref('Custom')
const analyticsLoading = ref(false)
const analyticsError = ref('')

const dashboard = ref<DashboardSummary | null>(null)
const fundingSummary = ref<FundingSummary | null>(null)
const fundingAccounts = ref<FundingAccount[]>([])
const fundingTransactions = ref<FundingTransaction[]>([])
const agingRows = ref<Array<{ aging_bucket: string; balance: number }>>([])
const cashflowTrend = ref<CashflowTrend | null>(null)
const cashflowTrendCanvas = ref<HTMLCanvasElement | null>(null)
const selectedCashflowWindowDays = ref<7 | 30 | 60>(30)
const selectedCashflowSeries = ref<'net' | 'inflows' | 'outflows'>('net')
let cashflowTrendChart: Chart<'line'> | null = null
const authStore = useAuthStore()

const CASHFLOW_WINDOW_STORAGE_BASE_KEY = 'reports.cashflow.windowDays'
const CASHFLOW_SERIES_STORAGE_BASE_KEY = 'reports.cashflow.series'
const LEGACY_CASHFLOW_WINDOW_STORAGE_KEY = 'reports.cashflow.windowDays'
const LEGACY_CASHFLOW_SERIES_STORAGE_KEY = 'reports.cashflow.series'

function decodeJwtPayload(token: string) {
  const parts = token.split('.')
  if (parts.length < 2) {
    return null
  }

  try {
    const payloadPart = parts[1]
    if (!payloadPart) {
      return null
    }
    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    return JSON.parse(window.atob(padded)) as Record<string, unknown>
  } catch {
    return null
  }
}

function getCurrentUserScopeKey() {
  const authUser = authStore.user
  if (authUser?._id) {
    return String(authUser._id)
  }
  if (authUser?.email) {
    return String(authUser.email)
  }

  const token = JwtService.getToken()
  if (!token) {
    return 'anonymous'
  }

  const payload = decodeJwtPayload(token)
  const scopedId = payload?.sub ?? payload?.userId ?? payload?.id ?? payload?.email
  if (scopedId) {
    return String(scopedId)
  }

  return 'anonymous'
}

function scopedStorageKey(baseKey: string) {
  return `${baseKey}:${getCurrentUserScopeKey()}`
}

function migrateLegacyCashflowPreferences() {
  if (typeof window === 'undefined') {
    return
  }

  const scopedWindowKey = scopedStorageKey(CASHFLOW_WINDOW_STORAGE_BASE_KEY)
  const scopedSeriesKey = scopedStorageKey(CASHFLOW_SERIES_STORAGE_BASE_KEY)

  const hasScopedWindow = window.localStorage.getItem(scopedWindowKey) !== null
  const hasScopedSeries = window.localStorage.getItem(scopedSeriesKey) !== null

  if (!hasScopedWindow) {
    const legacyWindow = window.localStorage.getItem(LEGACY_CASHFLOW_WINDOW_STORAGE_KEY)
    if (legacyWindow !== null) {
      window.localStorage.setItem(scopedWindowKey, legacyWindow)
    }
  }

  if (!hasScopedSeries) {
    const legacySeries = window.localStorage.getItem(LEGACY_CASHFLOW_SERIES_STORAGE_KEY)
    if (legacySeries !== null) {
      window.localStorage.setItem(scopedSeriesKey, legacySeries)
    }
  }

  const scopedWindowNow = window.localStorage.getItem(scopedWindowKey)
  const scopedSeriesNow = window.localStorage.getItem(scopedSeriesKey)
  if (scopedWindowNow !== null || scopedSeriesNow !== null) {
    window.localStorage.removeItem(LEGACY_CASHFLOW_WINDOW_STORAGE_KEY)
    window.localStorage.removeItem(LEGACY_CASHFLOW_SERIES_STORAGE_KEY)
  }
}

const cashflowSeriesConfig: Record<
  'net' | 'inflows' | 'outflows',
  { label: string; borderColor: string; backgroundColor: string; point: keyof CashflowTrend['points'][number] }
> = {
  net: {
    label: 'Net Cashflow',
    borderColor: '#1d4ed8',
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    point: 'net',
  },
  inflows: {
    label: 'Inflows',
    borderColor: '#0f766e',
    backgroundColor: 'rgba(15, 118, 110, 0.12)',
    point: 'inflows',
  },
  outflows: {
    label: 'Outflows',
    borderColor: '#b45309',
    backgroundColor: 'rgba(180, 83, 9, 0.12)',
    point: 'outflows',
  },
}

function formatDateInput(value: Date) {
  return value.toISOString().slice(0, 10)
}

function setTodayRange() {
  const today = new Date()
  const iso = formatDateInput(today)
  fromDate.value = iso
  toDate.value = iso
  selectedPreset.value = 'Today'
}

function setThisWeekRange() {
  const today = new Date()
  const day = today.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setDate(today.getDate() + diffToMonday)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  fromDate.value = formatDateInput(monday)
  toDate.value = formatDateInput(sunday)
  selectedPreset.value = 'This Week'
}

function setThisMonthRange() {
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), 1)
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  fromDate.value = formatDateInput(start)
  toDate.value = formatDateInput(end)
  selectedPreset.value = 'This Month'
}

function clearRange() {
  fromDate.value = ''
  toDate.value = ''
  selectedPreset.value = 'All Dates'
}

function onManualDateChange() {
  selectedPreset.value = 'Custom'
}

function selectedPeriod() {
  return {
    from: fromDate.value || undefined,
    to: toDate.value || undefined,
  }
}

async function download(fn: () => Promise<void>) {
  loading.value = true
  try {
    await fn()
  } finally {
    loading.value = false
  }
}

function formatMoney(value: number | string) {
  const numericValue = Number(value)
  if (Number.isNaN(numericValue)) {
    return String(value)
  }

  return numericValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function asChartBars(entries: Array<{ label: string; value: number }>) {
  const max = Math.max(...entries.map((entry) => entry.value), 0)
  return entries.map((entry) => ({
    ...entry,
    widthPercent: max > 0 ? Math.max(6, (entry.value / max) * 100) : 0,
  }))
}

const liquidityBars = computed(() => {
  const funds = Number(fundingSummary.value?.total_funds_available || 0)
  const collectibles = Number(fundingSummary.value?.overall_collectibles || 0)
  const payables = Number(fundingSummary.value?.total_payables || 0)
  return asChartBars([
    { label: 'Funds Available', value: funds },
    { label: 'Overall Collectibles', value: collectibles },
    { label: 'Total Payables', value: payables },
  ])
})

const agingExposureBars = computed(() => {
  const sums = {
    current: 0,
    '1-30': 0,
    '31-60': 0,
    '61+': 0,
  }

  for (const row of agingRows.value) {
    const bucket = row.aging_bucket as 'current' | '1-30' | '31-60' | '61+'
    if (bucket in sums) {
      sums[bucket] += Number(row.balance || 0)
    }
  }

  return asChartBars([
    { label: 'Current', value: sums.current },
    { label: '1–30 Days', value: sums['1-30'] },
    { label: '31–60 Days', value: sums['31-60'] },
    { label: '61+ Days', value: sums['61+'] },
  ])
})

const fundingSourceBars = computed(() => {
  const activeAccounts = fundingAccounts.value.filter((account) => account.status === 'active')
  return asChartBars(
    activeAccounts.map((account) => ({
      label: account.name,
      value: Number(account.currentBalance || 0),
    })),
  )
})

const cashFlowBars = computed(() => {
  const inflowTypes = ['capital_in', 'collection_in', 'adjustment_in']
  let inflows = 0
  let outflows = 0

  for (const entry of fundingTransactions.value) {
    const amount = Number(entry.amount || 0)
    if (inflowTypes.includes(entry.transactionType)) {
      inflows += amount
    } else {
      outflows += amount
    }
  }

  return asChartBars([
    { label: 'Recent Inflows', value: inflows },
    { label: 'Recent Outflows', value: outflows },
  ])
})

const cashflowTrendSummary = computed(() => {
  const points = cashflowTrend.value?.points || []
  const config = cashflowSeriesConfig[selectedCashflowSeries.value]
  if (!points.length) {
    return { minValue: 0, maxValue: 0, firstDate: '', lastDate: '' }
  }

  const values = points.map((point) => Number(point[config.point] || 0))
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const firstPoint = points[0]
  const lastPoint = points[points.length - 1]

  return {
    minValue,
    maxValue,
    firstDate: firstPoint ? firstPoint.date : '',
    lastDate: lastPoint ? lastPoint.date : '',
  }
})

const cashflowTrendWindowLabel = computed(() => `${selectedCashflowWindowDays.value}-Day`)

async function loadCashflowTrend(days: 7 | 30 | 60) {
  const trendResult = await FundingService.cashflowTrend(days)
  cashflowTrend.value = trendResult
  await nextTick()
  renderCashflowTrendChart()
}

function persistCashflowPreferences() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(scopedStorageKey(CASHFLOW_WINDOW_STORAGE_BASE_KEY), String(selectedCashflowWindowDays.value))
  window.localStorage.setItem(scopedStorageKey(CASHFLOW_SERIES_STORAGE_BASE_KEY), selectedCashflowSeries.value)
}

function restoreCashflowPreferences() {
  if (typeof window === 'undefined') {
    return
  }

  migrateLegacyCashflowPreferences()

  const storedWindow = Number(window.localStorage.getItem(scopedStorageKey(CASHFLOW_WINDOW_STORAGE_BASE_KEY)))
  if (storedWindow === 7 || storedWindow === 30 || storedWindow === 60) {
    selectedCashflowWindowDays.value = storedWindow
  }

  const storedSeries = window.localStorage.getItem(scopedStorageKey(CASHFLOW_SERIES_STORAGE_BASE_KEY))
  if (storedSeries === 'net' || storedSeries === 'inflows' || storedSeries === 'outflows') {
    selectedCashflowSeries.value = storedSeries
  }
}

function renderCashflowTrendChart() {
  const canvas = cashflowTrendCanvas.value
  const points = cashflowTrend.value?.points || []
  const config = cashflowSeriesConfig[selectedCashflowSeries.value]
  const labels = points.map((point) => point.date)
  const values = points.map((point) => Number(point[config.point] || 0))

  if (!canvas || !points.length) {
    if (cashflowTrendChart) {
      cashflowTrendChart.destroy()
      cashflowTrendChart = null
    }
    return
  }

  if (cashflowTrendChart) {
    cashflowTrendChart.data.labels = labels
    const dataset = cashflowTrendChart.data.datasets[0]
    if (dataset) {
      dataset.label = config.label
      dataset.data = values
      dataset.borderColor = config.borderColor
      dataset.backgroundColor = config.backgroundColor
    }
    cashflowTrendChart.update('none')
    return
  }

  cashflowTrendChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: config.label,
          data: values,
          borderColor: config.borderColor,
          backgroundColor: config.backgroundColor,
          fill: true,
          tension: 0.35,
          pointRadius: 2,
          pointHoverRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          ticks: {
            maxTicksLimit: 6,
          },
          grid: {
            display: false,
          },
        },
        y: {
          ticks: {
            callback(value) {
              return Number(value).toLocaleString()
            },
          },
        },
      },
    },
  })
}

watch(selectedCashflowSeries, () => {
  persistCashflowPreferences()
  renderCashflowTrendChart()
})

watch(selectedCashflowWindowDays, async (days) => {
  persistCashflowPreferences()
  try {
    await loadCashflowTrend(days)
  } catch (e: unknown) {
    analyticsError.value = e instanceof Error ? e.message : 'Failed to load trend data.'
    cashflowTrend.value = null
    if (cashflowTrendChart) {
      cashflowTrendChart.destroy()
      cashflowTrendChart = null
    }
  }
})

async function loadAnalytics() {
  analyticsLoading.value = true
  analyticsError.value = ''
  try {
    const [dashboardResult, fundingSummaryResult, fundingAccountsResult, fundingTransactionsResult, agingResult] = await Promise.all([
      DashboardService.summary(),
      FundingService.summary(),
      FundingService.accounts(),
      FundingService.transactions(),
      AgingService.list(),
    ])

    dashboard.value = dashboardResult
    fundingSummary.value = fundingSummaryResult
    fundingAccounts.value = fundingAccountsResult
    fundingTransactions.value = fundingTransactionsResult
    agingRows.value = agingResult.map((item) => ({ aging_bucket: item.aging_bucket, balance: Number(item.balance || 0) }))
    await loadCashflowTrend(selectedCashflowWindowDays.value)
  } catch (e: unknown) {
    analyticsError.value = e instanceof Error ? e.message : 'Failed to load analytics graphs.'
    if (cashflowTrendChart) {
      cashflowTrendChart.destroy()
      cashflowTrendChart = null
    }
  } finally {
    analyticsLoading.value = false
  }
}

onMounted(async () => {
  restoreCashflowPreferences()
  await loadAnalytics()
})

onUnmounted(() => {
  if (cashflowTrendChart) {
    cashflowTrendChart.destroy()
    cashflowTrendChart = null
  }
})
</script>

<template>
  <AppShell>
    <section class="page-card">
      <div class="page-header">
        <h1>Reports</h1>
        <p class="page-subtitle">Download CSV reports for reconciliation, analysis, and audit support.</p>
      </div>

      <div class="form-section">
        <h3 class="form-title">Visual Insights</h3>
        <p class="form-help">Graph view of key finance and risk indicators to support faster decisions.</p>
        <p v-if="analyticsError" class="error">{{ analyticsError }}</p>
        <LoadingSkeleton v-if="analyticsLoading" :rows="5" />

        <div v-if="!analyticsLoading" class="reports-charts-grid">
          <article class="chart-card chart-card-wide">
            <h4 class="chart-title">{{ cashflowTrendWindowLabel }} Cashflow Trend</h4>
            <p class="form-help">Daily movement by selected series and window. Positive net trend means stronger liquidity.</p>
            <div class="form-actions trend-window-actions">
              <button
                class="btn-secondary"
                :class="{ 'is-active': selectedCashflowWindowDays === 7 }"
                @click="selectedCashflowWindowDays = 7"
              >
                7 Days
              </button>
              <button
                class="btn-secondary"
                :class="{ 'is-active': selectedCashflowWindowDays === 30 }"
                @click="selectedCashflowWindowDays = 30"
              >
                30 Days
              </button>
              <button
                class="btn-secondary"
                :class="{ 'is-active': selectedCashflowWindowDays === 60 }"
                @click="selectedCashflowWindowDays = 60"
              >
                60 Days
              </button>
            </div>
            <div class="form-actions trend-series-actions">
              <button class="btn-secondary" :class="{ 'is-active': selectedCashflowSeries === 'net' }" @click="selectedCashflowSeries = 'net'">
                Net
              </button>
              <button
                class="btn-secondary"
                :class="{ 'is-active': selectedCashflowSeries === 'inflows' }"
                @click="selectedCashflowSeries = 'inflows'"
              >
                Inflows
              </button>
              <button
                class="btn-secondary"
                :class="{ 'is-active': selectedCashflowSeries === 'outflows' }"
                @click="selectedCashflowSeries = 'outflows'"
              >
                Outflows
              </button>
            </div>
            <div v-if="cashflowTrend && cashflowTrend.points.length" class="trend-chart-wrap">
              <div class="trend-canvas-wrap">
                <canvas ref="cashflowTrendCanvas" class="trend-canvas"></canvas>
              </div>
              <div class="trend-meta-row">
                <span>{{ cashflowTrendSummary.firstDate }}</span>
                <span>{{ cashflowTrendSummary.lastDate }}</span>
              </div>
              <div class="trend-meta-row">
                <span>Min: {{ formatMoney(cashflowTrendSummary.minValue) }}</span>
                <span>Max: {{ formatMoney(cashflowTrendSummary.maxValue) }}</span>
              </div>
            </div>
            <p v-else class="form-help">No trend data available for this period.</p>
          </article>

          <article class="chart-card">
            <h4 class="chart-title">Liquidity Mix</h4>
            <p class="form-help">Compares available funds against collectibles and payables.</p>
            <div v-for="item in liquidityBars" :key="item.label" class="chart-row">
              <span class="chart-label">{{ item.label }}</span>
              <div class="chart-track"><div class="chart-fill" :style="{ width: `${item.widthPercent}%` }" /></div>
              <span class="chart-value">{{ formatMoney(item.value) }}</span>
            </div>
          </article>

          <article class="chart-card">
            <h4 class="chart-title">Aging Exposure</h4>
            <p class="form-help">Receivable concentration by delinquency bucket.</p>
            <div v-for="item in agingExposureBars" :key="item.label" class="chart-row">
              <span class="chart-label">{{ item.label }}</span>
              <div class="chart-track"><div class="chart-fill chart-fill-risk" :style="{ width: `${item.widthPercent}%` }" /></div>
              <span class="chart-value">{{ formatMoney(item.value) }}</span>
            </div>
          </article>

          <article class="chart-card">
            <h4 class="chart-title">Funding Sources</h4>
            <p class="form-help">Current balances by bank account and cash on hand.</p>
            <div v-for="item in fundingSourceBars" :key="item.label" class="chart-row">
              <span class="chart-label">{{ item.label }}</span>
              <div class="chart-track"><div class="chart-fill chart-fill-funding" :style="{ width: `${item.widthPercent}%` }" /></div>
              <span class="chart-value">{{ formatMoney(item.value) }}</span>
            </div>
          </article>

          <article class="chart-card">
            <h4 class="chart-title">Recent Cashflow</h4>
            <p class="form-help">Inflow vs outflow totals from recent funding ledger entries.</p>
            <div v-for="item in cashFlowBars" :key="item.label" class="chart-row">
              <span class="chart-label">{{ item.label }}</span>
              <div class="chart-track"><div class="chart-fill chart-fill-cashflow" :style="{ width: `${item.widthPercent}%` }" /></div>
              <span class="chart-value">{{ formatMoney(item.value) }}</span>
            </div>
          </article>
        </div>

        <div v-if="!analyticsLoading && dashboard" class="kpi-strip">
          <article class="kpi-item">
            <p class="kpi-label">High Priority Cases</p>
            <p class="kpi-value">{{ dashboard.high_priority_cases }}</p>
          </article>
          <article class="kpi-item">
            <p class="kpi-label">Follow-ups Due Today</p>
            <p class="kpi-value">{{ dashboard.follow_ups_due_today }}</p>
          </article>
          <article class="kpi-item">
            <p class="kpi-label">Promises Due Today</p>
            <p class="kpi-value">{{ dashboard.promises_due_today }}</p>
          </article>
        </div>
      </div>

      <div class="form-section">
        <h3 class="form-title">Export Center</h3>
        <p class="form-help">Choose a report below. Files are downloaded immediately in CSV format.</p>
        <div class="form-grid">
          <div class="field">
            <label class="field-label">From Date (optional)</label>
            <input v-model="fromDate" type="date" @input="onManualDateChange" />
          </div>
          <div class="field">
            <label class="field-label">To Date (optional)</label>
            <input v-model="toDate" type="date" @input="onManualDateChange" />
          </div>
        </div>
        <p class="form-help">
          Active preset:
          <span class="preset-chip">{{ selectedPreset }}</span>
        </p>
        <div class="form-actions">
          <button class="btn-secondary" :disabled="loading" @click="setTodayRange">Today</button>
          <button class="btn-secondary" :disabled="loading" @click="setThisWeekRange">This Week</button>
          <button class="btn-secondary" :disabled="loading" @click="setThisMonthRange">This Month</button>
          <button class="btn-secondary" :disabled="loading" @click="clearRange">Clear</button>
        </div>
        <p class="form-help">Leave blank to export all dates. Date filtering is applied where report data includes dates.</p>
        <div class="form-actions">
          <button class="btn-secondary" :disabled="loading" @click="download(() => ReportService.downloadReceivablesCsv(selectedPeriod()))">Download Receivables</button>
          <button class="btn-secondary" :disabled="loading" @click="download(() => ReportService.downloadPayablesCsv(selectedPeriod()))">Download Payables</button>
          <button class="btn-secondary" :disabled="loading" @click="download(() => ReportService.downloadInterestIncomeCsv(selectedPeriod()))">Download Interest Income</button>
        </div>
      </div>

      <div class="form-section">
        <h3 class="form-title">Funding Reports</h3>
        <p class="form-help">Use these exports for cash management, reconciliation, and audit trail review.</p>
        <div class="form-actions">
          <button class="btn-secondary" :disabled="loading" @click="download(() => ReportService.downloadFundingLedgerCsv(selectedPeriod()))">Download Funding Ledger</button>
          <button class="btn-secondary" :disabled="loading" @click="download(() => ReportService.downloadDailyCashPositionCsv(selectedPeriod()))">Download Daily Cash Position</button>
        </div>
      </div>
    </section>
  </AppShell>
</template>
