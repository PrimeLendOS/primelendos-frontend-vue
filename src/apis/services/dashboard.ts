import ApiService from '@/apis/api'

export type DashboardSummary = {
  customer_count: number
  vendor_count: number
  loan_count: number
  payable_count: number
  total_collections: number
  total_receivable: number
  total_payable_balance: number
  high_priority_cases: number
  follow_ups_due_today: number
  promises_due_today: number
}

export type DashboardInsightThresholds = {
  avg_loans_per_customer_good: number
  avg_loans_per_customer_watch: number
  avg_receivable_per_loan_good: number
  avg_receivable_per_loan_watch: number
  avg_payable_per_vendor_good: number
  avg_payable_per_vendor_watch: number
  collections_coverage_good: number
  collections_coverage_watch: number
  due_today_workload_good: number
  due_today_workload_watch: number
  high_priority_loan_rate_good: number
  high_priority_loan_rate_watch: number
}

export type SetupGuideChecklist = {
  customers: boolean
  vendors: boolean
  funding: boolean
  loans: boolean
  collections: boolean
}

export type DashboardSetupGuide = {
  first_login: boolean
  dismissed: boolean
  checklist: SetupGuideChecklist
}

export const DashboardService = {
  summary() {
    return ApiService.query<DashboardSummary>('/dashboard/summary')
  },
  insightThresholds() {
    return ApiService.query<DashboardInsightThresholds>('/dashboard/insight-thresholds')
  },
  saveInsightThresholds(payload: DashboardInsightThresholds) {
    return ApiService.post<DashboardInsightThresholds>('/dashboard/insight-thresholds/save', payload)
  },
  setupGuide() {
    return ApiService.query<DashboardSetupGuide>('/dashboard/setup-guide')
  },
  saveSetupGuide(payload: DashboardSetupGuide) {
    return ApiService.post<DashboardSetupGuide>('/dashboard/setup-guide/save', payload)
  },
}
