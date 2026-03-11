<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppShell from '@/components/AppShell.vue'
import KpiStrip from '@/components/KpiStrip.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import {
  DashboardService,
  type DashboardInsightThresholds,
  type DashboardSetupGuide,
  type DashboardSummary,
} from '@/apis/services/dashboard'
import { useAuthStore } from '@/store/auth'

const summary = ref<DashboardSummary | null>(null)
const error = ref('')
const loading = ref(false)
const thresholdSaving = ref(false)
const thresholdMessage = ref('')
const authStore = useAuthStore()
const setupSaving = ref(false)
const setupMessage = ref('')

const defaultThresholds: DashboardInsightThresholds = {
  avg_loans_per_customer_good: 1.4,
  avg_loans_per_customer_watch: 1.0,
  avg_receivable_per_loan_good: 1200,
  avg_receivable_per_loan_watch: 700,
  avg_payable_per_vendor_good: 2000,
  avg_payable_per_vendor_watch: 4000,
  collections_coverage_good: 0.7,
  collections_coverage_watch: 0.45,
  due_today_workload_good: 6,
  due_today_workload_watch: 14,
  high_priority_loan_rate_good: 0.07,
  high_priority_loan_rate_watch: 0.15,
}

const thresholds = ref<DashboardInsightThresholds>({ ...defaultThresholds })
const canEditThresholds = computed(() => authStore.user?.role === 'owner' || authStore.user?.role === 'manager')
const setupGuide = ref<DashboardSetupGuide>({
  first_login: true,
  dismissed: false,
  checklist: {
    customers: false,
    vendors: false,
    funding: false,
    loans: false,
    collections: false,
  },
})
const showSetupGuide = computed(() => !setupGuide.value.dismissed && setupGuide.value.first_login)

function safeDivide(numerator: number, denominator: number) {
  if (!denominator) {
    return 0
  }
  return numerator / denominator
}

