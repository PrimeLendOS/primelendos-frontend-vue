import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import JwtService from '@/apis/jwt'
import { AuthService, type AuthUser } from '@/apis/services/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const token = ref<string | null>(JwtService.getToken())
  const loading = ref(false)

  const isAuthenticated = computed(() => !!token.value)

  async function login(payload: { email: string; password: string }) {
    loading.value = true
    try {
      const data = await AuthService.login(payload)
      user.value = data
      token.value = data.token || null
      return data
    } finally {
      loading.value = false
    }
  }

  async function register(payload: { name: string; email: string; password: string }) {
    return AuthService.register(payload)
  }

  async function fetchMe() {
    if (!JwtService.getToken()) {
      user.value = null
      token.value = null
      return null
    }

    loading.value = true
    try {
      const data = await AuthService.me()
      user.value = data
      token.value = data.token || JwtService.getToken()
      return data
    } catch {
      logout()
      return null
    } finally {
      loading.value = false
    }
  }

  function logout() {
    user.value = null
    token.value = null
    JwtService.destroyToken()
  }

  return { user, token, loading, isAuthenticated, login, register, fetchMe, logout }
})
