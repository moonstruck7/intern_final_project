import type { AppointmentReference } from '../appointments/appointment.types'
import type { InvoiceReference } from '../billing/billing.types'
import type { CustomerReference } from '../customers/customer.types'
import type { InventoryItemReference, InventoryTransactionReference } from '../inventory/inventory.types'
import type { ServiceReference } from '../services/serviceCatalog.types'
import type { StaffReference } from '../staff/staff.types'

/**
 * B4 consumes backend-produced reporting data. These references only document
 * its upstream relationships; B4 must not recreate their source datasets.
 */
export interface ReportingDataSources {
  customer?: CustomerReference
  appointment?: AppointmentReference
  service?: ServiceReference
  staff?: StaffReference
  invoice?: InvoiceReference
  inventoryItem?: InventoryItemReference
  inventoryTransaction?: InventoryTransactionReference
}

export type ReportId = string | number
export type ReportResultId = string | number
export type BusinessInsightId = string | number
export type CampaignId = string | number
export type NotificationId = string | number

/** Identifiers only until the API publishes report definition and result schemas. */
export interface ReportReference {
  id: ReportId
}

export interface ReportResultReference {
  id: ReportResultId
  report: ReportReference
}

/** Filter keys, values, timezones, date handling, and sorting require an API contract. */
export interface ReportFilter {
  readonly contractDependent?: unknown
}

/** Metric labels, values, aggregation and calculations are backend-owned. */
export interface MetricReference {
  id: string | number
}

export interface BusinessInsightReference {
  id: BusinessInsightId
}

/** Campaign targeting, delivery, lifecycle and pricing behavior are not assumed. */
export interface MarketingCampaignReference {
  id: CampaignId
}

/** Notification triggers, channels, state and preference behavior are not assumed. */
export interface NotificationReference {
  id: NotificationId
}

export type AnalyticsArea = 'appointments' | 'customers' | 'services' | 'billing' | 'staff' | 'inventory'
export type ReportingArea = 'reports' | 'analytics' | 'insights' | 'marketing' | 'notifications'
