import { apiRequest } from '../../shared/api/client'

export interface BackendSummary {
  totalBilledMinor?: number
  invoiceCount?: number
  appointmentCount?: number
  lowStockCount?: number
  paymentRevenueMinor?: number
  paymentCount?: number
}

export async function getDashboardSummary(accessToken: string): Promise<BackendSummary> {
  const response = await apiRequest<{ data: BackendSummary }>({
    path: '/api/v1/analytics/summary',
    method: 'GET',
    token: accessToken,
  })
  return response.data
}
