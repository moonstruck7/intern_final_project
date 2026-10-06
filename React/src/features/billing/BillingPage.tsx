import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { ApiError } from '../../shared/api/ApiError'
import { EmptyState, ErrorState, LoadingState } from '../../shared/components/AsyncStates'
import { formatCurrency, formatDate, formatStatus } from '../../shared/formatters'
import { createInvoice, getInvoice, getInvoices, getInvoiceSources, recordPayment, type InvoiceRecord, type InvoiceSourceOptions, type PaymentMethod } from './billingApi'

type InvoiceMode = 'appointment' | 'services'
const emptySources: InvoiceSourceOptions = { customers: [], services: [], appointments: [] }

function paidAmount(invoice: InvoiceRecord) {
  return (invoice.payments || []).reduce((total, payment) => total + payment.amountMinor, 0)
}

function balance(invoice: InvoiceRecord) {
  return invoice.totalMinor - paidAmount(invoice)
}

function messageFor(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    const message = (error.details as { error?: { message?: unknown } } | undefined)?.error?.message
    if (typeof message === 'string' && message.trim()) return message
    if (error.status === 403) return 'You do not have permission to manage billing.'
  }
  return fallback
}

export function BillingPage() {
  const { session } = useAuth()
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([])
  const [sources, setSources] = useState<InvoiceSourceOptions>(emptySources)
  const [loading, setLoading] = useState(true)
  const [sourcesLoading, setSourcesLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [selected, setSelected] = useState<InvoiceRecord>()
  const [detailLoading, setDetailLoading] = useState(false)
  const [mode, setMode] = useState<InvoiceMode>('appointment')
  const [appointmentId, setAppointmentId] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [serviceIds, setServiceIds] = useState<string[]>([])
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [savingInvoice, setSavingInvoice] = useState(false)
  const [savingPayment, setSavingPayment] = useState(false)
  const [invoiceError, setInvoiceError] = useState<string>()
  const [paymentError, setPaymentError] = useState<string>()
  const [success, setSuccess] = useState<string>()

  const customers = useMemo(() => new Map(sources.customers.map((customer) => [customer._id, customer.displayName])), [sources.customers])
  const services = useMemo(() => new Map(sources.services.map((service) => [service._id, service.name])), [sources.services])

  const loadInvoices = useCallback(async () => {
    if (!session) return
    setLoading(true)
    setError(undefined)
    try {
      setInvoices((await getInvoices(session.accessToken)).data)
    } catch (cause) {
      setError(messageFor(cause, 'We couldn’t load invoices. Please try again.'))
    } finally {
      setLoading(false)
    }
  }, [session])

  const loadSources = useCallback(async () => {
    if (!session) return
    setSourcesLoading(true)
    try {
      setSources(await getInvoiceSources(session.accessToken))
    } catch (cause) {
      setError(messageFor(cause, 'We couldn’t load billing sources. Please try again.'))
    } finally {
      setSourcesLoading(false)
    }
  }, [session])

  useEffect(() => {
    void loadInvoices()
  }, [loadInvoices])

  useEffect(() => {
    void loadSources()
  }, [loadSources])

  async function openInvoice(id: string) {
    if (!session) return
    setDetailLoading(true)
    setSelected(undefined)
    setPaymentError(undefined)
    try {
      setSelected((await getInvoice(session.accessToken, id)).data)
    } catch (cause) {
      setError(messageFor(cause, 'We couldn’t load that invoice. Please try again.'))
    } finally {
      setDetailLoading(false)
    }
  }

  async function submitInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) return
    setInvoiceError(undefined)
    setSuccess(undefined)
    if (mode === 'appointment' && !appointmentId) {
      setInvoiceError('Choose an appointment source.')
      return
    }
    if (mode === 'services' && (!customerId || !serviceIds.length)) {
      setInvoiceError('Choose a customer and at least one service.')
      return
    }
    setSavingInvoice(true)
    try {
      const response =
        mode === 'appointment'
          ? await createInvoice(session.accessToken, { appointmentId })
          : await createInvoice(session.accessToken, { customerId, serviceIds })
      setSuccess('Invoice created successfully.')
      setAppointmentId('')
      setCustomerId('')
      setServiceIds([])
      await Promise.all([loadInvoices(), openInvoice(response.data._id)])
    } catch (cause) {
      setInvoiceError(messageFor(cause, 'We couldn’t create this invoice. Please try again.'))
    } finally {
      setSavingInvoice(false)
    }
  }

  async function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session || !selected) return
    const parsed = parseFloat(paymentAmount)
    if (Number.isNaN(parsed) || parsed <= 0) {
      setPaymentError('Enter a valid payment amount greater than zero.')
      return
    }
    const amountMinor = Math.round(parsed * 100)
    const currentBalance = balance(selected)
    if (amountMinor > currentBalance) {
      setPaymentError(`Payment amount cannot exceed the remaining balance of ${formatCurrency(currentBalance)}.`)
      return
    }
    setSavingPayment(true)
    setPaymentError(undefined)
    setSuccess(undefined)
    try {
      await recordPayment(session.accessToken, selected._id, { amountMinor, method: paymentMethod })
      setPaymentAmount('')
      setSuccess('Payment recorded successfully.')
      await Promise.all([loadInvoices(), openInvoice(selected._id)])
    } catch (cause) {
      setPaymentError(messageFor(cause, 'We couldn’t record this payment. Please try again.'))
    } finally {
      setSavingPayment(false)
    }
  }

  function toggleService(id: string) {
    setServiceIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  return (
    <div className="billing-workspace">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Billing & payments</p>
          <h1>Invoices</h1>
          <p className="page-intro">Create customer invoices from completed appointments or service selections and record payments.</p>
        </div>
      </div>
      {success && (
        <p className="form-success" role="status">
          {success}
        </p>
      )}
      <section className="pos-panel" aria-labelledby="create-invoice-title">
        <div className="pos-heading">
          <div>
            <p className="eyebrow">Point of sale</p>
            <h2 id="create-invoice-title">Create invoice</h2>
            <p>Select an appointment or choose a customer and services to generate an invoice.</p>
          </div>
        </div>
        <form onSubmit={submitInvoice}>
          <div className="invoice-mode" role="group" aria-label="Invoice source">
            <button type="button" className={mode === 'appointment' ? 'button' : 'button button-secondary'} onClick={() => setMode('appointment')}>
              From appointment
            </button>
            <button type="button" className={mode === 'services' ? 'button' : 'button button-secondary'} onClick={() => setMode('services')}>
              From customer and services
            </button>
          </div>
          {mode === 'appointment' ? (
            <label>
              Appointment source
              <select value={appointmentId} onChange={(event) => setAppointmentId(event.target.value)} disabled={savingInvoice || sourcesLoading}>
                <option value="">Select an appointment</option>
                {sources.appointments.map((appointment) => (
                  <option key={appointment._id} value={appointment._id}>
                    {appointment.date} · {appointment.startTime} · {customers.get(appointment.customerId) ?? 'Customer unavailable'} ·{' '}
                    {services.get(appointment.serviceId) ?? 'Service unavailable'}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="form-grid">
              <label>
                Customer
                <select value={customerId} onChange={(event) => setCustomerId(event.target.value)} disabled={savingInvoice || sourcesLoading}>
                  <option value="">Select a customer</option>
                  {sources.customers.map((customer) => (
                    <option key={customer._id} value={customer._id}>
                      {customer.displayName}
                    </option>
                  ))}
                </select>
              </label>
              <fieldset className="service-picker">
                <legend>Services</legend>
                {sources.services.length ? (
                  sources.services.map((service) => (
                    <label key={service._id}>
                      <input
                        type="checkbox"
                        checked={serviceIds.includes(service._id)}
                        onChange={() => toggleService(service._id)}
                        disabled={savingInvoice || sourcesLoading}
                      />{' '}
                      {service.name} ({formatCurrency(service.price * 100)})
                    </label>
                  ))
                ) : (
                  <span>No active services are available.</span>
                )}
              </fieldset>
            </div>
          )}
          {invoiceError && (
            <p className="form-error" role="alert">
              {invoiceError}
            </p>
          )}
          <div className="form-actions">
            <button className="button" type="submit" disabled={savingInvoice || sourcesLoading}>
              {savingInvoice ? 'Creating…' : 'Create invoice'}
            </button>
          </div>
        </form>
      </section>

      {error ? (
        <ErrorState
          title="Billing data is unavailable"
          description={error}
          action={
            <button
              className="button"
              type="button"
              onClick={() => {
                void loadInvoices()
                void loadSources()
              }}
            >
              Try again
            </button>
          }
        />
      ) : loading ? (
        <LoadingState label="Loading invoices…" />
      ) : !invoices.length ? (
        <EmptyState title="No invoices yet" description="Create an invoice from an appointment or customer service selection." />
      ) : (
        <section className="invoice-directory" aria-labelledby="invoice-directory-title">
          <div className="data-panel-header">
            <div>
              <p className="eyebrow">Financial records</p>
              <h2 id="invoice-directory-title">Invoice activity</h2>
            </div>
            <button className="button button-quiet" type="button" onClick={() => void loadInvoices()}>
              Refresh
            </button>
          </div>
          <div className="invoice-table-wrap">
            <table className="data-table invoice-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>
                    <span className="visually-hidden">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice._id}>
                    <td>
                      <strong>{invoice.invoiceNumber}</strong>
                      {invoice.appointmentId && <span className="invoice-reference">Appointment linked</span>}
                    </td>
                    <td>{invoice.customer?.displayName ?? customers.get(invoice.customerId) ?? 'Customer unavailable'}</td>
                    <td>{formatDate(invoice.createdAt)}</td>
                    <td>{formatCurrency(invoice.totalMinor)}</td>
                    <td>{formatCurrency(paidAmount(invoice))}</td>
                    <td>{formatCurrency(balance(invoice))}</td>
                    <td>
                      <span className={`status-badge status-${invoice.status}`}>{formatStatus(invoice.status)}</span>
                    </td>
                    <td>
                      <button className="button button-secondary" type="button" onClick={() => void openInvoice(invoice._id)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {(detailLoading || selected) && (
        <section className="invoice-detail" role="dialog" aria-modal="true" aria-labelledby="invoice-detail-title">
          {detailLoading ? (
            <LoadingState label="Loading invoice details…" />
          ) : (
            selected && (
              <>
                <div className="appointment-editor-header">
                  <div>
                    <p className="eyebrow">Invoice detail</p>
                    <h2 id="invoice-detail-title">{selected.invoiceNumber}</h2>
                    <p>
                      {formatDate(selected.createdAt)} · {selected.customer?.displayName ?? customers.get(selected.customerId) ?? 'Customer unavailable'}
                    </p>
                  </div>
                  <button className="button button-quiet" type="button" onClick={() => setSelected(undefined)}>
                    Close
                  </button>
                </div>
                <dl className="invoice-summary">
                  <div>
                    <dt>Status</dt>
                    <dd>
                      <span className={`status-badge status-${selected.status}`}>{formatStatus(selected.status)}</span>
                    </dd>
                  </div>
                  <div>
                    <dt>Total</dt>
                    <dd>{formatCurrency(selected.totalMinor)}</dd>
                  </div>
                  <div>
                    <dt>Paid</dt>
                    <dd>{formatCurrency(paidAmount(selected))}</dd>
                  </div>
                  <div>
                    <dt>Balance</dt>
                    <dd>{formatCurrency(balance(selected))}</dd>
                  </div>
                  {selected.appointment && (
                    <div>
                      <dt>Appointment</dt>
                      <dd>
                        {selected.appointment.date} · {selected.appointment.startTime}–{selected.appointment.endTime}
                      </dd>
                    </div>
                  )}
                </dl>
                <section className="invoice-lines">
                  <h3>Line items</h3>
                  <div className="invoice-line-list">
                    {selected.lineItems.map((item, index) => {
                      const serviceName = item.service?.name ?? (item.productId ? 'Product item' : 'Service item')
                      const qty = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1
                      const unitPriceMinor = typeof item.unitPriceMinor === 'number' ? item.unitPriceMinor : (item.totalMinor ? item.totalMinor / qty : 0)
                      const lineTotalMinor = typeof item.totalMinor === 'number' ? item.totalMinor : (unitPriceMinor * qty)
                      return (
                        <div key={item._id ?? `${item.serviceId ?? item.productId ?? 'line'}-${index}`}>
                          <span>{serviceName}</span>
                          <span>Qty {qty}</span>
                          <span>{formatCurrency(unitPriceMinor)}</span>
                          <strong>{formatCurrency(lineTotalMinor)}</strong>
                        </div>
                      )
                    })}
                  </div>
                </section>
                <section className="payment-history">
                  <h3>Payment history</h3>
                  {selected.payments.length ? (
                    <div className="payment-list">
                      {selected.payments.map((payment) => (
                        <div key={payment._id}>
                          <span>
                            <strong>{formatCurrency(payment.amountMinor)}</strong> · {formatStatus(payment.method)}
                          </span>
                          <span>
                            {formatStatus(payment.status)} · {formatDate(payment.createdAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState title="No recorded payments" description="Payments recorded for this invoice will appear here." />
                  )}
                </section>
                {balance(selected) > 0 && selected.status !== 'cancelled' && (
                  <form className="record-payment" onSubmit={submitPayment}>
                    <h3>Record payment</h3>
                    <p>Enter payment details against the remaining balance of {formatCurrency(balance(selected))}.</p>
                    <div className="form-grid">
                      <label>
                        Payment amount ($)
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          max={(balance(selected) / 100).toFixed(2)}
                          placeholder={(balance(selected) / 100).toFixed(2)}
                          value={paymentAmount}
                          onChange={(event) => setPaymentAmount(event.target.value)}
                          disabled={savingPayment}
                        />
                      </label>
                      <label>
                        Payment method
                        <select
                          value={paymentMethod}
                          onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                          disabled={savingPayment}
                        >
                          <option value="card">Card</option>
                          <option value="cash">Cash</option>
                          <option value="upi">UPI</option>
                          <option value="other">Other</option>
                        </select>
                      </label>
                    </div>
                    {paymentError && (
                      <p className="form-error" role="alert">
                        {paymentError}
                      </p>
                    )}
                    <div className="form-actions">
                      <button className="button" type="submit" disabled={savingPayment}>
                        {savingPayment ? 'Recording…' : 'Record payment'}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )
          )}
        </section>
      )}
    </div>
  )
}
