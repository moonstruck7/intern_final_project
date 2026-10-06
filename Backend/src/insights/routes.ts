import { Router } from 'express'
import { isValidObjectId } from 'mongoose'
import { z } from 'zod'
import { requireAuthentication, requirePermissions } from '../middleware/auth.js'
import { Invoice } from '../billing/model.js'
import { Appointment } from '../appointments/model.js'
import { Product, StockTransaction } from '../inventory/model.js'
import { Customer, Service, Staff } from '../domains/models.js'
import { Campaign, Notification } from './model.js'
import { HttpError } from '../shared/errors.js'

export const insightsRouter = Router()
insightsRouter.use(requireAuthentication)

const date = z.string().date()

const campaignSchema = z.object({
  name: z.string().trim().min(1),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  audienceNote: z.string().trim().optional(),
})

const notificationSchema = z.object({
  title: z.string().trim().min(1),
  body: z.string().trim().min(1),
  recipientUserId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  referenceType: z.string().trim().optional(),
  referenceId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
})

insightsRouter.get('/analytics/summary', requirePermissions('reports.read'), async (_request, response, next) => {
  try {
    const [invoiceAgg, appointmentCount, lowStockCount] = await Promise.all([
      Invoice.aggregate([
        {
          $group: {
            _id: null,
            totalBilledMinor: { $sum: '$totalMinor' },
            invoiceCount: { $sum: 1 },
          },
        },
      ]),
      Appointment.countDocuments(),
      Product.countDocuments({ $expr: { $lte: ['$currentStock', '$lowStockThreshold'] } }),
    ])

    const totalBilledMinor = invoiceAgg[0]?.totalBilledMinor ?? 0
    const invoiceCount = invoiceAgg[0]?.invoiceCount ?? 0

    response.json({
      data: {
        totalBilledMinor,
        invoiceCount,
        paymentRevenueMinor: totalBilledMinor,
        paymentCount: invoiceCount,
        appointmentCount,
        lowStockCount,
      },
    })
  } catch (error) {
    next(error)
  }
})

insightsRouter.get('/reports/invoices', requirePermissions('reports.read'), async (_request, response, next) => {
  try {
    const data = await Invoice.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalMinor: { $sum: '$totalMinor' },
        },
      },
      { $sort: { _id: 1 } },
    ])
    response.json({ data })
  } catch (error) {
    next(error)
  }
})

insightsRouter.get('/reports/operations', requirePermissions('reports.read'), async (_request, response, next) => {
  try {
    const [customers, services, staff, appointments, stock] = await Promise.all([
      Customer.countDocuments(),
      Service.countDocuments(),
      Staff.countDocuments(),
      Appointment.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      StockTransaction.aggregate([
        { $group: { _id: '$type', quantity: { $sum: '$quantity' } } },
        { $sort: { _id: 1 } },
      ]),
    ])
    response.json({ data: { customers, services, staff, appointments, stock } })
  } catch (error) {
    next(error)
  }
})

insightsRouter.get('/insights/trends', requirePermissions('reports.read'), async (request, response, next) => {
  try {
    const query = z.object({
      startDate: date.optional(),
      endDate: date.optional(),
    }).parse(request.query)

    if (query.startDate && query.endDate && query.startDate > query.endDate) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid date range: startDate must be before or equal to endDate.')
    }

    const filter: Record<string, unknown> = {}
    if (query.startDate && query.endDate) {
      filter.date = { $gte: query.startDate, $lte: query.endDate }
    } else if (query.startDate) {
      filter.date = { $gte: query.startDate }
    } else if (query.endDate) {
      filter.date = { $lte: query.endDate }
    }

    const [appointments, serviceDemand, lowStock] = await Promise.all([
      Appointment.aggregate([
        { $match: filter },
        { $group: { _id: '$date', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Appointment.aggregate([
        { $match: filter },
        { $group: { _id: '$serviceId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      Product.find({ $expr: { $lte: ['$currentStock', '$lowStockThreshold'] } }).select('name sku currentStock lowStockThreshold'),
    ])

    response.json({ data: { appointments, serviceDemand, lowStock } })
  } catch (error) {
    next(error)
  }
})

insightsRouter.get('/marketing/campaigns', requirePermissions('marketing.manage'), async (_request, response, next) => {
  try {
    const data = await Campaign.find().sort({ createdAt: -1, _id: -1 }).limit(100)
    response.json({ data })
  } catch (error) {
    next(error)
  }
})

insightsRouter.post('/marketing/campaigns', requirePermissions('marketing.manage'), async (request, response, next) => {
  try {
    const input = campaignSchema.parse(request.body)
    const data = await Campaign.create(input)
    response.status(201).json({ data })
  } catch (error) {
    next(error)
  }
})

insightsRouter.patch('/marketing/campaigns/:id', requirePermissions('marketing.manage'), async (request, response, next) => {
  try {
    if (!isValidObjectId(request.params.id)) throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid campaign identifier.')
    const input = campaignSchema.partial().parse(request.body)
    const data = await Campaign.findByIdAndUpdate(request.params.id, input, { new: true, runValidators: true })
    if (!data) throw new HttpError(404, 'NOT_FOUND', 'Campaign not found.')
    response.json({ data })
  } catch (error) {
    next(error)
  }
})

insightsRouter.get('/notifications', requirePermissions('notifications.manage'), async (_request, response, next) => {
  try {
    const data = await Notification.find().sort({ createdAt: -1, _id: -1 }).limit(100)
    response.json({ data })
  } catch (error) {
    next(error)
  }
})

insightsRouter.post('/notifications', requirePermissions('notifications.manage'), async (request, response, next) => {
  try {
    const input = notificationSchema.parse(request.body)
    const data = await Notification.create(input)
    response.status(201).json({ data })
  } catch (error) {
    next(error)
  }
})

insightsRouter.patch('/notifications/:id/read', requirePermissions('notifications.manage'), async (request, response, next) => {
  try {
    if (!isValidObjectId(request.params.id)) throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid notification identifier.')
    const data = await Notification.findByIdAndUpdate(request.params.id, { readAt: new Date() }, { new: true })
    if (!data) throw new HttpError(404, 'NOT_FOUND', 'Notification not found.')
    response.json({ data })
  } catch (error) {
    next(error)
  }
})
