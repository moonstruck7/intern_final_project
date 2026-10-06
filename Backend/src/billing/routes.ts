import { Router } from 'express'
import { isValidObjectId } from 'mongoose'
import { z } from 'zod'
import { Invoice, Payment } from './model.js'
import { Appointment } from '../appointments/model.js'
import { Customer, Service } from '../domains/models.js'
import { requireAuthentication, requirePermissions } from '../middleware/auth.js'
import { HttpError } from '../shared/errors.js'

const id = z.string().regex(/^[a-f\d]{24}$/i)
const create = z.object({ appointmentId: id.optional(), customerId: id.optional(), serviceIds: z.array(id).optional() })

type InvoiceDocument = { _id: unknown; customerId: unknown; appointmentId?: unknown; lineItems: Array<{ serviceId?: unknown }>; toObject: () => Record<string, unknown> }

async function invoiceReadModel(invoices: InvoiceDocument[]) {
  const [payments, customers, appointments, services] = await Promise.all([
    (Payment as any).find({ invoiceId: { $in: invoices.map((invoice) => invoice._id) } }).sort({ _id: -1 }) as Promise<any[]>,
    Customer.find({ _id: { $in: invoices.map((invoice) => invoice.customerId) } }).select('_id displayName'),
    Appointment.find({ _id: { $in: invoices.flatMap((invoice) => invoice.appointmentId ? [invoice.appointmentId] : []) } }).select('_id customerId serviceId staffId date startTime endTime status'),
    Service.find({ _id: { $in: invoices.flatMap((invoice) => invoice.lineItems.flatMap((item) => item.serviceId ? [item.serviceId] : [])) } }).select('_id name'),
  ])
  const customerById = new Map(customers.map((customer) => [String(customer._id), { _id: String(customer._id), displayName: customer.displayName }]))
  const appointmentById = new Map(appointments.map((appointment) => [String(appointment._id), appointment.toObject()]))
  const serviceById = new Map(services.map((service) => [String(service._id), { _id: String(service._id), name: service.name }]))

  return invoices.map((invoice) => {
    const raw = invoice.toObject()
    const lineItems = (raw.lineItems as any[] ?? []).map((item) => ({
      ...item,
      service: item.serviceId ? serviceById.get(String(item.serviceId)) ?? null : null,
    }))
    return {
      ...raw,
      customer: customerById.get(String(invoice.customerId)) ?? null,
      appointment: invoice.appointmentId ? appointmentById.get(String(invoice.appointmentId)) ?? null : null,
      lineItems,
      payments: payments.filter((payment) => String(payment.invoiceId) === String(invoice._id)).map((payment) => (typeof payment.toObject === 'function' ? payment.toObject() : payment)),
    }
  })
}

export const billingRouter = Router()
billingRouter.use(requireAuthentication, requirePermissions('platform.manage'))

billingRouter.post('/invoices', async (request, response, next) => {
  try {
    const parsed = create.safeParse(request.body)
    if (!parsed.success) throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid request.')
    const input = parsed.data
    let customerId = input.customerId
    let serviceIds = input.serviceIds ?? []
    if (input.appointmentId) {
      const appointment: any = await Appointment.findById(input.appointmentId)
      if (!appointment) throw new HttpError(400, 'VALIDATION_ERROR', 'Appointment unavailable.')
      customerId = String(appointment.customerId)
      serviceIds = [String(appointment.serviceId)]
    }
    if (!customerId || !serviceIds.length) throw new HttpError(400, 'VALIDATION_ERROR', 'Invoice source is required.')
    if (!await Customer.findById(customerId)) throw new HttpError(400, 'VALIDATION_ERROR', 'Customer unavailable.')
    const services = await Service.find({ _id: { $in: serviceIds }, status: 'active' })
    if (services.length !== serviceIds.length) throw new HttpError(400, 'VALIDATION_ERROR', 'Service unavailable.')
    const lineItems = services.map((service: any) => ({ serviceId: service._id, quantity: 1, unitPriceMinor: Math.round(service.price * 100), totalMinor: Math.round(service.price * 100) }))
    const totalMinor = lineItems.reduce((total: number, item: { totalMinor: number }) => total + item.totalMinor, 0)
    response.status(201).json({ data: await Invoice.create({ invoiceNumber: `INV-${crypto.randomUUID()}`, customerId, appointmentId: input.appointmentId, lineItems, subtotalMinor: totalMinor, totalMinor, status: 'issued' }) })
  } catch (error) { next(error) }
})

billingRouter.get('/invoices', async (_request, response, next) => {
  try {
    const invoices = await Invoice.find().sort({ _id: -1 }).limit(100)
    response.json({ data: await invoiceReadModel(invoices as unknown as InvoiceDocument[]) })
  } catch (error) { next(error) }
})

billingRouter.get('/invoices/:id', async (request, response, next) => {
  try {
    if (!isValidObjectId(request.params.id)) throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid invoice identifier.')
    const invoice = await Invoice.findById(request.params.id)
    if (!invoice) throw new HttpError(404, 'NOT_FOUND', 'Invoice not found.')
    response.json({ data: (await invoiceReadModel([invoice as unknown as InvoiceDocument]))[0] })
  } catch (error) { next(error) }
})

billingRouter.get('/invoices/:id/payments', async (request, response, next) => {
  try {
    if (!isValidObjectId(request.params.id)) throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid invoice identifier.')
    response.json({ data: await Payment.find({ invoiceId: request.params.id }).sort({ _id: -1 }) })
  } catch (error) { next(error) }
})

billingRouter.post('/invoices/:id/payments', async (request, response, next) => {
  try {
    if (!isValidObjectId(request.params.id)) throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid invoice identifier.')
    const parsed = z.object({ amountMinor: z.number().int().positive(), method: z.enum(['cash', 'card', 'upi', 'other']) }).safeParse(request.body)
    if (!parsed.success) throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid request.')
    const input = parsed.data
    const invoice: any = await Invoice.findById(request.params.id)
    if (!invoice || invoice.status === 'cancelled') throw new HttpError(400, 'VALIDATION_ERROR', 'Invoice unavailable.')
    const paid = (await Payment.aggregate([{ $match: { invoiceId: invoice._id } }, { $group: { _id: null, total: { $sum: '$amountMinor' } } }]))[0]?.total ?? 0
    if (paid + input.amountMinor > invoice.totalMinor) throw new HttpError(400, 'VALIDATION_ERROR', 'Payment exceeds balance.')
    const payment = await Payment.create({ invoiceId: invoice._id, ...input })
    if (paid + input.amountMinor === invoice.totalMinor) { invoice.status = 'paid'; await invoice.save() }
    response.status(201).json({ data: payment })
  } catch (error) { next(error) }
})
