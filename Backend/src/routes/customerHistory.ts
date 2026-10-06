import { Router } from 'express'
import { isValidObjectId } from 'mongoose'
import { User } from '../auth/User.js'
import { requireAuthentication, requirePermissions } from '../middleware/auth.js'
import { Appointment } from '../appointments/model.js'
import { Invoice, Payment } from '../billing/model.js'
import { Customer, Service, Staff } from '../domains/models.js'
import { HttpError } from '../shared/errors.js'

/**
 * Salon-side CRM history. This remains a read model over canonical records;
 * appointments, invoices, and payments are never copied into Customer.
 */
export const customerHistoryRouter = Router()

customerHistoryRouter.use(requireAuthentication, requirePermissions('customers.manage'))

customerHistoryRouter.get('/:id/history', async (request, response, next) => {
  try {
    if (!isValidObjectId(request.params.id)) throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid identifier.')

    const customerId = request.params.id
    const [customer, account, appointments, invoices] = await Promise.all([
      Customer.findById(customerId),
      User.findOne({ customerId }).select('_id loginIdentifier isActive roles customerId'),
      Appointment.find({ customerId }).sort({ date: -1, startTime: -1 }).limit(100),
      Invoice.find({ customerId }).sort({ _id: -1 }).limit(100),
    ])

    if (!customer) throw new HttpError(404, 'NOT_FOUND', 'Customer not found.')

    const [payments, services, staff] = await Promise.all([
      Payment.find({ invoiceId: { $in: invoices.map((invoice) => invoice._id) } }).sort({ _id: -1 }),
      Service.find({ _id: { $in: appointments.map((appointment) => appointment.serviceId) } }).select('_id name'),
      Staff.find({ _id: { $in: appointments.map((appointment) => appointment.staffId) } }).select('_id displayName designation'),
    ])

    response.json({
      data: {
        customer,
        account: account ? { id: String(account._id), loginIdentifier: account.loginIdentifier, isActive: account.isActive, roles: account.roles, customerId: String(customer._id) } : null,
        appointments,
        services,
        staff,
        invoices: invoices.map((invoice) => ({ ...invoice.toObject(), payments: payments.filter((payment) => String(payment.invoiceId) === String(invoice._id)) })),
      },
    })
  } catch (error) {
    next(error)
  }
})
