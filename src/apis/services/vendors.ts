import ApiService from '@/apis/api'

export type Vendor = {
  id: string
  name: string
  address?: string | null
  contactNumber?: string | null
}

export const VendorService = {
  list() {
    return ApiService.query<Vendor[]>('/vendors')
  },
  create(payload: { name: string; address?: string; contact_number?: string }) {
    return ApiService.post<Vendor>('/vendors/save', payload)
  },
  update(payload: { id: string; name: string; address?: string; contact_number?: string }) {
    return ApiService.post<Vendor>('/vendors/update', payload)
  },
  delete(id: string) {
    return ApiService.post('/vendors/delete', { id })
  },
}
