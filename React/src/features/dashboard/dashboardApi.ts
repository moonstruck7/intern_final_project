import { apiRequest } from '../../shared/api/client'
export interface BackendSummary { paymentRevenueMinor: number; paymentCount: number; appointmentCount: number; lowStockCount: number }
export async function getDashboardSummary(accessToken: string): Promise<BackendSummary> { const response = await apiRequest<{ data: BackendSummary }>({ path: '/api/v1/analytics/summary', method: 'GET', token: accessToken }); return response.data }
