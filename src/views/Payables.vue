<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppShell from '@/components/AppShell.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import { PayableService, type Payable } from '@/apis/services/payables'
import { VendorService, type Vendor } from '@/apis/services/vendors'

const vendors = ref<Vendor[]>([])
const entries = ref<Payable[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')

const showCreateModal = ref(false)
const createForm = ref({ vendorId: '', amount: '', remarks: '' })

const showPaymentModal = ref(false)
const paymentTarget = ref<Payable | null>(null)
const paymentForm = ref({ amount: '', remarks: '', paymentDate: '' })

const vendorMap = computed(() => {
  const m: Record<string, string> = {}
  vendors.value.forEach((v) => (m[v.id] = v.name))
  return m
})

const totalOutstanding = computed(() =>
  entries.value.reduce((sum, p) => sum + Number(p.balance), 0),
)

function formatMoney(value: number | string) {
  const n = Number(value)
  if (Number.isNaN(n)) return String(value)
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function balancePercent(payable: Payable) {
  const total = Number(payable.amount)
  const bal = Number(payable.balance)
  if (!total) return 0
  return Math.round((bal / total) * 100)
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

async function load() {
  loading.value = true
  try {
    const [v, p] = await Promise.all([VendorService.list(), PayableService.list()])
    vendors.value = v
    entries.value = p
  } finally {
    loading.value = false
  }
}

function openCreate() {
  createForm.value = { vendorId: vendors.value[0]?.id || '', amount: '', remarks: '' }
  error.value = ''
  showCreateModal.value = true
}

function closeCreate() {
  showCreateModal.value = false
}

async function create() {
  error.value = ''
  if (!createForm.value.vendorId) {
    error.value = 'Please select a vendor.'
    return
  }
  const amt = Number(createForm.value.amount)
  if (!amt || amt <= 0) {
    error.value = 'Amount must be greater than zero.'
    return
  }
  saving.value = true
  try {
    await PayableService.create({
      vendor_id: createForm.value.vendorId,
      amount: amt,
      remarks: createForm.value.remarks.trim() || undefined,
    })
    closeCreate()
    await load()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to create payable'
  } finally {
    saving.value = false
  }
}

function openPayment(item: Payable) {
  paymentTarget.value = item
  paymentForm.value = { amount: '', remarks: '', paymentDate: todayIso() }
  error.value = ''
  showPaymentModal.value = true
}

function closePayment() {
  showPaymentModal.value = false
  paymentTarget.value = null
}

function setFullBalance() {
  if (paymentTarget.value) {
    paymentForm.value.amount = String(paymentTarget.value.balance)
  }
}

async function recordPayment() {
  error.value = ''
  if (!paymentTarget.value) return
  const amt = Number(paymentForm.value.amount)
  if (!amt || amt <= 0) {
    error.value = 'Payment amount must be greater than zero.'
    return
  }
  if (amt > Number(paymentTarget.value.balance)) {
    error.value = 'Payment cannot exceed the current balance.'
    return
  }
  saving.value = true
  try {
    await PayableService.addPayment({
      payable_id: paymentTarget.value.id,
      amount: amt,
      remarks: paymentForm.value.remarks.trim() || undefined,
      payment_date: paymentForm.value.paymentDate || undefined,
    })
    closePayment()
    await load()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to record payment'
  } finally {
    saving.value = false
  }
}

async function remove(id: string) {
  if (!confirm('Delete this payable? This cannot be undone.')) return
  await PayableService.delete(id)
  await load()
}

onMounted(load)
</script>

<template>
  <AppShell>
    <section class="page-card">
      <div class="page-header-row">
        <div>
          <h1>Payables</h1>
          <p class="page-subtitle">Record supplier obligations and monitor outstanding payable balances.</p>
        </div>
        <button @click="openCreate">+ New Payable</button>
      </div>

      <div v-if="entries.length > 0" class="summary-strip">
        <div class="summary-item">
          <span class="summary-label">Total Payables</span>
          <span class="summary-value">{{ entries.length }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Outstanding Balance</span>
          <span class="summary-value outstanding">{{ formatMoney(totalOutstanding) }}</span>
        </div>
      </div>

      <LoadingSkeleton v-if="loading" :rows="5" />

      <div v-if="!loading && entries.length === 0" class="empty-state">
        <div class="empty-icon">📄</div>
        <p>No payables yet. Record your first supplier obligation to start tracking.</p>
        <button @click="openCreate">Add first payable</button>
      </div>

      <ul v-if="!loading && entries.length > 0">
        <li v-for="item in entries" :key="item.id">
          <div class="payable-icon">📦</div>
          <div class="item-body">
            <div class="payable-top">
              <strong>{{ vendorMap[item.vendorId] || 'Unknown Vendor' }}</strong>
              <span :class="['balance-badge', Number(item.balance) === 0 ? 'paid' : 'unpaid']">
                {{ Number(item.balance) === 0 ? 'Paid' : 'Outstanding' }}
              </span>
            </div>
            <div class="payable-amounts">
              <span class="amount-label">Original: <b>{{ formatMoney(item.amount) }}</b></span>
              <span class="amount-label">Balance: <b class="balance-text">{{ formatMoney(item.balance) }}</b></span>
            </div>
            <div class="progress-track">
              <div
                class="progress-fill"
                :style="{ width: `${balancePercent(item)}%` }"
                :class="balancePercent(item) > 50 ? 'fill-high' : 'fill-low'"
              />
            </div>
            <span class="progress-label">{{ balancePercent(item) }}% remaining</span>
          </div>
          <div class="item-actions">
            <button v-if="Number(item.balance) > 0" class="btn-secondary" @click="openPayment(item)">Record Payment</button>
            <button class="btn-danger" @click="remove(item.id)">Delete</button>
          </div>
        </li>
      </ul>
    </section>

    <!-- Create Payable Modal -->
    <Teleport to="body">
      <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreate">
        <div class="modal-card">
          <div class="modal-header">
            <div>
              <h3>New Payable</h3>
              <p class="form-help" style="margin:0">Select a vendor and encode the billed amount to track what is still due.</p>
            </div>
            <button class="modal-close" @click="closeCreate">✕</button>
          </div>
          <div class="form-grid">
            <div class="field">
              <label class="field-label">Vendor <span class="required">*</span></label>
              <select v-model="createForm.vendorId">
                <option disabled value="">Select vendor</option>
                <option v-for="v in vendors" :key="v.id" :value="v.id">{{ v.name }}</option>
              </select>
            </div>
            <div class="field">
              <label class="field-label">Amount <span class="required">*</span></label>
              <input v-model="createForm.amount" type="number" min="0" step="0.01" placeholder="0.00" />
            </div>
            <div class="field" style="grid-column: 1 / -1">
              <label class="field-label">Remarks</label>
              <input v-model="createForm.remarks" placeholder="Optional notes about this payable" />
            </div>
          </div>
          <p v-if="error" class="error">{{ error }}</p>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeCreate">Cancel</button>
            <button @click="create" :disabled="saving">{{ saving ? 'Saving…' : 'Add Payable' }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Record Payment Modal -->
    <Teleport to="body">
      <div v-if="showPaymentModal && paymentTarget" class="modal-overlay" @click.self="closePayment">
        <div class="modal-card">
          <div class="modal-header">
            <div>
              <h3>Record Payment</h3>
              <p class="form-help" style="margin:0">
                {{ vendorMap[paymentTarget.vendorId] || 'Vendor' }} · Balance: <b>{{ formatMoney(paymentTarget.balance) }}</b>
              </p>
            </div>
            <button class="modal-close" @click="closePayment">✕</button>
          </div>
          <div class="form-grid">
            <div class="field">
              <label class="field-label">Payment Amount <span class="required">*</span></label>
              <input v-model="paymentForm.amount" type="number" min="0" :max="Number(paymentTarget.balance)" step="0.01" placeholder="0.00" />
              <p class="field-help">
                Remaining after payment:
                <b>{{ formatMoney(Math.max(0, Number(paymentTarget.balance) - Number(paymentForm.amount || 0))) }}</b>
              </p>
            </div>
            <div class="field">
              <label class="field-label">Payment Date</label>
              <input v-model="paymentForm.paymentDate" type="date" />
            </div>
            <div class="field" style="grid-column: 1 / -1">
              <label class="field-label">Remarks</label>
              <input v-model="paymentForm.remarks" placeholder="Optional payment notes" />
            </div>
          </div>
          <p v-if="error" class="error">{{ error }}</p>
          <div class="modal-footer">
            <button class="btn-secondary" @click="setFullBalance">Pay Full Balance</button>
            <button class="btn-secondary" @click="closePayment">Cancel</button>
            <button @click="recordPayment" :disabled="saving">{{ saving ? 'Saving…' : 'Record Payment' }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </AppShell>
</template>

<style scoped>
.page-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.1rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.summary-strip {
  display: flex;
  gap: 1.5rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(120deg, rgba(159, 34, 78, 0.06), rgba(37, 99, 235, 0.06));
  border: 1px solid var(--border);
  border-radius: 12px;
  margin-bottom: 1rem;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.summary-label {
  font-size: 0.78rem;
  color: var(--muted);
}

.summary-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--primary-900);
}

.summary-value.outstanding {
  color: #b45309;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--muted);
  border: 1.5px dashed var(--border);
  border-radius: 12px;
}

.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.empty-state p {
  margin: 0 0 1rem;
}

.payable-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.item-body {
  flex: 1;
  min-width: 0;
}

.payable-top {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.balance-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  border: 1px solid;
}

.balance-badge.paid {
  background: #ecfdf5;
  color: #047857;
  border-color: #6ee7b7;
}

.balance-badge.unpaid {
  background: #fffbeb;
  color: #b45309;
  border-color: #fcd34d;
}

.payable-amounts {
  display: flex;
  gap: 1rem;
  margin-top: 0.25rem;
}

.amount-label {
  font-size: 0.82rem;
  color: var(--muted);
}

.balance-text {
  color: #b45309;
}

.progress-track {
  width: 100%;
  max-width: 260px;
  height: 6px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
  margin-top: 0.4rem;
}

.progress-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s ease;
}

.fill-high {
  background: linear-gradient(90deg, #f59e0b, #ef4444);
}

.fill-low {
  background: linear-gradient(90deg, #34d399, #10b981);
}

.progress-label {
  font-size: 0.74rem;
  color: var(--muted);
  margin-top: 0.15rem;
  display: block;
}

.btn-danger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(120deg, #b91c1c, #dc2626);
  color: #fff;
  border-radius: 10px;
  border: 1px solid transparent;
  padding: 0.6rem 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-danger:hover {
  filter: brightness(1.08);
  transform: translateY(-1px);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.modal-close {
  background: none;
  border: 1px solid var(--border);
  color: var(--muted);
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  transition: all 0.15s;
  flex-shrink: 0;
}

.modal-close:hover {
  background: var(--surface-alt);
  color: var(--text);
}

.modal-footer {
  display: flex;
  gap: 0.55rem;
  margin-top: 1.2rem;
  justify-content: flex-end;
}

.required {
  color: #dc2626;
}
</style>
