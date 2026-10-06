import { apiRequest } from '../../shared/api/client'

export interface AnalyticsSummary {
  totalBilledMinor: number
  invoiceCount: number
  appointmentCount: number
  lowStockCount: number
}

export interface InvoiceReportItem {
  _id: string
  count: number
  totalMinor: number
}

export interface OperationsReportData {
  customers: number
  services: number
  staff: number
  appointments: { _id: string; count: number }[]
  stock: { _id: string; quantity: number }[]
}

export interface TrendsReportData {
  appointments: { _id: string; count: number }[]
  serviceDemand: { _id: string; count: number }[]
  lowStock: { _id: string; name: string; sku: string; currentStock: number; lowStockThreshold: number }[]
}

export type CampaignStatus = 'draft' | 'active' | 'archived'

export interface CampaignRecord {
  _id: string
  name: string
  status: CampaignStatus
  audienceNote?: string
  createdAt: string
  updatedAt?: string
}

export interface CreateCampaignInput {
  name: string
  status?: CampaignStatus
  audienceNote?: string
}

export interface UpdateCampaignInput {
  name?: string
  status?: CampaignStatus
  audienceNote?: string
}

export interface NotificationRecord {
  _id: string
  title: string
  body: string
  recipientUserId?: string
  referenceType?: string
  referenceId?: string
  readAt?: string
  createdAt: string
}

export interface CreateNotificationInput {
  title: string
  body: string
  recipientUserId?: string
  referenceType?: string
  referenceId?: string
}

function queryString(values: Record<string, string | undefined>) {
  const query = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => {
    if (value && value !== 'all' && value !== 'undefined' && value !== 'null' && value.trim() !== '') {
      query.set(key, value.trim())
    }
  })
  const result = query.toString()
  return result ? `?${result}` : ''
}

export async function getAnalyticsSummary(accessToken: string) {
  return apiRequest<{ data: AnalyticsSummary }>({
    path: '/api/v1/analytics/summary',
    method: 'GET',
    token: accessToken,
  })
}

export async function getInvoiceReport(accessToken: string) {
  return apiRequest<{ data: InvoiceReportItem[] }>({
    path: '/api/v1/reports/invoices',
    method: 'GET',
    token: accessToken,
  })
}

export async function getOperationsReport(accessToken: string) {
  return apiRequest<{ data: OperationsReportData }>({
    path: '/api/v1/reports/operations',
    method: 'GET',
    token: accessToken,
  })
}

export async function getTrendsReport(accessToken: string, filters: { startDate?: string; endDate?: string } = {}) {
  return apiRequest<{ data: TrendsReportData }>({
    path: `/api/v1/insights/trends${queryString(filters)}`,
    method: 'GET',
    token: accessToken,
  })
}

export async function getCampaigns(accessToken: string) {
  return apiRequest<{ data: CampaignRecord[] }>({
    path: '/api/v1/marketing/campaigns',
    method: 'GET',
    token: accessToken,
  })
}

export async function createCampaign(accessToken: string, input: CreateCampaignInput) {
  return apiRequest<{ data: CampaignRecord }>({
    path: '/api/v1/marketing/campaigns',
    method: 'POST',
    token: accessToken,
    body: input,
  })
}

export async function updateCampaign(accessToken: string, id: string, input: UpdateCampaignInput) {
  return apiRequest<{ data: CampaignRecord }>({
    path: `/api/v1/marketing/campaigns/${encodeURIComponent(id)}`,
    method: 'PATCH',
    token: accessToken,
    body: input,
  })
}

export async function getNotifications(accessToken: string) {
  return apiRequest<{ data: NotificationRecord[] }>({
    path: '/api/v1/notifications',
    method: 'GET',
    token: accessToken,
  })
}

export async function createNotification(accessToken: string, input: CreateNotificationInput) {
  return apiRequest<{ data: NotificationRecord }>({
    path: '/api/v1/notifications',
    method: 'POST',
    token: accessToken,
    body: input,
  })
}

export async function markNotificationRead(accessToken: string, id: string) {
  return apiRequest<{ data: NotificationRecord }>({
    path: `/api/v1/notifications/${encodeURIComponent(id)}/read`,
    method: 'PATCH',
    token: accessToken,
  })
}
