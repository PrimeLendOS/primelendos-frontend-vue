<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import brandLogo from '@/assets/images/primelendos-logo.svg'

const authStore = useAuthStore()
const router = useRouter()

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <img :src="brandLogo" alt="PrimeLendOS" class="brand-logo" />
      <h2 class="brand-title">PrimeLendOS</h2>
      <p class="subtitle">{{ authStore.user?.name || 'User' }}</p>
      <div class="nav-items">
        <RouterLink class="nav-link" to="/dashboard">Dashboard</RouterLink>
        <RouterLink class="nav-link" to="/customers">Customers</RouterLink>
        <RouterLink class="nav-link" to="/vendors">Vendors</RouterLink>
        <RouterLink class="nav-link" to="/loans">Loans</RouterLink>
        <RouterLink class="nav-link" to="/collections">Collections</RouterLink>
        <RouterLink class="nav-link" to="/collections-workflow">Collections Workflow</RouterLink>
        <RouterLink class="nav-link" to="/payables">Payables</RouterLink>
        <RouterLink class="nav-link" to="/funding">Funding</RouterLink>
        <RouterLink class="nav-link" to="/aging">Aging</RouterLink>
        <RouterLink class="nav-link" to="/reports">Reports</RouterLink>
        <button type="button" class="btn-secondary" @click="logout">Logout</button>
      </div>
    </aside>
    <main class="content">
      <slot />
    </main>
  </div>
</template>
