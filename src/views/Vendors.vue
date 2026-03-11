<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppShell from '@/components/AppShell.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import { VendorService, type Vendor } from '@/apis/services/vendors'

const entries = ref<Vendor[]>([])
const name = ref('')
const address = ref('')
const contactNumber = ref('')
const editingId = ref<string | null>(null)
const editName = ref('')
const editAddress = ref('')
const editContactNumber = ref('')
const error = ref('')
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    entries.value = await VendorService.list()
  } finally {
    loading.value = false
  }
}

async function create() {
  error.value = ''
  if (!name.value.trim()) return
  try {
    await VendorService.create({
      name: name.value.trim(),
      address: address.value.trim() || undefined,
      contact_number: contactNumber.value.trim() || undefined,
    })
    name.value = ''
    address.value = ''
    contactNumber.value = ''
    await load()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to create vendor'
  }
}

async function remove(id: string) {
  await VendorService.delete(id)
  if (editingId.value === id) {
    cancelEdit()
  }
  await load()
}

function startEdit(item: Vendor) {
  editingId.value = item.id
  editName.value = item.name || ''
  editAddress.value = item.address || ''
  editContactNumber.value = item.contactNumber || ''
}

function cancelEdit() {
  editingId.value = null
  editName.value = ''
  editAddress.value = ''
  editContactNumber.value = ''
}

async function saveEdit(id: string) {
  error.value = ''
  if (!editName.value.trim()) {
    error.value = 'Vendor name is required'
    return
  }

  try {
    await VendorService.update({
      id,
      name: editName.value.trim(),
      address: editAddress.value.trim() || undefined,
      contact_number: editContactNumber.value.trim() || undefined,
    })
    cancelEdit()
    await load()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to update vendor'
  }
}

onMounted(load)
</script>

<template>
  <AppShell>
    <section class="page-card">
      <div class="page-header">
        <h1>Vendors</h1>
        <p class="page-subtitle">Capture supplier details clearly to keep payables and remittances organized.</p>
      </div>

      <div class="form-section">
        <h3 class="form-title">New Vendor</h3>
        <p class="form-help">Add complete supplier information for faster payable entry and follow-up.</p>
        <div class="form-grid">
          <div class="field">
            <label class="field-label">Vendor Name</label>
            <input v-model="name" placeholder="e.g. Metro Supplies Inc." />
          </div>
          <div class="field">
            <label class="field-label">Contact Number</label>
            <input v-model="contactNumber" placeholder="e.g. 0998 765 4321" />
          </div>
          <div class="field">
            <label class="field-label">Address</label>
            <input v-model="address" placeholder="Street, City" />
          </div>
        </div>
        <div class="form-actions">
          <button @click="create">Add Vendor</button>
        </div>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
      <LoadingSkeleton v-if="loading" :rows="5" />
      <ul>
        <li v-for="item in entries" v-show="!loading" :key="item.id">
          <template v-if="editingId === item.id">
            <div class="form-grid">
              <div class="field">
                <label class="field-label">Vendor Name</label>
                <input v-model="editName" placeholder="Vendor name" />
              </div>
              <div class="field">
                <label class="field-label">Contact Number</label>
                <input v-model="editContactNumber" placeholder="Contact number" />
              </div>
              <div class="field">
                <label class="field-label">Address</label>
                <input v-model="editAddress" placeholder="Address" />
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
