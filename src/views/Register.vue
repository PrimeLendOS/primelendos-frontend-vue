<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const router = useRouter()
const authStore = useAuthStore()
const message = ref('')
const error = ref('')
const form = reactive({ name: '', email: '', password: '' })

async function onSubmit() {
  message.value = ''
  error.value = ''
  try {
    await authStore.register(form)
    message.value = 'Account created! Redirecting to sign in…'
    setTimeout(() => router.push('/login'), 1200)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Registration failed'
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo-wrap">
        <img src="/primelendos-logo.svg" alt="PrimeLendOS Logo" class="auth-logo" />
      </div>
      <h1 class="auth-title">Join PrimeLendOS</h1>
      <p class="auth-sub">Start managing loans, collections, and reports in one place.</p>

      <form @submit.prevent="onSubmit">
        <div class="field">
          <label class="field-label" for="register-name">Full Name</label>
          <input id="register-name" v-model="form.name" type="text" placeholder="Juan Dela Cruz" required />
        </div>
        <div class="field">
          <label class="field-label" for="register-email">Email Address</label>
          <input id="register-email" v-model="form.email" type="email" placeholder="name@company.com" required />
        </div>
        <div class="field">
          <label class="field-label" for="register-password">Password</label>
          <input id="register-password" v-model="form.password" type="password" placeholder="At least 6 characters" required minlength="6" />
          <p class="field-help">Use a strong password to keep your workspace secure.</p>
        </div>
        <p v-if="message" class="success">{{ message }}</p>
        <p v-if="error" class="error">{{ error }}</p>
        <button type="submit" class="auth-btn" :disabled="authStore.loading">
          {{ authStore.loading ? 'Creating account…' : 'Create Account' }}
        </button>
      </form>

      <div class="promo-strip">
        <span>✓ Free to start</span>
        <span>✓ No credit card</span>
        <span>✓ Free onboarding</span>
      </div>

      <p class="auth-switch">
        Already have an account?
        <RouterLink to="/login">Sign in</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  background: linear-gradient(155deg, var(--primary-900) 0%, var(--primary-700) 50%, #1d4ed8 100%);
}

.auth-card {
  background: #fff;
  border-radius: 18px;
  padding: 2.2rem 2rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
}

.auth-logo-wrap {
  text-align: center;
  margin-bottom: 1.2rem;
}

.auth-logo {
  width: 140px;
}

.auth-title {
  margin: 0;
  font-size: 1.5rem;
  color: var(--primary-900);
  text-align: center;
}

.auth-sub {
  margin: 0.3rem 0 1.5rem;
  color: var(--muted);
  font-size: 0.9rem;
  text-align: center;
}

form {
  display: grid;
  gap: 1rem;
}

.auth-btn {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  margin-top: 0.25rem;
}

.promo-strip {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.promo-strip span {
  font-size: 0.78rem;
  color: var(--muted);
}

.auth-switch {
  margin: 1rem 0 0;
  text-align: center;
  color: var(--muted);
  font-size: 0.88rem;
}

.auth-switch a {
  color: var(--secondary-600);
  font-weight: 600;
  text-decoration: none;
}

.auth-switch a:hover {
  text-decoration: underline;
}
</style>
