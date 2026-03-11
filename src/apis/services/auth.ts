import ApiService from '@/apis/api'
import JwtService from '@/apis/jwt'

export type AuthUser = {
  _id: string
  name: string
  email: string
  role: 'owner' | 'manager' | 'staff'
  tenant_id: string
  token?: string
}

export const AuthService = {
  async login(payload: { email: string; password: string }) {
    const data = await ApiService.post<AuthUser & { token: string }>('/auth/signin', payload)
    JwtService.saveToken(data.token)
    return data
  },
  register(payload: { name: string; email: string; password: string }) {
    return ApiService.post<AuthUser>('/auth/signup', payload)
  },
  me() {
    return ApiService.post<AuthUser & { token: string }>('/auth/me')
  },
  tokenIsValid() {
    return ApiService.post<boolean>('/auth/tokenIsValid')
  },
}
