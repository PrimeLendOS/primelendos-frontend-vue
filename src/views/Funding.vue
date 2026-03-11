<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppShell from '@/components/AppShell.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import { FundingService, type FundingAccount, type FundingSummary, type FundingTransaction } from '@/apis/services/funding'

const summary = ref<FundingSummary | null>(null)
const accounts = ref<FundingAccount[]>([])
const transactions = ref<FundingTransaction[]>([])
const loading = ref(false)
const error = ref('')
const success = ref('')

const accountName = ref('')
const locationType = ref<'bank_account' | 'cash_on_hand'>('bank_account')
const bankName = ref('')
const accountHolderName = ref('')
const accountNumber = ref('')
const openingBalance = ref(0)

const transactionAccountId = ref('')
const transactionType = ref<
  'capital_in' | 'collection_in' | 'adjustment_in' | 'loan_disbursement' | 'expense_out' | 'adjustment_out'
>('capital_in')
const transactionAmount = ref(0)
const transactionRemarks = ref('')

const showCreateAccountModal = ref(false)
const showTransactionModal = ref(false)

const liquidCoveragePercent = computed(() => {
  if (!summary.value) {
    return 0
  }

  return summary.value.liquidity_coverage_ratio * 100
})

function formatMoney(value: number | string) {
  const numericValue = Number(value)
  if (Number.isNaN(numericValue)) {
    return String(value)
  }

  return numericValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatLocationType(value: FundingAccount['locationType']) {
  return value === 'cash_on_hand' ? 'Cash on Hand' : 'Bank Account'
}

function formatTransactionType(value: FundingTransaction['transactionType']) {
  if (value === 'capital_in') return 'Capital In'
  if (value === 'collection_in') return 'Collection In'
  if (value === 'adjustment_in') return 'Adjustment In'
  if (value === 'loan_disbursement') return 'Loan Disbursement'
  if (value === 'expense_out') return 'Expense Out'
  return 'Adjustment Out'
}

async function load() {
  loading.value = true
  try {
    const [summaryResult, accountsResult, transactionsResult] = await Promise.all([
      FundingService.summary(),
      FundingService.accounts(),
      FundingService.transactions(),
    ])

    summary.value = summaryResult
    accounts.value = accountsResult
    transactions.value = transactionsResult

    if (!transactionAccountId.value && accountsResult[0]?.id) {
      transactionAccountId.value = accountsResult[0].id
    }
  } finally {
    loading.value = false
  }
}

function openCreateAccountModal() {
  error.value = ''
  success.value = ''
  showCreateAccountModal.value = true
}

function closeCreateAccountModal() {
  showCreateAccountModal.value = false
}

function openTransactionModal() {
  error.value = ''
  success.value = ''
  showTransactionModal.value = true
}

function closeTransactionModal() {
  showTransactionModal.value = false
}

async function createAccount() {
  error.value = ''
  success.value = ''

  if (!accountName.value.trim()) {
    error.value = 'Funding account name is required.'
    return
  }

  try {
    await FundingService.createAccount({
      name: accountName.value.trim(),
      location_type: locationType.value,
      bank_name: bankName.value.trim() || undefined,
      account_name: accountHolderName.value.trim() || undefined,
      account_number: accountNumber.value.trim() || undefined,
      opening_balance: Number(openingBalance.value || 0),
      status: 'active',
    })

    accountName.value = ''
    locationType.value = 'bank_account'
    bankName.value = ''
    accountHolderName.value = ''
    accountNumber.value = ''
    openingBalance.value = 0
    showCreateAccountModal.value = false
    success.value = 'Funding account added successfully.'
    await load()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to create funding account'
  }
}

async function createTransaction() {
  error.value = ''
  success.value = ''

  if (!transactionAccountId.value) {
    error.value = 'Please select a funding account.'
    return
  }

  if (transactionAmount.value <= 0) {
    error.value = 'Transaction amount must be greater than zero.'
    return
  }

  try {
    await FundingService.createTransaction({
      funding_account_id: transactionAccountId.value,
      transaction_type: transactionType.value,
      amount: Number(transactionAmount.value),
      remarks: transactionRemarks.value.trim() || undefined,
      transaction_date: new Date().toISOString().slice(0, 10),
    })

    transactionAmount.value = 0
    transactionRemarks.value = ''
    showTransactionModal.value = false
    success.value = 'Funding transaction recorded successfully.'
    await load()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to record funding transaction'
  }
}

onMounted(load)
</script>

<template>
  <AppShell>
    <section class="page-card">
      <div class="page-header">
        <h1>Funding</h1>
        <p class="page-subtitle">
          Manage available capital by source (bank account or cash on hand) and monitor funding health.
        </p>
      </div>

      <div class="form-actions">
        <button @click="openCreateAccountModal">Add Funding Source</button>
        <button class="btn-secondary" @click="openTransactionModal">Record Funding Movement</button>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="success" class="success">{{ success }}</p>

      <LoadingSkeleton v-if="loading" :rows="6" />

      <template v-if="!loading && summary">
        <div class="kpi-strip">
          <article class="kpi-item">
            <p class="kpi-label">Total Funds Available</p>
            <p class="kpi-value">{{ formatMoney(summary.total_funds_available) }}</p>
          </article>
          <article class="kpi-item">
            <p class="kpi-label">Overall Collectibles</p>
            <p class="kpi-value">{{ formatMoney(summary.overall_collectibles) }}</p>
          </article>
          <article class="kpi-item">
            <p class="kpi-label">Total Payables</p>
            <p class="kpi-value">{{ formatMoney(summary.total_payables) }}</p>
          </article>
          <article class="kpi-item">
            <p class="kpi-label">Net Position</p>
            <p class="kpi-value">{{ formatMoney(summary.net_position) }}</p>
          </article>
          <article class="kpi-item">
            <p class="kpi-label">High-Risk Exposure</p>
            <p class="kpi-value">{{ formatMoney(summary.high_risk_exposure) }}</p>
          </article>
          <article class="kpi-item">
            <p class="kpi-label">Liquidity Coverage</p>
            <p class="kpi-value">{{ liquidCoveragePercent.toFixed(1) }}%</p>
          </article>
        </div>

        <div class="form-section">
          <h3 class="form-title">Funding Sources</h3>
          <p class="form-help">Loan disbursement uses these sources. Keep balances accurate for reliable operations.</p>
          <ul>
            <li v-for="account in accounts" :key="account.id">
              <div>
                <strong>{{ account.name }}</strong>
                <div class="item-meta">
                  {{ formatLocationType(account.locationType) }} · {{ account.bankName || 'No bank specified' }}
                </div>
                <div class="item-meta">
                  Account: {{ account.accountName || '—' }} · Number: {{ account.accountNumberMasked || '—' }}
                </div>
              </div>
              <div class="item-actions">
                <span class="aging-badge aging-1-30">{{ account.status }}</span>
                <strong>{{ formatMoney(account.currentBalance) }}</strong>
              </div>
            </li>
          </ul>
        </div>

        <div class="form-section">
          <h3 class="form-title">Recent Funding Ledger</h3>
          <p class="form-help">Latest 20 entries across all funding sources for quick reconciliation.</p>
          <ul>
            <li v-for="entry in transactions" :key="entry.id">
              <div>
                <strong>{{ formatTransactionType(entry.transactionType) }}</strong>
                <div class="item-meta">
                  {{ entry.FundingAccount?.name || 'Funding account' }} · Date: {{ entry.transactionDate }}
                </div>
                <div class="item-meta">{{ entry.remarks || 'No remarks' }}</div>
              </div>
              <div class="item-actions">
                <span>{{ formatMoney(entry.amount) }}</span>
                <span class="item-meta">Bal: {{ formatMoney(entry.balanceAfter) }}</span>
              </div>
            </li>
          </ul>
        </div>
      </template>

      <div v-if="showCreateAccountModal" class="modal-overlay" @click.self="closeCreateAccountModal">
        <div class="modal-card">
          <h3 class="form-title">Add Funding Source</h3>
          <p class="form-help">Specify where funds currently reside: bank account or cash on hand.</p>
          <div class="form-grid">
            <div class="field">
              <label class="field-label">Funding Name</label>
              <input v-model="accountName" placeholder="e.g. Main Operating Fund" />
            </div>
            <div class="field">
              <label class="field-label">Location Type</label>
              <select v-model="locationType">
                <option value="bank_account">Bank Account</option>
                <option value="cash_on_hand">Cash on Hand</option>
              </select>
            </div>
            <div class="field">
              <label class="field-label">Bank Name</label>
              <input v-model="bankName" placeholder="e.g. BDO" :disabled="locationType === 'cash_on_hand'" />
            </div>
            <div class="field">
              <label class="field-label">Account Name</label>
              <input v-model="accountHolderName" placeholder="Account holder" :disabled="locationType === 'cash_on_hand'" />
            </div>
            <div class="field">
              <label class="field-label">Account Number</label>
              <input v-model="accountNumber" placeholder="e.g. 1234 5678" :disabled="locationType === 'cash_on_hand'" />
            </div>
            <div class="field">
              <label class="field-label">Opening Balance</label>
              <input v-model.number="openingBalance" type="number" min="0" step="0.01" placeholder="0.00" />
            </div>
          </div>
          <div class="form-actions">
            <button @click="createAccount">Save Funding Source</button>
            <button class="btn-secondary" @click="closeCreateAccountModal">Cancel</button>
          </div>
        </div>
      </div>

      <div v-if="showTransactionModal" class="modal-overlay" @click.self="closeTransactionModal">
        <div class="modal-card">
          <h3 class="form-title">Record Funding Movement</h3>
          <p class="form-help">Use this for adjustments, capital top-ups, and expenses.</p>
          <div class="form-grid">
            <div class="field">
              <label class="field-label">Funding Source</label>
              <select v-model="transactionAccountId">
                <option disabled value="">Select funding account</option>
                <option v-for="item in accounts" :key="item.id" :value="item.id">{{ item.name }}</option>
              </select>
            </div>
            <div class="field">
              <label class="field-label">Transaction Type</label>
              <select v-model="transactionType">
                <option value="capital_in">Capital In</option>
                <option value="collection_in">Collection In</option>
                <option value="adjustment_in">Adjustment In</option>
                <option value="expense_out">Expense Out</option>
                <option value="adjustment_out">Adjustment Out</option>
              </select>
            </div>
            <div class="field">
              <label class="field-label">Amount</label>
              <input v-model.number="transactionAmount" type="number" min="0" step="0.01" placeholder="0.00" />
            </div>
            <div class="field">
              <label class="field-label">Remarks</label>
              <input v-model="transactionRemarks" placeholder="Reason / reference" />
            </div>
          </div>
          <div class="form-actions">
            <button @click="createTransaction">Save Movement</button>
            <button class="btn-secondary" @click="closeTransactionModal">Cancel</button>
          </div>
        </div>
      </div>
    </section>
  </AppShell>
</template>
