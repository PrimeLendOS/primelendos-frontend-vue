import ApiService from '@/apis/api'

export type Payable = {
  id: string
  vendorId: string
  amount: number
  balance: number
  remarks?: string
}

export const PayableService = {
  list() {
    return ApiService.query<Payable[]>('/payables')
  },
  create(payload: { vendor_id: string; amount: number; remarks?: string }) {
    return ApiService.post<Payable>('/payables/save', payload)
  },
  addPayment(payload: { payable_id: string; amount: number; remarks?: string; payment_date?: string }) {
    return ApiService.post('/payables/add-payment', payload)
  },
  delete(id: string) {
    return ApiService.post('/payables/delete', { id })
  },
}
