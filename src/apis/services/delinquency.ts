import ApiService from '@/apis/api'

export type DelinquencyQueueItem = {
  loanId: string
  customerId: string
  customerName: string
  contactNumber?: string | null
  type: 'straight_line' | 'diminishing'
  principal: number | string
  balance: number | string
  daysPastDue: number
  caseStatus: 'open' | 'resolved'
  priority: 'low' | 'medium' | 'high'
  nextFollowUpDate?: string | null
  promiseToPayDate?: string | null
  lastActionType?: string | null
  lastActionOutcome?: string | null
  lastActionAt?: string | null
}

export const DelinquencyService = {
  queue() {
    return ApiService.query<DelinquencyQueueItem[]>('/delinquency/queue')
  },
  upsertCase(payload: {
    loan_id: string
    priority: 'low' | 'medium' | 'high'
    status: 'open' | 'resolved'
    next_follow_up_date?: string
    promise_to_pay_date?: string
  }) {
    return ApiService.post('/delinquency/upsert-case', payload)
  },
  logAction(payload: {
    loan_id: string
    action_type: 'call' | 'sms' | 'email' | 'visit' | 'note' | 'promise_to_pay'
    outcome?: string
    notes?: string
    next_follow_up_date?: string
    promise_to_pay_date?: string
  }) {
    return ApiService.post('/delinquency/log-action', payload)
  },
}
