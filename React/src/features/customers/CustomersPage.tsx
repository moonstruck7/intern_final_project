import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { ApiError } from '../../shared/api/ApiError'
import { EmptyState, ErrorState, LoadingState } from '../../shared/components/AsyncStates'
import { formatCurrency, formatDate, formatStatus } from '../../shared/formatters'
import { createCustomer, getCustomerHistory, getCustomers, updateCustomer, type CustomerHistory, type CustomerInput, type CustomerRecord, type CustomerStatus } from './customerApi'

const PAGE_SIZE = 20
type EditorTarget = 'create' | CustomerRecord
type FormValues = { displayName: string; email: string; phone: string; notes: string; status: CustomerStatus }

function emptyForm(): FormValues {
  return { displayName: '', email: '', phone: '', notes: '', status: 'active' }
}

function formFrom(customer: CustomerRecord): FormValues {
  return {
    displayName: customer.displayName,
    email: customer.email ?? '',
    phone: customer.phone ?? '',
    notes: customer.notes ?? '',
    status: customer.status,
  }
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    const message = (error.details as { error?: { message?: unknown } } | undefined)?.error?.message
    if (typeof message === 'string' && message.trim()) return message
    if (error.status === 403) return 'You do not have permission to manage customers.'
  }
  return fallback
}

