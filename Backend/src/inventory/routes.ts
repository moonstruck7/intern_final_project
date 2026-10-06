import { Router } from 'express'
import { isValidObjectId } from 'mongoose'
import { z } from 'zod'
import { Product, StockTransaction } from './model.js'
import { requireAuthentication, requirePermissions } from '../middleware/auth.js'
import { HttpError } from '../shared/errors.js'

export const inventoryRouter = Router()
inventoryRouter.use(requireAuthentication, requirePermissions('platform.manage'))

const productSchema = z.object({
  name: z.string().trim().min(1),
  sku: z.string().trim().min(1),
  sellingPriceMinor: z.number().int().nonnegative(),
  lowStockThreshold: z.number().int().nonnegative().optional(),
  status: z.enum(['active', 'inactive']).optional(),
})

const stockMovementSchema = z.object({
  type: z.enum(['stock_in', 'stock_out', 'adjustment']),
  quantity: z.number().int().positive(),
  reason: z.string().trim().optional(),
})

inventoryRouter.post('/products', async (request, response, next) => {
  try {
    const input = productSchema.parse(request.body)
    const existing = await Product.findOne({ sku: input.sku })
    if (existing) throw new HttpError(400, 'VALIDATION_ERROR', 'A product with this SKU already exists.')
    const data = await Product.create(input)
    response.status(201).json({ data })
  } catch (error) {
    next(error)
  }
})

inventoryRouter.get('/products', async (request, response, next) => {
  try {
    const query = z.object({
      status: z.enum(['active', 'inactive']).optional(),
      search: z.string().optional(),
      lowStock: z.enum(['true', 'false']).optional(),
    }).parse(request.query)

    const filter: Record<string, unknown> = {}
    if (query.status) filter.status = query.status
    if (query.lowStock === 'true') {
      filter.$expr = { $lte: ['$currentStock', '$lowStockThreshold'] }
    }
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { sku: { $regex: query.search, $options: 'i' } },
      ]
    }

    const data = await Product.find(filter).sort({ name: 1 }).limit(100)
    response.json({ data })
  } catch (error) {
    next(error)
  }
})

inventoryRouter.get('/products/:id', async (request, response, next) => {
  try {
    if (!isValidObjectId(request.params.id)) throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid product identifier.')
    const data = await Product.findById(request.params.id)
    if (!data) throw new HttpError(404, 'NOT_FOUND', 'Product not found.')
    response.json({ data })
  } catch (error) {
    next(error)
  }
})

inventoryRouter.patch('/products/:id', async (request, response, next) => {
  try {
    if (!isValidObjectId(request.params.id)) throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid product identifier.')
    const input = productSchema.partial().parse(request.body)
    if (input.sku) {
      const existing = await Product.findOne({ sku: input.sku, _id: { $ne: request.params.id } })
      if (existing) throw new HttpError(400, 'VALIDATION_ERROR', 'A product with this SKU already exists.')
    }
    const data = await Product.findByIdAndUpdate(request.params.id, input, { new: true, runValidators: true })
    if (!data) throw new HttpError(404, 'NOT_FOUND', 'Product not found.')
    response.json({ data })
  } catch (error) {
    next(error)
  }
})

inventoryRouter.post('/products/:id/stock', async (request, response, next) => {
  try {
    if (!isValidObjectId(request.params.id)) throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid product identifier.')
    const movement = stockMovementSchema.parse(request.body)
    const productRecord = await Product.findById(request.params.id)
    if (!productRecord) throw new HttpError(404, 'NOT_FOUND', 'Product not found.')
    if (productRecord.status !== 'active') throw new HttpError(400, 'VALIDATION_ERROR', 'Product is inactive.')

    const delta = movement.type === 'stock_out' ? -movement.quantity : movement.quantity
    if (productRecord.currentStock + delta < 0) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Insufficient stock for this movement.')
    }

    productRecord.currentStock += delta
    await productRecord.save()

    const transaction = await StockTransaction.create({
      productId: productRecord._id,
      type: movement.type,
      quantity: delta,
      reason: movement.reason,
      actorId: request.auth?.userId,
    })

    response.status(201).json({ data: transaction, currentStock: productRecord.currentStock })
  } catch (error) {
    next(error)
  }
})

inventoryRouter.get('/products/:id/transactions', async (request, response, next) => {
  try {
    if (!isValidObjectId(request.params.id)) throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid product identifier.')
    const data = await StockTransaction.find({ productId: request.params.id }).sort({ createdAt: -1, _id: -1 }).limit(100)
    response.json({ data })
  } catch (error) {
    next(error)
  }
})

inventoryRouter.get('/transactions', async (_request, response, next) => {
  try {
    const data = await StockTransaction.find().sort({ createdAt: -1, _id: -1 }).limit(100)
    response.json({ data })
  } catch (error) {
    next(error)
  }
})
