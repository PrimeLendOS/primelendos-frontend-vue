<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppShell from '@/components/AppShell.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import ApiService from '@/apis/api'

type Collection = { id: string; loanId: string; amount: number; paymentDate: string }

const entries = ref<Collection[]>([])
const loading = ref(false)

function formatMoney(value: number) {
  return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

onMounted(async () => {
  loading.value = true
  try {
    entries.value = await ApiService.query<Collection[]>('/collections')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <AppShell>
    <section class="page-card">
      <div class="page-header">
        <h1>Collections</h1>
        <p class="page-subtitle">Review posted borrower payments and verify collection activity.</p>
      </div>
      <p class="form-help">Each record represents one payment transaction against a loan account.</p>
      <LoadingSkeleton v-if="loading" :rows="5" />
      <ul>
        <li v-for="item in entries" v-show="!loading" :key="item.id">
          Loan #{{ item.loanId.slice(0, 8) }} · Amount: {{ formatMoney(item.amount) }} · Date: {{ item.paymentDate }}
        </li>
      </ul>
    </section>
  </AppShell>
</template>
