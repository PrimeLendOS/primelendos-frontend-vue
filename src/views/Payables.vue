<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppShell from '@/components/AppShell.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import { PayableService, type Payable } from '@/apis/services/payables'
import { VendorService, type Vendor } from '@/apis/services/vendors'

const vendors = ref<Vendor[]>([])
const entries = ref<Payable[]>([])
const vendorId = ref('')
const amount = ref(0)
const error = ref('')
const success = ref('')
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    vendors.value = await VendorService.list()
    entries.value = await PayableService.list()
    if (!vendorId.value && vendors.value[0]?.id) {
      vendorId.value = vendors.value[0].id
    }
  } finally {
    loading.value = false
  }
}

async function create() {
  error.value = ''
  success.value = ''

  if (!vendorId.value) {
    error.value = 'Please select a vendor.'
    return
  }

  if (amount.value <= 0) {
    error.value = 'Amount must be greater than zero.'
    return
  }

  try {
    await PayableService.create({ vendor_id: vendorId.value, amount: amount.value })
    amount.value = 0
    success.value = 'Payable added successfully.'
    await load()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to create payable'
  }
}

function formatMoney(value: number | string) {
  const numericValue = Number(value)
  if (Number.isNaN(numericValue)) {
    return String(value)
  }

  return numericValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

onMounted(load)
</script>

<template>
  <AppShell>
    <section class="page-card">
      <div class="page-header">
        <h1>Payables</h1>
        <p class="page-subtitle">Record supplier obligations and monitor outstanding payable balances.</p>
      </div>

      <div class="form-section">
        <h3 class="form-title">New Payable</h3>
        <p class="form-help">Select a vendor and encode the billed amount to track what is still due.</p>
        <div class="form-grid">
          <div class="field">
            <label class="field-label">Vendor</label>
            <select v-model="vendorId">
              <option disabled value="">Select vendor</option>
              <option v-for="item in vendors" :key="item.id" :value="item.id">{{ item.name }}</option>
            </select>
          </div>
          <div class="field">
            <label class="field-label">Payable Amount</label>
            <input v-model.number="amount" type="number" min="0" step="0.01" placeholder="0.00" />
          </div>
        </div>
        <div class="form-actions">
          <button @click="create">Add Payable</button>
        </div>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="success" class="success">{{ success }}</p>
      <LoadingSkeleton v-if="loading" :rows="5" />
      <ul>
        <li v-for="item in entries" v-show="!loading" :key="item.id">
          <span>Payable #{{ item.id.slice(0, 8) }} · Balance: {{ formatMoney(item.balance) }}</span>
        </li>
      </ul>
    </section>
  </AppShell>
</template>
