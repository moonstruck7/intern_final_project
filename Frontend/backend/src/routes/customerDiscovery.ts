import { Router } from 'express'
import { isValidObjectId } from 'mongoose'
import { z } from 'zod'
import { User } from '../auth/User.js'
import { Availability, Staff } from '../domains/models.js'
import { requireAuthentication } from '../middleware/auth.js'
import { HttpError } from '../shared/errors.js'

const dateQuery = z.object({ date: z.string().date() })

/**
 * Customer-facing booking discovery is deliberately separate from the staff
 * administration APIs. A valid customer link is required even for read-only
 * discovery, so a token alone cannot select arbitrary operational resources.
 */
async function requireLinkedCustomer(request: any) {
  if (request.auth?.role !== 'customer') {
    throw new HttpError(403, 'FORBIDDEN', 'Customer access is required.')
  }
  if (!isValidObjectId(request.auth.userId)) {
    throw new HttpError(403, 'FORBIDDEN', 'Customer identity is not linked.')
  }
  const user: any = await User.findById(request.auth.userId)
  if (!user?.customerId) {
    throw new HttpError(403, 'FORBIDDEN', 'Customer identity is not linked.')
  }
}

export const customerDiscoveryRouter = Router()
customerDiscoveryRouter.use(requireAuthentication)

customerDiscoveryRouter.get('/staff', async (request, response, next) => {
  try {
    await requireLinkedCustomer(request)
    const data = await Staff.find({ status: 'active' })
      .sort({ displayName: 1 })
      .select('_id displayName designation')
    response.json({ data })
  } catch (error) {
    next(error)
  }
})

customerDiscoveryRouter.get('/staff/:staffId/availability', async (request, response, next) => {
  try {
    await requireLinkedCustomer(request)
    if (!isValidObjectId(request.params.staffId)) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid staff identifier.')
    }
    const { date } = dateQuery.parse(request.query)
    const staff = await Staff.findOne({ _id: request.params.staffId, status: 'active' })
    if (!staff) {
      throw new HttpError(404, 'NOT_FOUND', 'Staff is unavailable.')
    }
    const data = await Availability.find({
      staffId: staff._id,
      date,
      status: 'active',
    })
      .sort({ startTime: 1 })
      .select('_id staffId date startTime endTime')
    response.json({ data })
  } catch (error) {
    next(error)
  }
})
