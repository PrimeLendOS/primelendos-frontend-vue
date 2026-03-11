<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppShell from '@/components/AppShell.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import { CustomerService, type Customer } from '@/apis/services/customers'
import { FundingService, type FundingAccount } from '@/apis/services/funding'
import { LoanService, type Loan } from '@/apis/services/loans'

const customers = ref<Customer[]>([])
const fundingAccounts = ref<FundingAccount[]>([])
const loans = ref<Loan[]>([])
const customerId = ref('')
const fundingAccountId = ref('')
const type = ref<'straight_line' | 'diminishing'>('straight_line')
const principal = ref(0)
const interest = ref(0)
const numOfPayments = ref(1)
const paymentAmount = ref(0)
const paymentFundingAccountId = ref('')
const selectedLoanId = ref('')
const showCreateModal = ref(false)
const showPaymentModal = ref(false)
const error = ref('')
const success = ref('')
const loading = ref(false)

const selectedLoan = computed(() => loans.value.find((item) => item.id === selectedLoanId.value))
const totalLoanAmount = computed(() => Number(principal.value || 0) + Number(interest.value || 0))
const installmentAmount = computed(() => {
  if (numOfPayments.value <= 0) {
    return 0
  }

  const total = totalLoanAmount.value
  return total / Number(numOfPayments.value || 1)
})
const remainingAfterPayment = computed(() => {
  if (!selectedLoan.value) {
    return 0
  }

  const remaining = Number(selectedLoan.value.balance) - Number(paymentAmount.value || 0)
  return remaining > 0 ? remaining : 0
})
const customerLoanGroups = computed(() => {
  const openLoans = loans.value.filter((item) => Number(item.balance) > 0)

  return customers.value.map((customer) => ({
    customer,
    openLoans: openLoans.filter((loan) => loan.customerId === customer.id),
  }))
})
const selectedLoanCustomerName = computed(() => {
  if (!selectedLoan.value) {
    return ''
  }

  const owner = customers.value.find((item) => item.id === selectedLoan.value?.customerId)
  return owner?.name || 'Unknown customer'
})

async function load() {
  loading.value = true
  try {
    const [customerRows, loanRows, fundingRows] = await Promise.all([
      CustomerService.list(),
      LoanService.list(),
      FundingService.accounts(),
    ])
    customers.value = customerRows
    loans.value = loanRows
    fundingAccounts.value = fundingRows.filter((item) => item.status === 'active')
    if (!customerId.value && customers.value[0]?.id) {
      customerId.value = customers.value[0].id
    }
    if (!fundingAccountId.value && fundingAccounts.value[0]?.id) {
      fundingAccountId.value = fundingAccounts.value[0].id
    }
    if (!paymentFundingAccountId.value && fundingAccounts.value[0]?.id) {
      paymentFundingAccountId.value = fundingAccounts.value[0].id
    }
  } finally {
    loading.value = false
  }
}

async function create() {
  error.value = ''
  success.value = ''
  if (!customerId.value) {
    error.value = 'Please select a customer.'
    return
  }
  if (!fundingAccountId.value) {
    error.value = 'Please select a funding source.'
    return
  }
  if (interest.value < 0) {
    error.value = 'Interest cannot be negative.'
    return
  }
  if (principal.value <= 0 || numOfPayments.value <= 0 || installmentAmount.value <= 0) {
    error.value = 'Principal and number of payments must be greater than zero.'
    return
  }
  try {
    await LoanService.create({
      customer_id: customerId.value,
      funding_account_id: fundingAccountId.value,
      type: type.value,
      principal: principal.value,
      interest: interest.value,
      num_of_payments: numOfPayments.value,
      amount: Number(installmentAmount.value.toFixed(2)),
    })
    showCreateModal.value = false
    success.value = 'Loan created successfully.'
    await load()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to create loan'
  }
}

