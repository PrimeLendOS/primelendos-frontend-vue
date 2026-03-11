<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import { DelinquencyService, type DelinquencyQueueItem } from '@/apis/services/delinquency'

const entries = ref<DelinquencyQueueItem[]>([])
const loading = ref(false)
const error = ref('')
const success = ref('')

const selectedLoanId = ref('')
const casePriority = ref<'low' | 'medium' | 'high'>('medium')
const caseStatus = ref<'open' | 'resolved'>('open')
const nextFollowUpDate = ref('')
const promiseToPayDate = ref('')
const showCaseModal = ref(false)

const actionType = ref<'call' | 'sms' | 'email' | 'visit' | 'note' | 'promise_to_pay'>('call')
const actionOutcome = ref('')
const actionNotes = ref('')
const actionNextFollowUpDate = ref('')
const actionPromiseToPayDate = ref('')
const showActionModal = ref(false)
const route = useRoute()

const queryLoanId = computed(() => {
  const value = route.query.loanId
  return typeof value === 'string' ? value : ''
})

const shouldAutoOpenLogAction = computed(() => route.query.action === 'log')
const queryAgingBucket = computed(() => {
  const value = route.query.bucket
  return typeof value === 'string' ? value : ''
})

function formatBucketLabel(bucket: string) {
  if (bucket === 'current') return 'Current'
  if (bucket === '1-30') return '1–30 Days'
  if (bucket === '31-60') return '31–60 Days'
  if (bucket === '61+') return '61+ Days'
  return bucket
}

const orderedEntries = computed(() => {
  if (!queryLoanId.value) {
    return entries.value
  }

  return [...entries.value].sort((a, b) => {
    if (a.loanId === queryLoanId.value) return -1
    if (b.loanId === queryLoanId.value) return 1
    return 0
  })
})