function CustomerHistoryView({
  history,
  loading,
  error,
  onRetry,
}: {
  history?: CustomerHistory
  loading: boolean
  error?: string
  onRetry: () => void
}) {
  if (loading) return <LoadingState label="Loading customer history…" />
  if (error) return <ErrorState title="Customer history is unavailable" description={error} action={<button className="button" type="button" onClick={onRetry}>Try again</button>} />
  if (!history) return null

  const services = new Map(history.services.map((service) => [service._id, service.name]))
  const staff = new Map(history.staff.map((person) => [person._id, person.displayName]))

  return (
    <section className="customer-profile" aria-labelledby="customer-profile-title">
      <header className="customer-profile-header">
        <div>
          <p className="eyebrow">Customer profile</p>
          <h2 id="customer-profile-title">{history.customer.displayName}</h2>
          <p>{history.customer.email || history.customer.phone || 'No contact details recorded.'}</p>
        </div>
        <span className={`status-badge status-${history.customer.status}`}>{formatStatus(history.customer.status)}</span>
      </header>
      <dl className="customer-profile-grid">
        <div>
          <dt>Email</dt>
          <dd>{history.customer.email || 'Not recorded'}</dd>
        </div>
        <div>
          <dt>Phone</dt>
          <dd>{history.customer.phone || 'Not recorded'}</dd>
        </div>
        <div>
          <dt>Account</dt>
          <dd>{history.account ? `${history.account.loginIdentifier} (${history.account.isActive ? 'Active' : 'Inactive'})` : 'No linked customer account'}</dd>
        </div>
        <div>
          <dt>Staff notes</dt>
          <dd>{history.customer.notes || 'No notes recorded'}</dd>
        </div>
      </dl>
      <div className="customer-history-grid">
        <section className="history-section">
          <div className="history-section-heading">
            <div>
              <p className="eyebrow">Appointments</p>
              <h3>Visit history</h3>
            </div>
            <span>{history.appointments.length}</span>
          </div>
          {history.appointments.length ? (
            <div className="history-list">
              {history.appointments.map((appointment) => (
                <article key={appointment._id}>
                  <div>
                    <strong>
                      {formatDate(appointment.date)} · {appointment.startTime}–{appointment.endTime}
                    </strong>
                    <span>
                      {services.get(appointment.serviceId) ?? 'Service unavailable'} · {staff.get(appointment.staffId) ?? 'Staff unavailable'}
                    </span>
                  </div>
                  <span className={`status-badge status-${appointment.status}`}>{formatStatus(appointment.status)}</span>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="No appointment history" description="No appointments are associated with this customer yet." />
          )}
        </section>
        <section className="history-section">
          <div className="history-section-heading">
            <div>
              <p className="eyebrow">Billing</p>
              <h3>Billing history</h3>
            </div>
            <span>{history.invoices.length}</span>
          </div>
          {history.invoices.length ? (
            <div className="history-list">
              {history.invoices.map((invoice) => {
                const paid = (invoice.payments || []).reduce((total, payment) => total + payment.amountMinor, 0)
                return (
                  <article key={invoice._id}>
                    <div>
                      <strong>
                        {invoice.invoiceNumber} · {formatDate(invoice.createdAt)}
                      </strong>
                      <span>
                        Total: {formatCurrency(invoice.totalMinor)} · Paid: {formatCurrency(paid)}
                        {invoice.payments?.length ? ` (${invoice.payments.map((p) => formatStatus(p.method)).join(', ')})` : ''}
                      </span>
                    </div>
                    <span className={`status-badge status-${invoice.status}`}>{formatStatus(invoice.status)}</span>
                  </article>
                )
              })}
            </div>
          ) : (
            <EmptyState title="No invoice history" description="No invoices are associated with this customer yet." />
          )}
        </section>
      </div>
    </section>
  )
}

export function CustomersPage() {
  const { session } = useAuth()
  const [customers, setCustomers] = useState<CustomerRecord[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [status, setStatus] = useState<CustomerStatus | ''>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [selectedId, setSelectedId] = useState<string>()
  const [history, setHistory] = useState<CustomerHistory>()
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string>()
  const [editor, setEditor] = useState<EditorTarget>()
  const [values, setValues] = useState<FormValues>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string>()
  const [success, setSuccess] = useState<string>()
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const loadCustomers = useCallback(async () => {
    if (!session) return
    setLoading(true)
    setError(undefined)
    try {
      const response = await getCustomers(session.accessToken, {
        page,
        limit: PAGE_SIZE,
        search: appliedSearch || undefined,
        status: status || undefined,
      })
      setCustomers(response.data)
      setTotal(response.pagination.total)
    } catch (cause) {
      setError(errorMessage(cause, 'We couldn’t load customers. Please try again.'))
    } finally {
      setLoading(false)
    }
  }, [appliedSearch, page, session, status])

  const loadHistory = useCallback(
    async (id = selectedId) => {
      if (!session || !id) return
      setHistoryLoading(true)
      setHistoryError(undefined)
      try {
        setHistory((await getCustomerHistory(session.accessToken, id)).data)
      } catch (cause) {
        setHistoryError(errorMessage(cause, 'We couldn’t load this customer’s history. Please try again.'))
      } finally {
        setHistoryLoading(false)
      }
    },
    [selectedId, session]
  )

  useEffect(() => {
    void loadCustomers()
  }, [loadCustomers])

  useEffect(() => {
    setHistory(undefined)
    if (selectedId) void loadHistory(selectedId)
  }, [loadHistory, selectedId])

  function openCreate() {
    setValues(emptyForm())
    setFormError(undefined)
    setEditor('create')
  }

  function openEdit(customer: CustomerRecord) {
    setValues(formFrom(customer))
    setFormError(undefined)
    setEditor(customer)
  }

  function changeValue<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session || !editor) return
    const displayName = values.displayName.trim()
    if (!displayName) {
      setFormError('Enter the customer’s name.')
      return
    }
    setSaving(true)
    setFormError(undefined)
    setSuccess(undefined)
    const payload: CustomerInput = {
      displayName,
      status: values.status,
      ...(values.email.trim() ? { email: values.email.trim() } : {}),
      ...(values.phone.trim() ? { phone: values.phone.trim() } : {}),
      ...(values.notes.trim() ? { notes: values.notes.trim() } : {}),
    }
    try {
      const response =
        editor === 'create'
          ? await createCustomer(session.accessToken, payload)
          : await updateCustomer(session.accessToken, editor._id, payload)
      const wasCreate = editor === 'create'
      setEditor(undefined)
      setSuccess(wasCreate ? 'Customer created.' : 'Customer updated.')
      setSelectedId(response.data._id)
      await Promise.all([loadCustomers(), loadHistory(response.data._id)])
    } catch (cause) {
      setFormError(errorMessage(cause, 'We couldn’t save this customer. Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="customer-workspace">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Client Management</p>
          <h1>Customers & Clients</h1>
          <p className="page-intro">Manage customer records, contact information, visit history, and billing records.</p>
        </div>
        <button className="button" type="button" onClick={openCreate}>
          + Add customer
        </button>
      </div>
      {success && (
        <p className="form-success" role="status">
          {success}
        </p>
      )}

      {/* Quick Summary Cards */}
      <section className="dashboard-grid staff-stats-grid" aria-label="Customer metrics summary">
        <article className="metric-card">
          <p>Total Customers</p>
          <strong>{total}</strong>
        </article>
        <article className="metric-card">
          <p>Active Profiles</p>
          <strong>{customers.filter((c) => c.status === 'active').length}</strong>
        </article>
        <article className="metric-card">
          <p>Page Results</p>
          <strong>{customers.length}</strong>
        </article>
        <article className="metric-card">
          <p>Total Pages</p>
          <strong>{pageCount}</strong>
        </article>
      </section>

      <section className="customer-directory" aria-label="Customer directory">
        <div className="customer-directory-toolbar">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              setPage(1)
              setAppliedSearch(search.trim())
            }}
          >
            <label className="visually-hidden" htmlFor="customer-search">
              Search customers
            </label>
            <input
              id="customer-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, or phone…"
            />
            <button className="button button-secondary" type="submit">
              Apply
            </button>
            {appliedSearch && (
              <button
                className="button button-quiet"
                type="button"
                onClick={() => {
                  setSearch('')
                  setAppliedSearch('')
                  setPage(1)
                }}
              >
                Clear
              </button>
            )}
          </form>
          <label>
            Status
            <select
              value={status}
              onChange={(event) => {
                setPage(1)
                setStatus(event.target.value as CustomerStatus | '')
              }}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
        </div>
        {error ? (
          <ErrorState
            title="Customers are unavailable"
            description={error}
            action={
              <button className="button" type="button" onClick={() => void loadCustomers()}>
                Try again
              </button>
            }
          />
        ) : loading ? (
          <LoadingState label="Loading customer directory…" />
        ) : !customers.length ? (
          <EmptyState
            title="No customers found"
            description={appliedSearch || status ? 'Try changing your search or status filter.' : 'Create a customer profile to begin building your salon client list.'}
            action={
              <button className="button" type="button" onClick={openCreate}>
                + Add your first customer
              </button>
            }
          />
        ) : (
          <>
            <div className="customer-table-wrap">
              <table className="data-table customer-table">
                <colgroup>
                  <col className="customer-column-name" />
                  <col className="customer-column-contact" />
                  <col className="customer-column-status" />
                  <col className="customer-column-actions" />
                </colgroup>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>
                      <span className="visually-hidden">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer._id}>
                      <td>
                        <strong>{customer.displayName}</strong>
                        {customer.notes && <span className="customer-note">Client notes on file</span>}
                      </td>
                      <td>{customer.email || customer.phone || 'No contact recorded'}</td>
                      <td>
                        <span className={`status-badge status-${customer.status}`}>{formatStatus(customer.status)}</span>
                      </td>
                      <td className="customer-row-actions">
                        <button type="button" className="button button-secondary button-small" onClick={() => setSelectedId(customer._id)}>
                          View profile
                        </button>
                        <button type="button" className="button button-quiet button-small" onClick={() => openEdit(customer)}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="customer-pagination">
              <span>
                {total} customer{total === 1 ? '' : 's'} · page {page} of {pageCount}
              </span>
              <div>
                <button
                  className="button button-secondary"
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                >
                  Previous
                </button>
                <button
                  className="button button-secondary"
                  type="button"
                  disabled={page >= pageCount}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>
      {selectedId && <CustomerHistoryView history={history} loading={historyLoading} error={historyError} onRetry={() => void loadHistory()} />}
      {editor && (
        <section className="customer-editor" role="dialog" aria-modal="true" aria-labelledby="customer-editor-title">
          <div className="appointment-editor-header">
            <div>
              <p className="eyebrow">{editor === 'create' ? 'New customer' : 'Edit customer'}</p>
              <h2 id="customer-editor-title">{editor === 'create' ? 'Add customer' : `Update ${editor.displayName}`}</h2>
              <p>Customer contact and preferences for appointments and communications.</p>
            </div>
            <button className="button button-quiet" type="button" onClick={() => setEditor(undefined)}>
              Close
            </button>
          </div>
          <form onSubmit={submit}>
            <div className="form-grid">
              <label>
                Full name *
                <input required value={values.displayName} onChange={(event) => changeValue('displayName', event.target.value)} disabled={saving} />
              </label>
              <label>
                Email address
                <input type="email" value={values.email} onChange={(event) => changeValue('email', event.target.value)} disabled={saving} />
              </label>
              <label>
                Phone number
                <input value={values.phone} onChange={(event) => changeValue('phone', event.target.value)} disabled={saving} />
              </label>
              <label>
                Status
                <select value={values.status} onChange={(event) => changeValue('status', event.target.value as CustomerStatus)} disabled={saving}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
              <label className="customer-notes-label">
                Staff notes
                <textarea value={values.notes} onChange={(event) => changeValue('notes', event.target.value)} disabled={saving} rows={4} />
              </label>
            </div>
            {formError && (
              <p className="form-error" role="alert">
                {formError}
              </p>
            )}
            <div className="form-actions">
              <button className="button" type="submit" disabled={saving}>
                {saving ? 'Saving…' : editor === 'create' ? 'Create customer' : 'Save changes'}
              </button>
              <button className="button button-secondary" type="button" disabled={saving} onClick={() => setEditor(undefined)}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  )
}
