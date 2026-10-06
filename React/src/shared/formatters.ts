/**
 * Centralized presentation formatters for user-facing UI.
 * Standardizes monetary amounts, counts, and dates across all features.
 */

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const countFormatter = new Intl.NumberFormat(undefined)

/**
 * Formats a minor-unit integer (e.g. cents, 5000) into a user-friendly monetary string ($50.00).
 * Never exposes raw implementation units to the user.
 */
export function formatCurrency(amountMinor?: number | null): string {
  if (typeof amountMinor !== 'number' || Number.isNaN(amountMinor)) {
    return currencyFormatter.format(0)
  }
  return currencyFormatter.format(amountMinor / 100)
}

/**
 * Formats a whole number with thousands separators (e.g. 1,234).
 */
export function formatCount(count?: number | null): string {
  if (typeof count !== 'number' || Number.isNaN(count)) {
    return '0'
  }
  return countFormatter.format(count)
}

/**
 * Formats an ISO date string into a user-friendly readable date.
 */
export function formatDate(value?: string | null): string {
  if (!value) return 'Date unavailable'
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return 'Invalid date'
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(d)
  } catch {
    return 'Invalid date'
  }
}

/**
 * Formats an ISO date string with time (e.g. Oct 5, 2026, 10:30 AM).
 */
export function formatDateTime(value?: string | null): string {
  if (!value) return 'Date unavailable'
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return 'Invalid date'
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  } catch {
    return 'Invalid date'
  }
}

/**
 * Converts enum status keys into clean, capitalized display labels.
 */
export function formatStatus(status?: string | null): string {
  if (!status) return ''
  return status.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