async function addPayment() {
  error.value = ''
  success.value = ''
  if (!selectedLoanId.value || paymentAmount.value <= 0) {
    error.value = 'Select a loan and enter a payment amount greater than zero.'
    return
  }
  if (selectedLoan.value && paymentAmount.value > Number(selectedLoan.value.balance)) {
    error.value = 'Payment amount cannot be greater than the current balance.'
    return
  }

  try {
    await LoanService.addPayment({
      loan_id: selectedLoanId.value,
      amount: paymentAmount.value,
      funding_account_id: paymentFundingAccountId.value || undefined,
    })
    paymentAmount.value = 0
    showPaymentModal.value = false
    success.value = 'Payment recorded successfully.'
    await load()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to add payment'
  }
}

function openCreateModal() {
  error.value = ''
  success.value = ''
  if (!customerId.value && customers.value[0]?.id) {
    customerId.value = customers.value[0].id
  }
  if (!fundingAccountId.value && fundingAccounts.value[0]?.id) {
    fundingAccountId.value = fundingAccounts.value[0].id
  }
  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
}

function openPaymentModal(loanId: string) {
  error.value = ''
  success.value = ''
  selectedLoanId.value = loanId
  paymentAmount.value = 0
  if (!paymentFundingAccountId.value && fundingAccounts.value[0]?.id) {
    paymentFundingAccountId.value = fundingAccounts.value[0].id
  }
  showPaymentModal.value = true
}

function closePaymentModal() {
  showPaymentModal.value = false
}

function setFullPaymentAmount() {
  if (!selectedLoan.value) {
    return
  }

  paymentAmount.value = Number(selectedLoan.value.balance)
}

