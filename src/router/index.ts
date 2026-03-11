import { createRouter, createWebHistory } from 'vue-router'
import JwtService from '@/apis/jwt'
import { AuthService } from '@/apis/services/auth'
import HomeView from '@/views/HomeView.vue'
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'
import Dashboard from '@/views/Dashboard.vue'
import Customers from '@/views/Customers.vue'
import Vendors from '@/views/Vendors.vue'
import Loans from '@/views/Loans.vue'
import Collections from '@/views/Collections.vue'
import CollectionsWorkflow from '@/views/CollectionsWorkflow.vue'
import Payables from '@/views/Payables.vue'
import Aging from '@/views/Aging.vue'
import Reports from '@/views/Reports.vue'
import Funding from '@/views/Funding.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
    {
      path: '/register',
      name: 'register',
      component: Register,
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: Dashboard,
      meta: { requiresAuth: true },
    },
    {
      path: '/customers',
      name: 'customers',
      component: Customers,
      meta: { requiresAuth: true },
    },
    {
      path: '/vendors',
      name: 'vendors',
      component: Vendors,
      meta: { requiresAuth: true },
    },
    {
      path: '/loans',
      name: 'loans',
      component: Loans,
      meta: { requiresAuth: true },
    },
    {
      path: '/collections',
      name: 'collections',
      component: Collections,
      meta: { requiresAuth: true },
    },
    {
      path: '/collections-workflow',
      name: 'collections-workflow',
      component: CollectionsWorkflow,
      meta: { requiresAuth: true },
    },
    {
      path: '/payables',
      name: 'payables',
      component: Payables,
      meta: { requiresAuth: true },
    },
    {
      path: '/funding',
      name: 'funding',
      component: Funding,
      meta: { requiresAuth: true },
    },
    {
      path: '/aging',
      name: 'aging',
      component: Aging,
      meta: { requiresAuth: true },
    },
    {
      path: '/reports',
      name: 'reports',
      component: Reports,
      meta: { requiresAuth: true },
    },
  ],
})

let lastCheckedToken = ''
let lastIsValid = false

router.beforeEach(async (to) => {
  const token = JwtService.getToken() || ''
  const hasToken = !!token

  if (!hasToken) {
    lastCheckedToken = ''
    lastIsValid = false

    if (to.meta.requiresAuth) {
      return { name: 'login' }
    }

    return true
  }

  if (token !== lastCheckedToken) {
    try {
      lastIsValid = await AuthService.tokenIsValid()
      lastCheckedToken = token
    } catch {
      lastIsValid = false
      lastCheckedToken = token
    }
  }

  if (!lastIsValid) {
    JwtService.destroyToken()
    lastCheckedToken = ''

    if (to.meta.requiresAuth) {
      return { name: 'login' }
    }

    return true
  }

  if (to.name === 'login' || to.name === 'register') {
    return { name: 'dashboard' }
  }

  return true
})

export default router
