import ApiService from '@/apis/api'

export type FundingAccount = {
  id: string
  name: string
  locationType: 'bank_account' | 'cash_on_hand'
  bankName?: string | null
  accountName?: string | null
  accountNumber?: string | null
  accountNumberMasked?: string | null
  currentBalance: number | string
  openingBalance: number | string
  status: 'active' | 'inactive'
}

export type FundingTransaction = {
  id: string
  fundingAccountId: string
  transactionType:
    | 'capital_in'
    | 'collection_in'
    | 'adjustment_in'
    | 'loan_disbursement'
    | 'expense_out'
    | 'adjustment_out'
  amount: number | string
  balanceAfter: number | string
  referenceType?: string | null
  referenceId?: string | null
  remarks?: string | null
  transactionDate: string
  FundingAccount?: {
    id: string
    name: string
    locationType: 'bank_account' | 'cash_on_hand'
    bankName?: string | null
  }
}

export type FundingSummary = {
  total_funds_available: number
  overall_collectibles: number
  total_payables: number
  net_position: number
  high_risk_exposure: number
  liquidity_coverage_ratio: number
  funding_accounts_count: number
}

export type CashflowTrendPoint = {
  date: string
  inflows: number
  outflows: number
  net: number
}

export type CashflowTrend = {
  days: number
  points: CashflowTrendPoint[]
}

export const FundingService = {
  summary() {
    return ApiService.query<FundingSummary>('/funding/summary')
  },
  accounts() {
    return ApiService.query<FundingAccount[]>('/funding/accounts')
  },
  createAccount(payload: {
    name: string
    location_type: 'bank_account' | 'cash_on_hand'
    bank_name?: string
    account_name?: string
    account_number?: string
    opening_balance?: number
    status?: 'active' | 'inactive'
  }) {
    return ApiService.post<FundingAccount>('/funding/accounts/save', payload)
  },
  transactions() {
    return ApiService.query<FundingTransaction[]>('/funding/transactions')
  },
  createTransaction(payload: {
    funding_account_id: string
    transaction_type:
      | 'capital_in'
      | 'collection_in'
      | 'adjustment_in'
      | 'loan_disbursement'
      | 'expense_out'
      | 'adjustment_out'
    amount: number
    remarks?: string
    transaction_date?: string
  }) {
    return ApiService.post('/funding/transactions/save', payload)
  },
  cashflowTrend(days = 30) {
    return ApiService.query<CashflowTrend>('/funding/analytics/cashflow-trend', { days })
  },
}