function formatMoney(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

const portfolioInsights = computed(() => {
  if (!summary.value) {
    return []
  }

  const avgLoansPerCustomer = safeDivide(summary.value.loan_count, summary.value.customer_count)
  const avgReceivablePerLoan = safeDivide(summary.value.total_receivable, summary.value.loan_count)
  const avgPayablePerVendor = safeDivide(summary.value.total_payable_balance, summary.value.vendor_count)
  const collectionCoverage = safeDivide(summary.value.total_collections, summary.value.total_receivable)
  const dueTodayLoad = summary.value.follow_ups_due_today + summary.value.promises_due_today
  const highPriorityRate = safeDivide(summary.value.high_priority_cases, summary.value.loan_count)
  const config = thresholds.value

  return [
    {
      label: 'Avg Loans / Customer',
      value: avgLoansPerCustomer.toFixed(2),
      help: 'Customer portfolio depth.',
      statusLabel:
        avgLoansPerCustomer >= config.avg_loans_per_customer_good
          ? 'Healthy'
          : avgLoansPerCustomer >= config.avg_loans_per_customer_watch
            ? 'Watch'
            : 'Risk',
      statusTone:
        avgLoansPerCustomer >= config.avg_loans_per_customer_good
          ? 'good'
          : avgLoansPerCustomer >= config.avg_loans_per_customer_watch
            ? 'watch'
            : 'risk',
    },
    {
      label: 'Avg Receivable / Loan',
      value: formatMoney(avgReceivablePerLoan),
      help: 'Outstanding balance per active loan.',
      statusLabel:
        avgReceivablePerLoan >= config.avg_receivable_per_loan_good
          ? 'Healthy'
          : avgReceivablePerLoan >= config.avg_receivable_per_loan_watch
            ? 'Watch'
            : 'Risk',
      statusTone:
        avgReceivablePerLoan >= config.avg_receivable_per_loan_good
          ? 'good'
          : avgReceivablePerLoan >= config.avg_receivable_per_loan_watch
            ? 'watch'
            : 'risk',
    },
    {
      label: 'Avg Payable / Vendor',
      value: formatMoney(avgPayablePerVendor),
      help: 'Average vendor exposure.',
      statusLabel:
        avgPayablePerVendor <= config.avg_payable_per_vendor_good
          ? 'Healthy'
          : avgPayablePerVendor <= config.avg_payable_per_vendor_watch
            ? 'Watch'
            : 'Risk',
      statusTone:
        avgPayablePerVendor <= config.avg_payable_per_vendor_good
          ? 'good'
          : avgPayablePerVendor <= config.avg_payable_per_vendor_watch
            ? 'watch'
            : 'risk',
    },
    {
      label: 'Collections Coverage',
      value: formatPercent(collectionCoverage),
      help: 'Collections against total receivables.',
      statusLabel:
        collectionCoverage >= config.collections_coverage_good
          ? 'Healthy'
          : collectionCoverage >= config.collections_coverage_watch
            ? 'Watch'
            : 'Risk',
      statusTone:
        collectionCoverage >= config.collections_coverage_good
          ? 'good'
          : collectionCoverage >= config.collections_coverage_watch
            ? 'watch'
            : 'risk',
    },
    {
      label: 'Due-Today Workload',
      value: dueTodayLoad.toString(),
      help: 'Follow-ups + promises due today.',
      statusLabel:
        dueTodayLoad <= config.due_today_workload_good
          ? 'Healthy'
          : dueTodayLoad <= config.due_today_workload_watch
            ? 'Watch'
            : 'Risk',
      statusTone:
        dueTodayLoad <= config.due_today_workload_good
          ? 'good'
          : dueTodayLoad <= config.due_today_workload_watch
            ? 'watch'
            : 'risk',
    },
    {
      label: 'High-Priority Loan Rate',
      value: formatPercent(highPriorityRate),
      help: 'High-priority cases as share of loans.',
      statusLabel:
        highPriorityRate <= config.high_priority_loan_rate_good
          ? 'Healthy'
          : highPriorityRate <= config.high_priority_loan_rate_watch
            ? 'Watch'
            : 'Risk',
      statusTone:
        highPriorityRate <= config.high_priority_loan_rate_good
          ? 'good'
          : highPriorityRate <= config.high_priority_loan_rate_watch
            ? 'watch'
            : 'risk',
    },
  ]
})

async function saveThresholds() {
  thresholdSaving.value = true
  thresholdMessage.value = ''
  try {
    thresholds.value = await DashboardService.saveInsightThresholds(thresholds.value)
    thresholdMessage.value = 'Threshold settings saved.'
  } catch (e: unknown) {
    thresholdMessage.value = e instanceof Error ? e.message : 'Failed to save threshold settings.'
  } finally {
    thresholdSaving.value = false
  }
}

async function saveSetupGuide() {
  setupSaving.value = true
  setupMessage.value = ''
  try {
    setupGuide.value = await DashboardService.saveSetupGuide(setupGuide.value)
    setupMessage.value = 'Setup checklist updated.'
  } catch (e: unknown) {
    setupMessage.value = e instanceof Error ? e.message : 'Failed to save setup checklist.'
  } finally {
    setupSaving.value = false
  }
}

async function markSetupDone() {
  setupGuide.value = {
    ...setupGuide.value,
    first_login: false,
    dismissed: true,
  }
  await saveSetupGuide()
}

onMounted(async () => {
  loading.value = true
  thresholdMessage.value = ''
  setupMessage.value = ''
  try {
    const [summaryResult, thresholdsResult, setupGuideResult] = await Promise.all([
      DashboardService.summary(),
      DashboardService.insightThresholds(),
      DashboardService.setupGuide(),
    ])
    summary.value = summaryResult
    thresholds.value = thresholdsResult
    setupGuide.value = setupGuideResult
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load dashboard'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <AppShell>
    <section class="page-card">
      <div class="page-header">
        <h1>Dashboard</h1>
        <p class="page-subtitle">Snapshot of lending performance across your workspace.</p>
      </div>
      <KpiStrip
        v-if="summary"
        :items="[
          { label: 'Customers', value: summary.customer_count },
          { label: 'Loans', value: summary.loan_count },
          { label: 'Collections', value: summary.total_collections },
          { label: 'Receivables', value: summary.total_receivable },
          { label: 'High Priority Cases', value: summary.high_priority_cases },
          { label: 'Follow-ups Due Today', value: summary.follow_ups_due_today },
          { label: 'Promises Due Today', value: summary.promises_due_today },
        ]"
      />
      <LoadingSkeleton v-if="loading" :rows="4" />
      <p v-if="error" class="error">{{ error }}</p>
      <div v-if="summary && !loading && showSetupGuide" class="form-section">
        <h3 class="form-title">First-Time Setup Guide</h3>
        <p class="form-help">Complete these steps first so your workspace works correctly from day one.</p>
        <div class="form-grid">
          <label class="field">
            <span class="field-label">1) Add Customers</span>
            <span class="field-help">Create borrower profiles in Customers.</span>
            <input v-model="setupGuide.checklist.customers" type="checkbox" />
          </label>
          <label class="field">
            <span class="field-label">2) Add Vendors</span>
            <span class="field-help">Set supplier records for payable workflows.</span>
            <input v-model="setupGuide.checklist.vendors" type="checkbox" />
          </label>
          <label class="field">
            <span class="field-label">3) Add Funding Accounts</span>
            <span class="field-help">Configure bank/cash accounts before loan disbursement.</span>
            <input v-model="setupGuide.checklist.funding" type="checkbox" />
          </label>
          <label class="field">
            <span class="field-label">4) Create First Loan</span>
            <span class="field-help">Issue a loan to start receivables tracking.</span>
            <input v-model="setupGuide.checklist.loans" type="checkbox" />
          </label>
          <label class="field">
            <span class="field-label">5) Record Collection Activity</span>
            <span class="field-help">Use Collections/Workflow to monitor follow-ups and payments.</span>
            <input v-model="setupGuide.checklist.collections" type="checkbox" />
          </label>
        </div>
        <div class="form-actions">
          <RouterLink class="btn-secondary" to="/customers">Go to Customers</RouterLink>
          <RouterLink class="btn-secondary" to="/vendors">Go to Vendors</RouterLink>
          <RouterLink class="btn-secondary" to="/funding">Go to Funding</RouterLink>
          <RouterLink class="btn-secondary" to="/loans">Go to Loans</RouterLink>
          <RouterLink class="btn-secondary" to="/collections-workflow">Go to Workflow</RouterLink>
        </div>
        <div class="form-actions">
          <button class="btn-secondary" :disabled="setupSaving" @click="saveSetupGuide">Save Progress</button>
          <button class="btn-secondary" :disabled="setupSaving" @click="markSetupDone">Finish Setup</button>
          <span v-if="setupMessage" class="field-help">{{ setupMessage }}</span>
        </div>
      </div>

      <div v-if="summary && !loading" class="stats-grid">
        <article class="stat-card"><h3>Customers</h3><p>{{ summary.customer_count }}</p></article>
        <article class="stat-card"><h3>Vendors</h3><p>{{ summary.vendor_count }}</p></article>
        <article class="stat-card"><h3>Loans</h3><p>{{ summary.loan_count }}</p></article>
        <article class="stat-card"><h3>Payables</h3><p>{{ summary.payable_count }}</p></article>
        <article class="stat-card"><h3>Total Collections</h3><p>{{ summary.total_collections }}</p></article>
        <article class="stat-card"><h3>Receivables</h3><p>{{ summary.total_receivable }}</p></article>
        <article class="stat-card"><h3>High Priority Cases</h3><p>{{ summary.high_priority_cases }}</p></article>
        <article class="stat-card"><h3>Follow-ups Due Today</h3><p>{{ summary.follow_ups_due_today }}</p></article>
        <article class="stat-card"><h3>Promises Due Today</h3><p>{{ summary.promises_due_today }}</p></article>
      </div>

      <div v-if="summary && !loading" class="form-section">
        <h3 class="form-title">Portfolio Insights</h3>
        <p class="form-help">Derived indicators to help prioritize lending, collection, and payable decisions.</p>
        <div class="stats-grid">
          <article v-for="item in portfolioInsights" :key="item.label" class="stat-card">
            <h3>{{ item.label }}</h3>
            <span class="insight-badge" :class="`insight-badge-${item.statusTone}`">{{ item.statusLabel }}</span>
            <p>{{ item.value }}</p>
            <span class="field-help">{{ item.help }}</span>
          </article>
        </div>
      </div>

      <div v-if="summary && !loading && canEditThresholds" class="form-section">
        <h3 class="form-title">Insight Threshold Settings</h3>
        <p class="form-help">Configure the Healthy/Watch/Risk badge cutoffs used by Portfolio Insights.</p>
        <div class="form-grid">
          <div class="field">
            <label class="field-label">Avg Loans/Customer Good (>=)</label>
            <input v-model.number="thresholds.avg_loans_per_customer_good" type="number" min="0" step="0.01" />
          </div>
          <div class="field">
            <label class="field-label">Avg Loans/Customer Watch (>=)</label>
            <input v-model.number="thresholds.avg_loans_per_customer_watch" type="number" min="0" step="0.01" />
          </div>
          <div class="field">
            <label class="field-label">Avg Receivable/Loan Good (>=)</label>
            <input v-model.number="thresholds.avg_receivable_per_loan_good" type="number" min="0" step="0.01" />
          </div>
          <div class="field">
            <label class="field-label">Avg Receivable/Loan Watch (>=)</label>
            <input v-model.number="thresholds.avg_receivable_per_loan_watch" type="number" min="0" step="0.01" />
          </div>
          <div class="field">
            <label class="field-label">Avg Payable/Vendor Good (<=)</label>
            <input v-model.number="thresholds.avg_payable_per_vendor_good" type="number" min="0" step="0.01" />
          </div>
          <div class="field">
            <label class="field-label">Avg Payable/Vendor Watch (<=)</label>
            <input v-model.number="thresholds.avg_payable_per_vendor_watch" type="number" min="0" step="0.01" />
          </div>
          <div class="field">
            <label class="field-label">Collections Coverage Good (>=)</label>
            <input v-model.number="thresholds.collections_coverage_good" type="number" min="0" step="0.01" />
          </div>
          <div class="field">
            <label class="field-label">Collections Coverage Watch (>=)</label>
            <input v-model.number="thresholds.collections_coverage_watch" type="number" min="0" step="0.01" />
          </div>
          <div class="field">
            <label class="field-label">Due-Today Workload Good (<=)</label>
            <input v-model.number="thresholds.due_today_workload_good" type="number" min="0" step="1" />
          </div>
          <div class="field">
            <label class="field-label">Due-Today Workload Watch (<=)</label>
            <input v-model.number="thresholds.due_today_workload_watch" type="number" min="0" step="1" />
          </div>
          <div class="field">
            <label class="field-label">High-Priority Loan Rate Good (<=)</label>
            <input v-model.number="thresholds.high_priority_loan_rate_good" type="number" min="0" step="0.01" />
          </div>
          <div class="field">
            <label class="field-label">High-Priority Loan Rate Watch (<=)</label>
            <input v-model.number="thresholds.high_priority_loan_rate_watch" type="number" min="0" step="0.01" />
          </div>
        </div>
        <div class="form-actions">
          <button class="btn-secondary" :disabled="thresholdSaving" @click="saveThresholds">Save Thresholds</button>
          <span v-if="thresholdMessage" class="field-help">{{ thresholdMessage }}</span>
        </div>
      </div>

      <div v-else-if="summary && !loading" class="form-section">
        <h3 class="form-title">Insight Threshold Settings</h3>
        <p class="form-help">Threshold updates are limited to owner/manager roles.</p>
      </div>
    </section>
  </AppShell>
</template>
