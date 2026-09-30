/**
 * Canonical staff reference for appointment scheduling. The shared backend is
 * the source of truth; A3 must not introduce another staff dataset.
 */
export type StaffId = string | number

export interface StaffReference {
  id: StaffId
  displayName?: string
  designation?: unknown
  status?: unknown
}

/** API-backed staff profile boundary; its fields await the approved schema. */
export type StaffProfile = StaffReference

/**
 * A3 will use this when the backend publishes its availability request and
 * response contract. No shift, timezone, or time-range values are assumed.
 */
export interface StaffAvailabilityReference {
  staffId: StaffId
}

export type StaffArea = 'staff' | 'scheduling' | 'attendance' | 'leave'