async function load() {
  loading.value = true
  try {
    entries.value = await DelinquencyService.queue()
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

function formatLoanType(value: DelinquencyQueueItem['type']) {
  return value === 'straight_line' ? 'Straight Line' : 'Diminishing'
}

function openCaseModal(item: DelinquencyQueueItem) {
  error.value = ''
  success.value = ''
  selectedLoanId.value = item.loanId
  casePriority.value = item.priority
  caseStatus.value = item.caseStatus
  nextFollowUpDate.value = item.nextFollowUpDate || ''
  promiseToPayDate.value = item.promiseToPayDate || ''
  showCaseModal.value = true
}

function closeCaseModal() {
  showCaseModal.value = false
}

function openActionModal(item: DelinquencyQueueItem) {
  error.value = ''
  success.value = ''
  selectedLoanId.value = item.loanId
  actionType.value = 'call'
  actionOutcome.value = ''
  actionNotes.value =
    queryLoanId.value === item.loanId && shouldAutoOpenLogAction.value
      ? `Opened from Aging page - Loan #${item.loanId.slice(0, 8)}${queryAgingBucket.value ? ` - Bucket: ${formatBucketLabel(queryAgingBucket.value)}` : ''}`
      : ''
  actionNextFollowUpDate.value = item.nextFollowUpDate || ''
  actionPromiseToPayDate.value = item.promiseToPayDate || ''
  showActionModal.value = true
}

function closeActionModal() {
  showActionModal.value = false
}

async function saveCase() {
  error.value = ''
  success.value = ''

  try {
    await DelinquencyService.upsertCase({
      loan_id: selectedLoanId.value,
      priority: casePriority.value,
      status: caseStatus.value,
      next_follow_up_date: nextFollowUpDate.value || undefined,
      promise_to_pay_date: promiseToPayDate.value || undefined,
    })

    showCaseModal.value = false
    success.value = 'Case details updated.'
    await load()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to update case'
  }
}

async function saveAction() {
  error.value = ''
  success.value = ''

  try {
    await DelinquencyService.logAction({
      loan_id: selectedLoanId.value,
      action_type: actionType.value,
      outcome: actionOutcome.value || undefined,
      notes: actionNotes.value || undefined,
      next_follow_up_date: actionNextFollowUpDate.value || undefined,
      promise_to_pay_date: actionPromiseToPayDate.value || undefined,
    })

    showActionModal.value = false
    success.value = 'Collection action logged.'
    await load()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to log action'
  }
}

onMounted(async () => {
  await load()

  if (queryLoanId.value && shouldAutoOpenLogAction.value) {
    const target = entries.value.find((item) => item.loanId === queryLoanId.value)
    if (target) {
      openActionModal(target)
    }
  }
})
</script>

<template>
  <AppShell>
    <section class="page-card">
      <div class="page-header">
        <h1>Collections Workflow</h1>
        <p class="page-subtitle">Prioritize overdue loans, set follow-up plans, and log collector actions.</p>
      </div>

      <p v-if="queryLoanId" class="form-help">Focused loan from Aging is highlighted below for faster follow-up.</p>
      <p v-if="queryLoanId && shouldAutoOpenLogAction" class="form-help">Log Action opens automatically for one-click follow-up.</p>

      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="success" class="success">{{ success }}</p>

      <LoadingSkeleton v-if="loading" :rows="6" />
      <ul v-show="!loading">
        <li
          v-for="item in orderedEntries"
          :key="item.loanId"
          class="workflow-item"
          :class="{ 'workflow-item-focused': queryLoanId && item.loanId === queryLoanId }"
        >
          <div>
            <strong>{{ item.customerName }}</strong>
            <div class="item-meta">
              {{ formatLoanType(item.type) }} · Balance: {{ formatMoney(item.balance) }} · DPD: {{ item.daysPastDue }}
            </div>
            <div class="item-meta">
              Priority: {{ item.priority }} · Status: {{ item.caseStatus }} · Next Follow-up:
              {{ item.nextFollowUpDate || '—' }}
            </div>
            <div class="item-meta">
              Last Action: {{ item.lastActionType || '—' }} {{ item.lastActionOutcome ? `(${item.lastActionOutcome})` : '' }}
            </div>
          </div>
          <div class="item-actions">
            <button @click="openCaseModal(item)">Manage Case</button>
            <button class="btn-secondary" @click="openActionModal(item)">Log Action</button>
          </div>
        </li>
      </ul>

      <div v-if="showCaseModal" class="modal-overlay" @click.self="closeCaseModal">
        <div class="modal-card">
          <h3 class="form-title">Manage Delinquency Case</h3>
          <p class="form-help">Update priority, status, and commitment dates for this loan.</p>
          <div class="form-grid">
            <div class="field">
              <label class="field-label">Priority</label>
              <select v-model="casePriority">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div class="field">
              <label class="field-label">Case Status</label>
              <select v-model="caseStatus">
                <option value="open">Open</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div class="field">
              <label class="field-label">Next Follow-up Date</label>
              <input v-model="nextFollowUpDate" type="date" />
            </div>
            <div class="field">
              <label class="field-label">Promise-to-Pay Date</label>
              <input v-model="promiseToPayDate" type="date" />
            </div>
          </div>
          <div class="form-actions">
            <button @click="saveCase">Save Case</button>
            <button class="btn-secondary" @click="closeCaseModal">Cancel</button>
          </div>
        </div>
      </div>

      <div v-if="showActionModal" class="modal-overlay" @click.self="closeActionModal">
        <div class="modal-card">
          <h3 class="form-title">Log Collection Action</h3>
          <p class="form-help">Capture collector activity and schedule the next follow-up.</p>
          <div class="form-grid">
            <div class="field">
              <label class="field-label">Action Type</label>
              <select v-model="actionType">
                <option value="call">Call</option>
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="visit">Field Visit</option>
                <option value="note">Internal Note</option>
                <option value="promise_to_pay">Promise to Pay</option>
              </select>
            </div>
            <div class="field">
              <label class="field-label">Outcome</label>
              <input v-model="actionOutcome" placeholder="e.g. Debtor confirmed payment on Friday" />
            </div>
            <div class="field">
              <label class="field-label">Next Follow-up Date</label>
              <input v-model="actionNextFollowUpDate" type="date" />
            </div>
            <div class="field">
              <label class="field-label">Promise-to-Pay Date</label>
              <input v-model="actionPromiseToPayDate" type="date" />
            </div>
            <div class="field">
              <label class="field-label">Notes</label>
              <input v-model="actionNotes" placeholder="Additional details" />
            </div>
          </div>
          <div class="form-actions">
            <button @click="saveAction">Save Action</button>
            <button class="btn-secondary" @click="closeActionModal">Cancel</button>
          </div>
        </div>
      </div>
    </section>
  </AppShell>
</template>
