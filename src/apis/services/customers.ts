import ApiService from '@/apis/api'

export type Customer = {
  id: string
  name: string
  address?: string | null
  contactNumber?: string | null
  salary?: number | string | null
}

export const CustomerService = {
  list() {
    return ApiService.query<Customer[]>('/customers')
  },
  create(payload: { name: string; address?: string; contact_number?: string; salary?: number }) {
    return ApiService.post<Customer>('/customers/save', payload)
  },
  update(payload: { id: string; name: string; address?: string; contact_number?: string; salary?: number }) {
    return ApiService.post<Customer>('/customers/update', payload)
  },
  delete(id: string) {
    return ApiService.post('/customers/delete', { id })
  },
}
