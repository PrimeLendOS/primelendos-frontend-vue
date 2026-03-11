import { API_URL } from './config'
import JwtService from './jwt'

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  params?: Record<string, string | number | boolean | undefined>
  body?: unknown
}

async function request<T>(resource: string, options: ApiOptions = {}): Promise<T> {
  const url = new URL(`${API_URL}${resource}`)

  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value))
      }
    })
  }

  const token = JwtService.getToken()
  const response = await fetch(url.toString(), {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
      'x-auth-token': token || '',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    const message = data?.msg || data?.error || 'Request failed'
    if (response.status === 401 || response.status === 403) {
      JwtService.destroyToken()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    throw new Error(message)
  }

  return data as T
}

const ApiService = {
  query<T>(resource: string, params?: Record<string, string | number | boolean | undefined>) {
    return request<T>(resource, { method: 'GET', params })
  },
  post<T>(resource: string, body?: unknown) {
    return request<T>(resource, { method: 'POST', body })
  },
}

export default ApiService
