import { API_URL } from '@/apis/config'
import JwtService from '@/apis/jwt'

type DownloadParams = {
  from?: string
  to?: string
}

function buildQuery(params?: DownloadParams) {
  if (!params) {
    return ''
  }

  const searchParams = new URLSearchParams()
  if (params.from) {
    searchParams.set('from', params.from)
  }
  if (params.to) {
    searchParams.set('to', params.to)
  }

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

async function download(path: string, filename: string, params?: DownloadParams) {
  const token = JwtService.getToken()
  const response = await fetch(`${API_URL}${path}${buildQuery(params)}`, {
    method: 'GET',
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Failed to download report')
  }

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export const ReportService = {
  downloadReceivablesCsv(params?: DownloadParams) {
    return download('/reports/receivables.csv', 'receivables-report.csv', params)
  },
  downloadPayablesCsv(params?: DownloadParams) {
    return download('/reports/payables.csv', 'payables-report.csv', params)
  },
  downloadInterestIncomeCsv(params?: DownloadParams) {
    return download('/reports/interest-income.csv', 'interest-income-report.csv', params)
  },
  downloadFundingLedgerCsv(params?: DownloadParams) {
    return download('/reports/funding-ledger.csv', 'funding-ledger-report.csv', params)
  },
  downloadDailyCashPositionCsv(params?: DownloadParams) {
    return download('/reports/daily-cash-position.csv', 'daily-cash-position-report.csv', params)
  },
}
