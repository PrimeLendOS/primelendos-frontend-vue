import ApiService from '@/apis/api'

export type AgingEntry = {
  loan_id: string
  principal: number
  interest: number
  total: number
  balance: number
  last_payment_date: string | null
  aging_bucket: string
}

export const AgingService = {
  list() {
    return ApiService.query<AgingEntry[]>('/aging')
  },
}
