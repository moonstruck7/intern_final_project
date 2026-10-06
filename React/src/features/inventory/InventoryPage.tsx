import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { ApiError } from '../../shared/api/ApiError'
import { EmptyState, ErrorState, LoadingState } from '../../shared/components/AsyncStates'
import { formatCurrency, formatDateTime, formatStatus } from '../../shared/formatters'
import {
  createProduct,
  getAllTransactions,
  getProductTransactions,
  getProducts,
  recordStockMovement,
  updateProduct,
  type CreateProductInput,
  type ProductFilters,
  type ProductRecord,
  type ProductStatus,
  type StockMovementInput,
  type StockMovementType,
  type StockTransactionRecord,
  type UpdateProductInput,
} from './inventoryApi'

type TabMode = 'products' | 'low_stock' | 'transactions'

function messageFor(error: unknown) {
  if (error instanceof ApiError) {
    const details = error.details as { error?: { message?: unknown } } | undefined
    const message = details?.error?.message
    if (typeof message === 'string' && message.trim()) return message
    if (error.status === 403) return 'You do not have permission to manage inventory.'
  }
  return 'We couldn’t complete this inventory action. Please try again.'
}

export function InventoryPage() {
  const { session } = useAuth()
  const [tab, setTab] = useState<TabMode>('products')
  const [products, setProducts] = useState<ProductRecord[]>([])
  const [transactions, setTransactions] = useState<StockTransactionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [success, setSuccess] = useState<string>()

  // Filtering
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProductStatus | ''>('')
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<string>('')

  // Product Master Editor state
  const [editingProduct, setEditingProduct] = useState<ProductRecord | 'create'>()
  const [productForm, setProductForm] = useState<{
    name: string
    sku: string
    priceMajor: string
    lowStockThreshold: string
    status: ProductStatus
  }>({
    name: '',
    sku: '',
    priceMajor: '',
    lowStockThreshold: '',
    status: 'active',
  })
  const [savingProduct, setSavingProduct] = useState(false)
  const [productFormError, setProductFormError] = useState<string>()

  // Stock Movement Dialog state
  const [stockMovementModal, setStockMovementModal] = useState<{
    productId: string
    type: StockMovementType
    quantity: string
    reason: string
  }>()
  const [savingMovement, setSavingMovement] = useState(false)
  const [movementError, setMovementError] = useState<string>()

  const productMap = useMemo(() => new Map(products.map((item) => [item._id, item])), [products])

  const loadProducts = useCallback(async () => {
    if (!session) return
    setLoading(true)
    setError(undefined)
    try {
      const filters: ProductFilters = {}
      if (statusFilter) filters.status = statusFilter
      if (search.trim()) filters.search = search.trim()
      if (tab === 'low_stock') filters.lowStock = 'true'

      const response = await getProducts(session.accessToken, filters)
      setProducts(response.data)
    } catch (cause) {
      setError(messageFor(cause))
    } finally {
      setLoading(false)
    }
  }, [search, session, statusFilter, tab])

  const loadTransactions = useCallback(async () => {
    if (!session) return
    setLoading(true)
    setError(undefined)
    try {
      if (selectedProductForHistory) {
        const response = await getProductTransactions(session.accessToken, selectedProductForHistory)
        setTransactions(response.data)
      } else {
        const response = await getAllTransactions(session.accessToken)
        setTransactions(response.data)
      }
    } catch (cause) {
      setError(messageFor(cause))
    } finally {
      setLoading(false)
    }
  }, [selectedProductForHistory, session])

  useEffect(() => {
    if (tab === 'transactions') {
      void loadTransactions()
    } else {
      void loadProducts()
    }
  }, [loadProducts, loadTransactions, tab])

  // Open Create Product
  function openCreateProduct() {
    setProductForm({
      name: '',
      sku: '',
      priceMajor: '',
      lowStockThreshold: '5',
      status: 'active',
    })
    setProductFormError(undefined)
    setEditingProduct('create')
  }

  // Open Edit Product
  function openEditProduct(product: ProductRecord) {
    setProductForm({
      name: product.name,
      sku: product.sku,
      priceMajor: (product.sellingPriceMinor / 100).toFixed(2),
      lowStockThreshold: product.lowStockThreshold !== undefined ? String(product.lowStockThreshold) : '',
      status: product.status,
    })
    setProductFormError(undefined)
    setEditingProduct(product)
  }

  // Open Stock Movement
  function openStockMovement(productId?: string) {
    const defaultProduct = productId ?? (products.length > 0 ? products[0]._id : '')
    setStockMovementModal({
      productId: defaultProduct,
      type: 'stock_in',
      quantity: '1',
      reason: '',
    })
    setMovementError(undefined)
  }

  // Submit Product Form
  async function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) return

    const priceNumber = Number.parseFloat(productForm.priceMajor)
    if (Number.isNaN(priceNumber) || priceNumber < 0) {
      setProductFormError('Please enter a valid non-negative selling price.')
      return
    }

    const sellingPriceMinor = Math.round(priceNumber * 100)
    const thresholdNumber = productForm.lowStockThreshold.trim()
      ? Number.parseInt(productForm.lowStockThreshold, 10)
      : undefined

    if (thresholdNumber !== undefined && (Number.isNaN(thresholdNumber) || thresholdNumber < 0)) {
      setProductFormError('Low-stock threshold must be a non-negative whole number.')
      return
    }

    setSavingProduct(true)
    setProductFormError(undefined)
    setSuccess(undefined)

    try {
      if (editingProduct === 'create') {
        const payload: CreateProductInput = {
          name: productForm.name.trim(),
          sku: productForm.sku.trim(),
          sellingPriceMinor,
          lowStockThreshold: thresholdNumber,
          status: productForm.status,
        }
        await createProduct(session.accessToken, payload)
        setSuccess('Product created successfully.')
      } else if (editingProduct) {
        const payload: UpdateProductInput = {
          name: productForm.name.trim(),
          sku: productForm.sku.trim(),
          sellingPriceMinor,
          lowStockThreshold: thresholdNumber,
          status: productForm.status,
        }
        await updateProduct(session.accessToken, editingProduct._id, payload)
        setSuccess('Product updated successfully.')
      }
      setEditingProduct(undefined)
      await loadProducts()
    } catch (cause) {
      setProductFormError(messageFor(cause))
    } finally {
      setSavingProduct(false)
    }
  }

  // Submit Stock Movement
  async function submitStockMovement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session || !stockMovementModal) return

    const qty = Number.parseInt(stockMovementModal.quantity, 10)
    if (Number.isNaN(qty) || qty <= 0) {
      setMovementError('Please enter a positive whole quantity.')
      return
    }

    const targetProduct = productMap.get(stockMovementModal.productId)
    if (!targetProduct) {
      setMovementError('Please select a product.')
      return
    }

    if (stockMovementModal.type === 'stock_out' && targetProduct.currentStock - qty < 0) {
      setMovementError(`Cannot remove ${qty} units. Current stock is ${targetProduct.currentStock}.`)
      return
    }

    setSavingMovement(true)
    setMovementError(undefined)
    setSuccess(undefined)

    try {
      const payload: StockMovementInput = {
        type: stockMovementModal.type,
        quantity: qty,
        reason: stockMovementModal.reason.trim() || undefined,
      }
      await recordStockMovement(session.accessToken, stockMovementModal.productId, payload)
      setSuccess(`Stock movement recorded for ${targetProduct.name}.`)
      setStockMovementModal(undefined)
      await loadProducts()
    } catch (cause) {
      setMovementError(messageFor(cause))
    } finally {
      setSavingMovement(false)
    }
  }

  const lowStockCount = useMemo(
    () => products.filter((p) => p.lowStockThreshold !== undefined && p.currentStock <= p.lowStockThreshold).length,
    [products],
  )

  const movementProduct = stockMovementModal ? productMap.get(stockMovementModal.productId) : undefined
  const projectedStock = useMemo(() => {
    if (!movementProduct || !stockMovementModal) return null
    const qty = Number.parseInt(stockMovementModal.quantity, 10) || 0
    if (stockMovementModal.type === 'stock_in') return movementProduct.currentStock + qty
    if (stockMovementModal.type === 'stock_out') return movementProduct.currentStock - qty
    return movementProduct.currentStock + qty
  }, [movementProduct, stockMovementModal])

  return (
    <div className="inventory-workspace">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Inventory control</p>
          <h1>Stock & Products</h1>
          <p className="page-intro">Track salon products, stock levels, adjustments, and movement history.</p>
        </div>
        <div className="page-heading-actions">
          <button className="button button-secondary" type="button" onClick={() => openStockMovement()}>
            Record movement
          </button>
          <button className="button" type="button" onClick={openCreateProduct}>
            New product
          </button>
        </div>
      </div>

      <div className="decision-callout" role="note">
        <strong>Inventory scope:</strong> Product stock and stock movements are available here. Supplier tracking, purchase-cost accounting, and automatic service-product deduction are pending a team decision.
      </div>

      {success && (
        <p className="form-success" role="status">
          {success}
        </p>
      )}

      {error ? (
        <ErrorState
          title="Inventory is unavailable"
          description={error}
          action={
            <button className="button" type="button" onClick={() => void loadProducts()}>
              Try again
            </button>
          }
        />
      ) : (
        <section className="inventory-section" aria-label="Inventory management">
          <div className="inventory-tabs" role="tablist" aria-label="Inventory sections">
            <button
              className={tab === 'products' ? 'button' : 'button button-secondary'}
              type="button"
              role="tab"
              aria-selected={tab === 'products'}
              onClick={() => {
                setTab('products')
                setSelectedProductForHistory('')
              }}
            >
              All products ({products.length})
            </button>
            <button
              className={tab === 'low_stock' ? 'button' : 'button button-secondary'}
              type="button"
              role="tab"
              aria-selected={tab === 'low_stock'}
              onClick={() => {
                setTab('low_stock')
                setSelectedProductForHistory('')
              }}
            >
              Low stock ({lowStockCount})
            </button>
            <button
              className={tab === 'transactions' ? 'button' : 'button button-secondary'}
              type="button"
              role="tab"
              aria-selected={tab === 'transactions'}
              onClick={() => setTab('transactions')}
            >
              Movement history
            </button>
          </div>

          {tab !== 'transactions' ? (
            <>
              <div className="inventory-toolbar">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    void loadProducts()
                  }}
                >
                  <input
                    aria-label="Search products by name or SKU"
                    type="search"
                    placeholder="Search by name or SKU…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <button className="button button-secondary" type="submit">
                    Search
                  </button>
                </form>
                <label>
                  Status
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as ProductStatus | '')}
                  >
                    <option value="">All statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
              </div>

              {loading ? (
                <LoadingState label="Loading products…" />
              ) : !products.length ? (
                <EmptyState
                  title={tab === 'low_stock' ? 'No low-stock items' : 'No products found'}
                  description={
                    tab === 'low_stock'
                      ? 'All inventory items are currently above their configured threshold.'
                      : 'Add products to start tracking your salon inventory.'
                  }
                />
              ) : (
                <div className="inventory-table-wrap">
                  <table className="data-table inventory-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>SKU</th>
                        <th>Selling price</th>
                        <th>Current stock</th>
                        <th>Low threshold</th>
                        <th>Status</th>
                        <th>
                          <span className="visually-hidden">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((item) => {
                        const isLow = item.lowStockThreshold !== undefined && item.currentStock <= item.lowStockThreshold
                        return (
                          <tr key={item._id}>
                            <td>
                              <strong>{item.name}</strong>
                            </td>
                            <td>
                              <span className="sku-badge">{item.sku}</span>
                            </td>
                            <td>{formatCurrency(item.sellingPriceMinor)}</td>
                            <td>
                              <span className={`stock-tag ${isLow ? 'stock-low' : ''}`}>
                                {item.currentStock} units
                                {isLow && <span className="stock-warning-badge">Low</span>}
                              </span>
                            </td>
                            <td>{item.lowStockThreshold !== undefined ? `${item.lowStockThreshold} units` : '—'}</td>
                            <td>
                              <span className={`status-badge status-${item.status}`}>{formatStatus(item.status)}</span>
                            </td>
                            <td>
                              <div className="inventory-row-actions">
                                <button
                                  className="button button-secondary"
                                  type="button"
                                  onClick={() => openStockMovement(item._id)}
                                >
                                  Movement
                                </button>
                                <button
                                  className="button button-secondary"
                                  type="button"
                                  onClick={() => openEditProduct(item)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="button button-quiet"
                                  type="button"
                                  onClick={() => {
                                    setSelectedProductForHistory(item._id)
                                    setTab('transactions')
                                  }}
                                >
                                  History
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="inventory-toolbar">
                <label>
                  Filter by product
                  <select
                    value={selectedProductForHistory}
                    onChange={(e) => setSelectedProductForHistory(e.target.value)}
                  >
                    <option value="">All products</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </label>
                <button className="button button-quiet" type="button" onClick={() => void loadTransactions()}>
                  Refresh
                </button>
              </div>

              {loading ? (
                <LoadingState label="Loading transaction history…" />
              ) : !transactions.length ? (
                <EmptyState
                  title="No stock movements recorded"
                  description="Transactions will appear when stock-in, stock-out, or adjustments are logged."
                />
              ) : (
                <div className="transaction-table-wrap">
                  <table className="data-table transaction-table">
                    <thead>
                      <tr>
                        <th>Date & time</th>
                        <th>Product</th>
                        <th>Movement type</th>
                        <th>Quantity delta</th>
                        <th>Reason / Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => {
                        const product = productMap.get(tx.productId)
                        const isPositive = tx.quantity > 0
                        const typeClass =
                          tx.type === 'stock_in' ? 'tx-in' : tx.type === 'stock_out' ? 'tx-out' : 'tx-adj'
                        return (
                          <tr key={tx._id}>
                            <td>{formatDateTime(tx.createdAt)}</td>
                            <td>
                              <strong>{product?.name ?? 'Product reference'}</strong>
                              {product && <span className="sku-badge" style={{ marginLeft: '.4rem' }}>{product.sku}</span>}
                            </td>
                            <td>
                              <span className={`status-badge ${typeClass}`}>
                                {tx.type.replaceAll('_', ' ')}
                              </span>
                            </td>
                            <td>
                              <strong className={typeClass}>
                                {isPositive ? `+${tx.quantity}` : tx.quantity} units
                              </strong>
                            </td>
                            <td>{tx.reason || '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* Product Master Editor Modal */}
      {editingProduct && (
        <section
          className="inventory-editor"
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-editor-title"
        >
          <div className="appointment-editor-header">
            <div>
              <p className="eyebrow">{editingProduct === 'create' ? 'New product' : 'Edit product'}</p>
              <h2 id="product-editor-title">
                {editingProduct === 'create' ? 'Create inventory product' : `Update ${editingProduct.name}`}
              </h2>
              <p>Product records persist to the shared database and integrate with salon reports.</p>
            </div>
            <button className="button button-quiet" type="button" onClick={() => setEditingProduct(undefined)}>
              Close
            </button>
          </div>

          <form onSubmit={submitProduct}>
            <div className="form-grid">
              <label>
                Product name *
                <input
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm((curr) => ({ ...curr, name: e.target.value }))}
                  disabled={savingProduct}
                />
              </label>
              <label>
                SKU / Code *
                <input
                  required
                  value={productForm.sku}
                  onChange={(e) => setProductForm((curr) => ({ ...curr, sku: e.target.value }))}
                  disabled={savingProduct}
                />
              </label>
              <label>
                Selling price ($) *
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={productForm.priceMajor}
                  onChange={(e) => setProductForm((curr) => ({ ...curr, priceMajor: e.target.value }))}
                  disabled={savingProduct}
                />
              </label>
              <label>
                Low-stock threshold
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="5"
                  value={productForm.lowStockThreshold}
                  onChange={(e) => setProductForm((curr) => ({ ...curr, lowStockThreshold: e.target.value }))}
                  disabled={savingProduct}
                />
              </label>
              <label>
                Status
                <select
                  value={productForm.status}
                  onChange={(e) => setProductForm((curr) => ({ ...curr, status: e.target.value as ProductStatus }))}
                  disabled={savingProduct}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </div>

            {productFormError && (
              <p className="form-error" role="alert">
                {productFormError}
              </p>
            )}

            <div className="form-actions">
              <button className="button" type="submit" disabled={savingProduct}>
                {savingProduct ? 'Saving…' : editingProduct === 'create' ? 'Create product' : 'Save changes'}
              </button>
              <button
                className="button button-secondary"
                type="button"
                disabled={savingProduct}
                onClick={() => setEditingProduct(undefined)}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Stock Movement Modal */}
      {stockMovementModal && (
        <section
          className="stock-movement-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="movement-dialog-title"
        >
          <div className="appointment-editor-header">
            <div>
              <p className="eyebrow">Stock control</p>
              <h2 id="movement-dialog-title">Record stock movement</h2>
              <p>Movements update current stock and append to the canonical transaction log.</p>
            </div>
            <button className="button button-quiet" type="button" onClick={() => setStockMovementModal(undefined)}>
              Close
            </button>
          </div>

          <form onSubmit={submitStockMovement}>
            <div className="form-grid">
              <label>
                Product *
                <select
                  value={stockMovementModal.productId}
                  onChange={(e) =>
                    setStockMovementModal((curr) => (curr ? { ...curr, productId: e.target.value } : undefined))
                  }
                  disabled={savingMovement}
                >
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.sku}) — Current: {p.currentStock} units
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Movement type *
                <select
                  value={stockMovementModal.type}
                  onChange={(e) =>
                    setStockMovementModal((curr) =>
                      curr ? { ...curr, type: e.target.value as StockMovementType } : undefined,
                    )
                  }
                  disabled={savingMovement}
                >
                  <option value="stock_in">Stock In (Receiving)</option>
                  <option value="stock_out">Stock Out (Usage / Dispensing)</option>
                  <option value="adjustment">Adjustment (Stock count / Correction)</option>
                </select>
              </label>
              <label>
                Quantity (units) *
                <input
                  required
                  type="number"
                  min="1"
                  step="1"
                  value={stockMovementModal.quantity}
                  onChange={(e) =>
                    setStockMovementModal((curr) => (curr ? { ...curr, quantity: e.target.value } : undefined))
                  }
                  disabled={savingMovement}
                />
              </label>
              <label>
                Reason / Reference
                <input
                  placeholder="e.g., Weekly replenishment, damage write-off…"
                  value={stockMovementModal.reason}
                  onChange={(e) =>
                    setStockMovementModal((curr) => (curr ? { ...curr, reason: e.target.value } : undefined))
                  }
                  disabled={savingMovement}
                />
              </label>
            </div>

            {movementProduct && projectedStock !== null && (
              <div className="stock-preview-box">
                <div>
                  Current stock: <strong>{movementProduct.currentStock} units</strong>
                </div>
                <div>
                  Projected stock after movement:{' '}
                  <strong className={projectedStock < 0 ? 'stock-low' : ''}>
                    {projectedStock} units
                  </strong>
                </div>
              </div>
            )}

            {movementError && (
              <p className="form-error" role="alert">
                {movementError}
              </p>
            )}

            <div className="form-actions">
              <button className="button" type="submit" disabled={savingMovement}>
                {savingMovement ? 'Recording…' : 'Record movement'}
              </button>
              <button
                className="button button-secondary"
                type="button"
                disabled={savingMovement}
                onClick={() => setStockMovementModal(undefined)}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  )
}