function formatMoney(value: number | string) {
  const numericValue = Number(value)
  if (Number.isNaN(numericValue)) {
    return String(value)
  }

  return numericValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatLoanType(value: Loan['type']) {
  return value === 'straight_line' ? 'Straight Line' : 'Diminishing'
}

onMounted(load)
</script>

<template>
  <AppShell>
    <section class="page-card">
      <div class="page-header">
        <h1>Loans</h1>
        <p class="page-subtitle">Encode new loans and post collections with clear terms and running balances.</p>
      </div>

      <div class="form-actions">
        <button @click="openCreateModal">Create Loan</button>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="success" class="success">{{ success }}</p>

      <h3>Open Loans by Customer</h3>
      <p class="form-help">Customers are listed below with only their active loans (balance greater than zero).</p>
      <LoadingSkeleton v-if="loading" :rows="5" />

      <div v-show="!loading" class="customer-loan-list">
        <article v-for="group in customerLoanGroups" :key="group.customer.id" class="form-section">
          <h3 class="form-title">{{ group.customer.name }}</h3>
          <p class="form-help">
            {{ group.openLoans.length }} open {{ group.openLoans.length === 1 ? 'loan' : 'loans' }}
          </p>

          <ul v-if="group.openLoans.length">
            <li v-for="loan in group.openLoans" :key="loan.id">
              <span>
                {{ formatLoanType(loan.type) }} · Principal: {{ formatMoney(loan.principal) }} · Balance:
                {{ formatMoney(loan.balance) }}
              </span>
              <button class="btn-secondary" @click="openPaymentModal(loan.id)">Record Payment</button>
            </li>
          </ul>
          <p v-else class="form-help">No current open loans.</p>
        </article>
      </div>

      <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateModal">
        <div class="modal-card">
          <h3 class="form-title">Create Loan</h3>
          <p class="form-help">Choose a customer, loan type, and repayment schedule before saving.</p>
          <div class="form-grid">
            <div class="field">
              <label class="field-label">Customer</label>
              <select v-model="customerId">
                <option disabled value="">Select customer</option>
                <option v-for="item in customers" :key="item.id" :value="item.id">{{ item.name }}</option>
              </select>
            </div>
            <div class="field">
              <label class="field-label">Loan Type</label>
              <select v-model="type">
                <option value="straight_line">Straight Line</option>
                <option value="diminishing">Diminishing</option>
              </select>
            </div>
            <div class="field">
              <label class="field-label">Funding Source</label>
              <select v-model="fundingAccountId">
                <option disabled value="">Select funding source</option>
                <option v-for="item in fundingAccounts" :key="item.id" :value="item.id">
                  {{ item.name }} · Bal: {{ formatMoney(item.currentBalance) }}
                </option>
              </select>
              <p class="field-help">Loan principal is deducted from this source on disbursement.</p>
            </div>
            <div class="field">
              <label class="field-label">Principal</label>
              <input v-model.number="principal" type="number" min="0" step="0.01" placeholder="0.00" />
            </div>
            <div class="field">
              <label class="field-label">Interest</label>
              <input v-model.number="interest" type="number" min="0" step="0.01" placeholder="0.00" />
            </div>
            <div class="field">
              <label class="field-label">Number of Payments</label>
              <input v-model.number="numOfPayments" type="number" min="1" step="1" placeholder="1" />
            </div>
            <div class="field">
              <label class="field-label">Installment Amount</label>
              <input :value="formatMoney(installmentAmount)" type="text" readonly />
              <p class="field-help">Auto-calculated from principal + interest divided by number of payments.</p>
            </div>
            <div class="field">
              <label class="field-label">Total Loan Amount</label>
              <input :value="formatMoney(totalLoanAmount)" type="text" readonly />
              <p class="field-help">Principal + interest. Used as the starting balance.</p>
            </div>
          </div>
          <div class="loan-preview-grid">
            <article class="loan-preview-item">
              <p class="kpi-label">Total Amount</p>
              <p class="kpi-value">{{ formatMoney(totalLoanAmount) }}</p>
            </article>
            <article class="loan-preview-item">
              <p class="kpi-label">Per Installment</p>
              <p class="kpi-value">{{ formatMoney(installmentAmount) }}</p>
            </article>
            <article class="loan-preview-item">
              <p class="kpi-label">No. of Payments</p>
              <p class="kpi-value">{{ numOfPayments }}</p>
            </article>
          </div>
          <div class="form-actions">
            <button @click="create">Save Loan</button>
            <button class="btn-secondary" @click="closeCreateModal">Cancel</button>
          </div>
        </div>
      </div>

      <div v-if="showPaymentModal && selectedLoan" class="modal-overlay" @click.self="closePaymentModal">
        <div class="modal-card">
          <h3 class="form-title">Record Payment</h3>
          <p class="form-help">
            Customer: {{ selectedLoanCustomerName }} · Selected balance: {{ formatMoney(selectedLoan.balance) }}
          </p>
          <div class="form-grid">
            <div class="field">
              <label class="field-label">Payment Amount</label>
              <input
                v-model.number="paymentAmount"
                type="number"
                min="0"
                :max="Number(selectedLoan.balance)"
                step="0.01"
                placeholder="0.00"
              />
              <p class="field-help">Remaining balance after payment: {{ formatMoney(remainingAfterPayment) }}</p>
            </div>
            <div class="field">
              <label class="field-label">Deposit To Funding Source</label>
              <select v-model="paymentFundingAccountId">
                <option value="">Do not auto-deposit</option>
                <option v-for="item in fundingAccounts" :key="item.id" :value="item.id">
                  {{ item.name }} · Bal: {{ formatMoney(item.currentBalance) }}
                </option>
              </select>
              <p class="field-help">Optional: post this collection to funding ledger automatically.</p>
            </div>
          </div>
          <div class="form-actions">
            <button class="btn-secondary" @click="setFullPaymentAmount">Pay Full Balance</button>
            <button @click="addPayment">Add Payment</button>
            <button class="btn-secondary" @click="closePaymentModal">Cancel</button>
          </div>
        </div>
      </div>
    </section>
  </AppShell>
</template>
