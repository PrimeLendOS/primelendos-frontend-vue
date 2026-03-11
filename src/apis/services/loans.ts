import ApiService from '@/apis/api'

export type Loan = {
  id: string
  customerId: string
  fundingAccountId?: string | null
  type: 'straight_line' | 'diminishing'
  principal: number
  interest: number
  numOfPayments: number
  amount: number
  total: number
  balance: number
}

export type LoanPayment = {
  id: string
  loanId: string
  amount: number
  balance: number
  remarks?: string
  paymentDate: string
}

export const LoanService = {
  list(type?: string) {
    return ApiService.query<Loan[]>('/loans', type ? { type } : undefined)
  },
  create(payload: {
    customer_id: string
    funding_account_id: string
    type: 'straight_line' | 'diminishing'
    principal: number
    interest: number
    num_of_payments: number
    amount: number
  }) {
    return ApiService.post<Loan>('/loans/save', payload)
  },
  delete(id: string) {
    return ApiService.post('/loans/delete', { id })
  },
  listPayments(loanId: string) {
    return ApiService.query<LoanPayment[]>('/loans/payments', { loan_id: loanId })
  },
  addPayment(payload: { loan_id: string; amount: number; funding_account_id?: string; remarks?: string; payment_date?: string }) {
    return ApiService.post('/loans/add-payment', payload)
  },
}
