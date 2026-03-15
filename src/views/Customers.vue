<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppShell from '@/components/AppShell.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import { CustomerService, type Customer } from '@/apis/services/customers'

const entries = ref<Customer[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const search = ref('')

const showModal = ref(false)
const editingItem = ref<Customer | null>(null)
const form = ref({ name: '', address: '', contactNumber: '', salary: '' })

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return entries.value
  return entries.value.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      (c.contactNumber || '').toLowerCase().includes(q) ||
      (c.address || '').toLowerCase().includes(q),
  )
})

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatSalary(value: Customer['salary']) {
  if (value === null || value === undefined || value === '') return '—'
  const n = Number(value)
  if (Number.isNaN(n)) return String(value)
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function load() {
  loading.value = true
  try {
    entries.value = await CustomerService.list()
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingItem.value = null
  form.value = { name: '', address: '', contactNumber: '', salary: '' }
  error.value = ''
  showModal.value = true
}

function openEdit(item: Customer) {
  editingItem.value = item
  form.value = {
    name: item.name || '',
    address: item.address || '',
    contactNumber: item.contactNumber || '',
    salary: item.salary !== null && item.salary !== undefined ? String(item.salary) : '',
  }
  error.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingItem.value = null
}

async function save() {
  error.value = ''
  if (!form.value.name.trim()) {
    error.value = 'Customer name is required'
    return
  }
  const parsedSalary = form.value.salary ? Number(form.value.salary) : undefined
  if (form.value.salary && Number.isNaN(parsedSalary)) {
    error.value = 'Salary must be a valid number'
    return
  }
  saving.value = true
  try {
    if (editingItem.value) {
      await CustomerService.update({
        id: editingItem.value.id,
        name: form.value.name.trim(),
        address: form.value.address.trim() || undefined,
        contact_number: form.value.contactNumber.trim() || undefined,
        salary: parsedSalary,
      })
    } else {
      await CustomerService.create({
        name: form.value.name.trim(),
        address: form.value.address.trim() || undefined,
        contact_number: form.value.contactNumber.trim() || undefined,
        salary: parsedSalary,
      })
    }
    closeModal()
    await load()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to save customer'
  } finally {
    saving.value = false
  }
}

async function remove(id: string) {
  if (!confirm('Delete this customer? This cannot be undone.')) return
  await CustomerService.delete(id)
  await load()
}

onMounted(load)
</script>

<template>
  <AppShell>
    <section class="page-card">
      <div class="page-header-row">
        <div>
          <h1>Customers</h1>
          <p class="page-subtitle">Manage borrower profiles for accurate loan encoding and collections.</p>
        </div>
        <button @click="openCreate">+ New Customer</button>
      </div>

      <div class="toolbar-row">
        <input v-model="search" class="search-input" placeholder="Search by name, contact, or address…" />
        <span class="count-badge">{{ filtered.length }} {{ filtered.length === 1 ? 'customer' : 'customers' }}</span>
      </div>

      <LoadingSkeleton v-if="loading" :rows="5" />

      <div v-if="!loading && filtered.length === 0" class="empty-state">
        <div class="empty-icon">👤</div>
        <p>{{ search ? 'No customers match your search.' : 'No customers yet. Add your first borrower to get started.' }}</p>
        <button v-if="!search" @click="openCreate">Add first customer</button>
      </div>

      <ul v-if="!loading && filtered.length > 0">
        <li v-for="item in filtered" :key="item.id">
          <div class="item-avatar">{{ initials(item.name) }}</div>
          <div class="item-body">
            <strong>{{ item.name }}</strong>
            <div class="item-metas">
              <span class="item-meta-chip">📞 {{ item.contactNumber || '—' }}</span>
              <span class="item-meta-chip">📍 {{ item.address || '—' }}</span>
              <span class="item-meta-chip">💰 {{ formatSalary(item.salary) }}/mo</span>
            </div>
          </div>
          <div class="item-actions">
            <button @click="openEdit(item)">Edit</button>
            <button class="btn-danger" @click="remove(item.id)">Delete</button>
          </div>
        </li>
      </ul>
    </section>

    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-card">
          <div class="modal-header">
            <div>
              <h3>{{ editingItem ? 'Edit Customer' : 'New Customer' }}</h3>
              <p class="form-help" style="margin:0">
                {{ editingItem ? 'Update profile details below.' : 'Fill in the borrower details to register a new customer.' }}
              </p>
            </div>
            <button class="modal-close" @click="closeModal">✕</button>
          </div>
          <div class="form-grid">
            <div class="field">
              <label class="field-label">Full Name <span class="required">*</span></label>
              <input v-model="form.name" placeholder="e.g. Maria Santos" />
            </div>
            <div class="field">
              <label class="field-label">Contact Number</label>
              <input v-model="form.contactNumber" placeholder="e.g. 0917 123 4567" />
            </div>
            <div class="field">
              <label class="field-label">Address</label>
              <input v-model="form.address" placeholder="Street, Barangay, City" />
            </div>
            <div class="field">
              <label class="field-label">Monthly Salary</label>
              <input v-model="form.salary" type="number" min="0" step="0.01" placeholder="0.00" />
            </div>
          </div>
          <p v-if="error" class="error">{{ error }}</p>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeModal">Cancel</button>
            <button @click="save" :disabled="saving">
              {{ saving ? 'Saving…' : editingItem ? 'Save Changes' : 'Add Customer' }}
            </button>
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

.toolbar-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.search-input {
  flex: 1;
  max-width: 360px;
}

.count-badge {
  color: var(--muted);
  font-size: 0.84rem;
  white-space: nowrap;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--muted);
  border: 1.5px dashed var(--border);
  border-radius: 12px;
  margin-top: 0.5rem;
}

.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.empty-state p {
  margin: 0 0 1rem;
}

.item-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-800), var(--secondary-600));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.item-body {
  flex: 1;
  min-width: 0;
}

.item-metas {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-top: 0.3rem;
}

.item-meta-chip {
  font-size: 0.78rem;
  color: var(--muted);
  background: var(--surface-alt);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 0.1rem 0.55rem;
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
