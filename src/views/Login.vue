<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const router = useRouter()
const authStore = useAuthStore()
const error = ref('')
const form = reactive({ email: '', password: '' })

async function onSubmit() {
  error.value = ''
  try {
    await authStore.login(form)
    router.push('/dashboard')
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Login failed'
  }
}
</script>

<template>
  <section class="auth-page">
    <div class="page-header">
      <img src="/primelendos-logo.svg" alt="PrimeLendOS Logo" width="80" style="margin-bottom: 12px;" />
      <h1>Welcome to PrimeLendOS</h1>
      <p class="page-subtitle">Sign in to access your modern lending workspace.</p>
    </div>
    <form @submit.prevent="onSubmit">
      <div class="field">
        <label class="field-label" for="login-email">Email Address</label>
        <input id="login-email" v-model="form.email" type="email" placeholder="name@company.com" required />
      </div>
      <div class="field">
        <label class="field-label" for="login-password">Password</label>
        <input id="login-password" v-model="form.password" type="password" placeholder="Enter your password" required />
      </div>
      <div class="form-actions">
        <button type="submit" :disabled="authStore.loading">Sign In</button>
        <RouterLink class="btn btn-secondary" to="/register">Create account</RouterLink>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
    </form>
  </section>
</template>
