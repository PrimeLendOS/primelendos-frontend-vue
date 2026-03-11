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
    message.value = 'Registration successful. You can now login.'
    setTimeout(() => router.push('/login'), 600)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Registration failed'
  }
}
</script>

<template>
  <section class="auth-page">
    <div class="page-header">
      <img src="/primelendos-logo.svg" alt="PrimeLendOS Logo" width="80" style="margin-bottom: 12px;" />
      <h1>Join PrimeLendOS</h1>
      <p class="page-subtitle">Start managing loans, collections, and reports in one place with PrimeLendOS.</p>
    </div>
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
      <div class="form-actions">
        <button type="submit">Create account</button>
      </div>
      <p v-if="message" class="success">{{ message }}</p>
      <p v-if="error" class="error">{{ error }}</p>
    </form>
  </section>
</template>
