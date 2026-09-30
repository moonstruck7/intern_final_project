import { Router } from 'express'
import { isValidObjectId } from 'mongoose'
import { z } from 'zod'
import { Appointment, appointmentStatuses } from './model.js'
import { validateAppointment } from './service.js'
import { requireAuthentication, requirePermissions } from '../middleware/auth.js'
import { HttpError } from '../shared/errors.js'

const id = z.string().regex(/^[a-f\d]{24}$/i)
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
const date = z.string().date()
const body = z.object({ customerId: id, serviceId: id, staffId: id, date, startTime: time, status: z.enum(appointmentStatuses).optional() })
const editable = body.partial().omit({ status: true }).extend({ status: z.enum(appointmentStatuses).optional() })

export const appointmentRouter = Router()
appointmentRouter.use(requireAuthentication)
appointmentRouter.post('/', requirePermissions('appointments.manage'), async (request, response, next) => { try { const input = body.parse(request.body); const endTime = await validateAppointment(input); response.status(201).json({ data: await Appointment.create({ ...input, endTime }) }) } catch (error) { next(error) } })
appointmentRouter.get('/', requirePermissions('appointments.manage'), async (request, response, next) => { try { const query = z.object({ date: date.optional(), startDate: date.optional(), endDate: date.optional(), staffId: id.optional(), customerId: id.optional(), serviceId: id.optional(), status: z.enum(appointmentStatuses).optional(), page: z.coerce.number().min(1).default(1), limit: z.coerce.number().min(1).max(100).default(20) }).parse(request.query); const filter: any = {}; for (const key of ['staffId', 'customerId', 'serviceId', 'status'] as const) if (query[key]) filter[key] = query[key]; if (query.date) filter.date = query.date; else if (query.startDate || query.endDate) filter.date = { $gte: query.startDate, $lte: query.endDate }; const [data, total] = await Promise.all([Appointment.find(filter).sort({ date: 1, startTime: 1 }).skip((query.page - 1) * query.limit).limit(query.limit), Appointment.countDocuments(filter)]); response.json({ data, pagination: { page: query.page, limit: query.limit, total } }) } catch (error) { next(error) } })
appointmentRouter.get('/queue/today', requirePermissions('queue.manage'), async (_request, response, next) => { try { response.json({ data: await Appointment.find({ date: new Date().toISOString().slice(0, 10), status: { $in: ['scheduled', 'arrived', 'in_progress'] } }).sort({ startTime: 1 }) }) } catch (error) { next(error) } })
appointmentRouter.get('/:id', requirePermissions('appointments.manage'), async (request, response, next) => { try { if (!isValidObjectId(request.params.id)) throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid identifier.'); const data = await Appointment.findById(request.params.id); if (!data) throw new HttpError(404, 'NOT_FOUND', 'Appointment not found.'); response.json({ data }) } catch (error) { next(error) } })
appointmentRouter.patch('/:id', requirePermissions('appointments.manage'), async (request, response, next) => { try { if (!isValidObjectId(request.params.id)) throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid identifier.'); const current: any = await Appointment.findById(request.params.id); if (!current) throw new HttpError(404, 'NOT_FOUND', 'Appointment not found.'); if (['completed', 'cancelled', 'no_show'].includes(current.status)) throw new HttpError(400, 'VALIDATION_ERROR', 'This appointment cannot be changed.'); const input = editable.parse(request.body); const endTime = await validateAppointment({ ...current.toObject(), ...input }, String(current._id)); const data = await Appointment.findByIdAndUpdate(request.params.id, { ...input, endTime }, { new: true }); response.json({ data }) } catch (error) { next(error) } })
