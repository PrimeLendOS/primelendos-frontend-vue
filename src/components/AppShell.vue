<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import brandLogo from '@/assets/images/primelendos-logo.svg'

const authStore = useAuthStore()
const router = useRouter()
const sidebarOpen = ref(false)

function logout() {
  authStore.logout()
  router.push('/login')
}

function closeSidebar() {
  sidebarOpen.value = false
}
</script>

<template>
  <div class="app-shell">
    <!-- Mobile top bar -->
    <header class="mobile-bar">
      <button class="hamburger" @click="sidebarOpen = !sidebarOpen" aria-label="Toggle menu">
        <span /><span /><span />
      </button>
      <img :src="brandLogo" alt="PrimeLendOS" class="mobile-logo" />
    </header>

    <!-- Overlay for mobile -->
    <div v-if="sidebarOpen" class="sidebar-overlay" @click="closeSidebar" />

    <aside class="sidebar" :class="{ 'sidebar-open': sidebarOpen }">
      <div class="sidebar-brand">
        <img :src="brandLogo" alt="PrimeLendOS" class="brand-logo" />
        <div>
          <h2 class="brand-title">PrimeLendOS</h2>
          <p class="subtitle">{{ authStore.user?.name || 'User' }}</p>
        </div>
      </div>

      <nav class="nav-items" @click="closeSidebar">
        <RouterLink class="nav-link" to="/dashboard">
          <span class="nav-icon">⊞</span> Dashboard
        </RouterLink>
        <RouterLink class="nav-link" to="/customers">
          <span class="nav-icon">👥</span> Customers
        </RouterLink>
        <RouterLink class="nav-link" to="/vendors">
          <span class="nav-icon">🏢</span> Vendors
        </RouterLink>
        <RouterLink class="nav-link" to="/loans">
          <span class="nav-icon">💳</span> Loans
        </RouterLink>

        <div class="nav-divider" />

        <RouterLink class="nav-link" to="/collections">
          <span class="nav-icon">💰</span> Collections
        </RouterLink>
        <RouterLink class="nav-link" to="/collections-workflow">
          <span class="nav-icon">📋</span> Workflow
        </RouterLink>
        <RouterLink class="nav-link" to="/payables">
          <span class="nav-icon">📄</span> Payables
        </RouterLink>

        <div class="nav-divider" />

        <RouterLink class="nav-link" to="/funding">
          <span class="nav-icon">🏦</span> Funding
        </RouterLink>
        <RouterLink class="nav-link" to="/aging">
          <span class="nav-icon">⏱</span> Aging
        </RouterLink>
        <RouterLink class="nav-link" to="/reports">
          <span class="nav-icon">📊</span> Reports
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <button type="button" class="logout-btn" @click="logout">
          <span class="nav-icon">↩</span> Logout
        </button>
      </div>
    </aside>

    <main class="content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 100vh;
}

.mobile-bar {
  display: none;
}

.sidebar {
  background: linear-gradient(185deg, var(--primary-900) 0%, var(--primary-700) 100%);
  padding: 1.1rem;
  color: #fff;
  border-right: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  flex-direction: column;
  gap: 0;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 1.2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
}

.brand-logo {
  width: 38px;
  flex-shrink: 0;
}

.brand-title {
  margin: 0;
  font-size: 1rem;
  letter-spacing: 0.3px;
  line-height: 1.2;
}

.subtitle {
  margin: 0.1rem 0 0;
  color: #fbcfe8;
  font-size: 0.78rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}

.nav-items {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  border-radius: 9px;
  border: 1px solid transparent;
  padding: 0.55rem 0.75rem;
  font-weight: 500;
  font-size: 0.88rem;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.85);
  transition: all 0.15s ease;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.nav-link.router-link-active {
  background: #fff;
  color: var(--primary-800);
  border-color: rgba(255, 255, 255, 0.3);
  font-weight: 700;
}

.nav-icon {
  font-size: 1rem;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.nav-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.12);
  margin: 0.4rem 0;
}

.sidebar-footer {
  padding-top: 0.8rem;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  margin-top: 0.5rem;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  width: 100%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.85);
  border-radius: 9px;
  padding: 0.55rem 0.75rem;
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  transform: none;
  filter: none;
}

.content {
  padding: 1.3rem;
  min-width: 0;
}

.content > .page-card {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
}

.sidebar-overlay {
  display: none;
}

@media (max-width: 900px) {
  .app-shell {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }

  .mobile-bar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: linear-gradient(90deg, var(--primary-900), var(--primary-700));
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .mobile-logo {
    height: 28px;
  }

  .hamburger {
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 4px;
    border-radius: 6px;
    transform: none;
    filter: none;
  }

  .hamburger span {
    display: block;
    width: 22px;
    height: 2px;
    background: #fff;
    border-radius: 2px;
    transition: all 0.2s;
  }

  .hamburger:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 260px;
    z-index: 200;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.25);
  }

  .sidebar.sidebar-open {
    transform: translateX(0);
  }

  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.5);
    z-index: 150;
  }

  .content {
    padding: 1rem;
  }
}
</style>
