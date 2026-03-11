<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppShell from '@/components/AppShell.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import { CustomerService, type Customer } from '@/apis/services/customers'

const entries = ref<Customer[]>([])
const name = ref('')
const address = ref('')
const contactNumber = ref('')
const salary = ref('')
const editingId = ref<string | null>(null)
const editName = ref('')
const editAddress = ref('')
const editContactNumber = ref('')
const editSalary = ref('')
const error = ref('')
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    entries.value = await CustomerService.list()
  } finally {
    loading.value = false
  }
}

async function create() {
  error.value = ''
  if (!name.value.trim()) return

  const parsedSalary = salary.value ? Number(salary.value) : undefined
  if (salary.value && Number.isNaN(parsedSalary)) {
    error.value = 'Salary must be a valid number'
    return
  }

  try {
    await CustomerService.create({
      name: name.value.trim(),
      address: address.value.trim() || undefined,
      contact_number: contactNumber.value.trim() || undefined,
      salary: parsedSalary,
    })
    name.value = ''
    address.value = ''
    contactNumber.value = ''
    salary.value = ''
    await load()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to create customer'
  }
}

function formatSalary(value: Customer['salary']) {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  const numericValue = Number(value)
  if (Number.isNaN(numericValue)) {
    return String(value)
  }

  return numericValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function remove(id: string) {
  await CustomerService.delete(id)
  if (editingId.value === id) {
    cancelEdit()
  }
  await load()
}

function startEdit(item: Customer) {
  editingId.value = item.id
  editName.value = item.name || ''
  editAddress.value = item.address || ''
  editContactNumber.value = item.contactNumber || ''
  editSalary.value = item.salary !== null && item.salary !== undefined ? String(item.salary) : ''
}

function cancelEdit() {
  editingId.value = null
  editName.value = ''
  editAddress.value = ''
  editContactNumber.value = ''
  editSalary.value = ''
}

async function saveEdit(id: string) {
  error.value = ''
  if (!editName.value.trim()) {
    error.value = 'Customer name is required'
    return
  }

  const parsedSalary = editSalary.value ? Number(editSalary.value) : undefined
  if (editSalary.value && Number.isNaN(parsedSalary)) {
    error.value = 'Salary must be a valid number'
    return
  }

  try {
    await CustomerService.update({
      id,
      name: editName.value.trim(),
      address: editAddress.value.trim() || undefined,
      contact_number: editContactNumber.value.trim() || undefined,
      salary: parsedSalary,
    })
    cancelEdit()
    await load()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to update customer'
  }
}

onMounted(load)
</script>

<template>
  <AppShell>
    <section class="page-card">
      <div class="page-header">
        <h1>Customers</h1>
        <p class="page-subtitle">Maintain complete borrower profiles so loan encoding and collections are accurate.</p>
      </div>

      <div class="form-section">
        <h3 class="form-title">New Customer</h3>
        <p class="form-help">Add profile details before creating a loan to reduce data re-entry.</p>
        <div class="form-grid">
          <div class="field">
            <label class="field-label">Customer Name</label>
            <input v-model="name" placeholder="e.g. Maria Santos" />
          </div>
          <div class="field">
            <label class="field-label">Contact Number</label>
            <input v-model="contactNumber" placeholder="e.g. 0917 123 4567" />
          </div>
          <div class="field">
            <label class="field-label">Address</label>
            <input v-model="address" placeholder="Street, Barangay, City" />
          </div>
          <div class="field">
            <label class="field-label">Monthly Salary</label>
            <input v-model="salary" type="number" min="0" step="0.01" placeholder="0.00" />
          </div>
        </div>
        <div class="form-actions">
          <button @click="create">Add Customer</button>
        </div>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
      <LoadingSkeleton v-if="loading" :rows="5" />
      <ul>
        <li v-for="item in entries" v-show="!loading" :key="item.id">
          <template v-if="editingId === item.id">
            <div class="form-grid">
              <div class="field">
                <label class="field-label">Customer Name</label>
                <input v-model="editName" placeholder="Customer name" />
              </div>
              <div class="field">
                <label class="field-label">Contact Number</label>
                <input v-model="editContactNumber" placeholder="Contact number" />
              </div>
              <div class="field">
                <label class="field-label">Address</label>
                <input v-model="editAddress" placeholder="Address" />
              </div>
              <div class="field">
                <label class="field-label">Monthly Salary</label>
                <input v-model="editSalary" type="number" min="0" step="0.01" placeholder="Salary" />
              </div>
            </div>
            <div class="item-actions">
              <button @click="saveEdit(item.id)">Save</button>
              <button class="btn-secondary" @click="cancelEdit">Cancel</button>
            </div>
          </template>
          <template v-else>
            <div>
              <strong>{{ item.name }}</strong>
              <div class="item-meta">Contact: {{ item.contactNumber || '—' }}</div>
              <div class="item-meta">Address: {{ item.address || '—' }}</div>
              <div class="item-meta">Salary: {{ formatSalary(item.salary) }}</div>
            </div>
            <div class="item-actions">
              <button @click="startEdit(item)">Edit</button>
              <button class="btn-secondary" @click="remove(item.id)">Delete</button>
            </div>
          </template>
        </li>
      </ul>
    </section>
  </AppShell>
</template>
