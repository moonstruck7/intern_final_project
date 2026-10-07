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
  const availability = await Availability.findOne({ staffId: input.staffId, date: input.date, status: 'active' })
  if (!availability || minutes(input.startTime) < minutes(availability.startTime) || minutes(endTime) > minutes(availability.endTime)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Staff is unavailable at this time.')
  }
  const conflicts = await Appointment.find({ staffId: input.staffId, date: input.date, status: { $nin: ['cancelled', 'no_show'] }, _id: { $ne: exclude } })
  if (conflicts.some((appointment: any) => minutes(input.startTime) < minutes(appointment.endTime) && minutes(endTime) > minutes(appointment.startTime))) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Staff has a conflicting appointment.')
  }
  return endTime
}
