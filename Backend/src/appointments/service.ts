import { Appointment } from './model.js'
import { Availability, Customer, Service, Staff } from '../domains/models.js'
import { HttpError } from '../shared/errors.js'

const minutes = (value: string) => {
  const [hours, mins] = value.split(':').map(Number)
  return hours * 60 + mins
}

const formatTime = (value: number) => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`

/** Enforces the canonical appointment constraints and derives its end time. */
export async function validateAppointment(input: any, exclude?: string) {
  const [customer, service, staff] = await Promise.all([
    Customer.findById(input.customerId),
    Service.findById(input.serviceId),
    Staff.findById(input.staffId),
  ])
  if (!customer || customer.status !== 'active' || !service || service.status !== 'active' || !staff || staff.status !== 'active') {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Referenced record is unavailable.')
  }
  const endTime = formatTime(minutes(input.startTime) + service.durationMinutes)
  if (minutes(endTime) > 1440) throw new HttpError(400, 'VALIDATION_ERROR', 'Appointment exceeds the day.')
  const startMin = minutes(input.startTime)
  const endMin = minutes(endTime)
  const availabilities = await Availability.find({ staffId: input.staffId, date: input.date, status: 'active' })
  if (availabilities.length > 0) {
    // Merge contiguous/overlapping availability blocks for the staff on this date
    const sorted = [...availabilities].sort((a, b) => minutes(a.startTime) - minutes(b.startTime))
    const mergedBlocks: Array<{ start: number; end: number }> = []
    for (const a of sorted) {
      const s = minutes(a.startTime)
      const e = minutes(a.endTime)
      const last = mergedBlocks[mergedBlocks.length - 1]
      if (last && s <= last.end) {
        last.end = Math.max(last.end, e)
      } else {
        mergedBlocks.push({ start: s, end: e })
      }
    }

    const isAvailable = mergedBlocks.some(block => startMin >= block.start && endMin <= block.end)
    if (!isAvailable) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Staff is unavailable at this time.')
    }
  } else {
    // If no explicit slots exist on this date, verify within standard salon operating hours (09:00 - 20:00)
    if (startMin < minutes('09:00') || endMin > minutes('20:00')) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Staff is unavailable at this time.')
    }
  }
  const conflicts = await Appointment.find({ staffId: input.staffId, date: input.date, status: { $nin: ['cancelled', 'no_show'] }, _id: { $ne: exclude } })
  if (conflicts.some((appointment: any) => minutes(input.startTime) < minutes(appointment.endTime) && minutes(endTime) > minutes(appointment.startTime))) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Staff has a conflicting appointment.')
  }
  return endTime
}
