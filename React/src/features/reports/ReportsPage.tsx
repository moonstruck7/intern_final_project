import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { ApiError } from '../../shared/api/ApiError'
import { EmptyState, ErrorState, LoadingState } from '../../shared/components/AsyncStates'
import { formatCurrency, formatCount, formatDateTime, formatStatus } from '../../shared/formatters'
import {
  createCampaign,
  createNotification,
  getAnalyticsSummary,
  getCampaigns,
  getInvoiceReport,
  getNotifications,
  getOperationsReport,
  getTrendsReport,
  markNotificationRead,
  updateCampaign,
  type AnalyticsSummary,
  type CampaignRecord,
  type CampaignStatus,
  type CreateCampaignInput,
  type CreateNotificationInput,
  type InvoiceReportItem,
  type NotificationRecord,
  type OperationsReportData,
  type TrendsReportData,
} from './reportsApi'

type TabKey = 'overview' | 'operations' | 'invoices' | 'trends' | 'marketing' | 'notifications'

function messageFor(error: unknown) {
  if (error instanceof ApiError) {
    const details = error.details as { error?: { message?: unknown } } | undefined
    const message = details?.error?.message
    if (typeof message === 'string' && message.trim()) return message
    if (error.status === 403) return 'You do not have permission to access this reporting area.'
  }
  return 'Failed to load reporting data. Please try again.'
}

export function ReportsPage() {
  const { session, can } = useAuth()
  const [tab, setTab] = useState<TabKey>('overview')

  // Data states
  const [summary, setSummary] = useState<AnalyticsSummary>()
  const [invoices, setInvoices] = useState<InvoiceReportItem[]>([])
  const [operations, setOperations] = useState<OperationsReportData>()
  const [trends, setTrends] = useState<TrendsReportData>()
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([])
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])

  // Loading & error
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [success, setSuccess] = useState<string>()

  // Trend date filters
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Campaign Modal state
  const [campaignModal, setCampaignModal] = useState<{
    id?: string
    name: string
    status: CampaignStatus
    audienceNote: string
  }>()
  const [savingCampaign, setSavingCampaign] = useState(false)
  const [campaignError, setCampaignError] = useState<string>()

  // Notification Modal state
  const [notificationModal, setNotificationModal] = useState<{
    title: string
    body: string
  }>()
  const [savingNotification, setSavingNotification] = useState(false)
  const [notificationError, setNotificationError] = useState<string>()

  const canManageMarketing = can({ permissions: ['marketing.manage'] })
  const canManageNotifications = can({ permissions: ['notifications.manage'] })

  const loadData = useCallback(async () => {
    if (!session) return
    setLoading(true)
    setError(undefined)

    try {
      if (tab === 'overview') {
        const [summaryRes, opsRes] = await Promise.all([
          getAnalyticsSummary(session.accessToken),
          getOperationsReport(session.accessToken),
        ])
        setSummary(summaryRes.data)
        setOperations(opsRes.data)
      } else if (tab === 'operations') {
        const res = await getOperationsReport(session.accessToken)
        setOperations(res.data)
      } else if (tab === 'invoices') {
        const res = await getInvoiceReport(session.accessToken)
        setInvoices(res.data)
      } else if (tab === 'trends') {
        const filters: { startDate?: string; endDate?: string } = {}
        if (startDate) filters.startDate = startDate
        if (endDate) filters.endDate = endDate
        const res = await getTrendsReport(session.accessToken, filters)
        setTrends(res.data)
      } else if (tab === 'marketing' && canManageMarketing) {
        const res = await getCampaigns(session.accessToken)
        setCampaigns(res.data)
      } else if (tab === 'notifications' && canManageNotifications) {
        const res = await getNotifications(session.accessToken)
        setNotifications(res.data)
      }
    } catch (cause) {
      setError(messageFor(cause))
    } finally {
      setLoading(false)
    }
  }, [canManageMarketing, canManageNotifications, endDate, session, startDate, tab])

  useEffect(() => {
    void loadData()
  }, [loadData])

  // Submit Campaign
  async function submitCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session || !campaignModal) return

    if (!campaignModal.name.trim()) {
      setCampaignError('Campaign name is required.')
      return
    }

    setSavingCampaign(true)
    setCampaignError(undefined)
    setSuccess(undefined)

    try {
      if (campaignModal.id) {
        await updateCampaign(session.accessToken, campaignModal.id, {
          name: campaignModal.name.trim(),
          status: campaignModal.status,
          audienceNote: campaignModal.audienceNote.trim() || undefined,
        })
        setSuccess('Campaign updated successfully.')
      } else {
        const payload: CreateCampaignInput = {
          name: campaignModal.name.trim(),
          status: campaignModal.status,
          audienceNote: campaignModal.audienceNote.trim() || undefined,
        }
        await createCampaign(session.accessToken, payload)
        setSuccess('Campaign created successfully.')
      }
      setCampaignModal(undefined)
      await loadData()
    } catch (cause) {
      setCampaignError(messageFor(cause))
    } finally {
      setSavingCampaign(false)
    }
  }

  // Submit Notification
  async function submitNotification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session || !notificationModal) return

    if (!notificationModal.title.trim() || !notificationModal.body.trim()) {
      setNotificationError('Title and message body are required.')
      return
    }

    setSavingNotification(true)
    setNotificationError(undefined)
    setSuccess(undefined)

    try {
      const payload: CreateNotificationInput = {
        title: notificationModal.title.trim(),
        body: notificationModal.body.trim(),
      }
      await createNotification(session.accessToken, payload)
      setSuccess('Notification dispatched successfully.')
      setNotificationModal(undefined)
      await loadData()
    } catch (cause) {
      setNotificationError(messageFor(cause))
    } finally {
      setSavingNotification(false)
    }
  }

  // Mark notification read
  async function handleMarkRead(id: string) {
    if (!session) return
    try {
      await markNotificationRead(session.accessToken, id)
      setNotifications((curr) =>
        curr.map((n) => (n._id === id ? { ...n, readAt: new Date().toISOString() } : n)),
      )
    } catch (cause) {
      setError(messageFor(cause))
    }
  }

  // Max calculations for trend visualization bars
  const maxAppointmentCount = useMemo(
    () => (trends?.appointments ? Math.max(...trends.appointments.map((a) => a.count), 1) : 1),
    [trends?.appointments],
  )
  const maxServiceDemandCount = useMemo(
    () => (trends?.serviceDemand ? Math.max(...trends.serviceDemand.map((s) => s.count), 1) : 1),
    [trends?.serviceDemand],
  )

  return (
    <div className="reports-workspace">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Business Intelligence</p>
          <h1>Reports & Insights</h1>
          <p className="page-intro">
            Monitor salon performance, revenue, trends, operational health, and marketing initiatives.
          </p>
        </div>
        <div className="page-heading-actions">
          {tab === 'marketing' && canManageMarketing && (
            <button
              className="button"
              type="button"
              onClick={() =>
                setCampaignModal({ name: '', status: 'draft', audienceNote: '' })
              }
            >
              New campaign
            </button>
          )}
          {tab === 'notifications' && canManageNotifications && (
            <button
              className="button"
              type="button"
              onClick={() => setNotificationModal({ title: '', body: '' })}
            >
              Create notification
            </button>
          )}
          <button className="button button-quiet" type="button" onClick={() => void loadData()} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      <div className="decision-callout" role="note">
        <strong>Reports scope:</strong> Metrics use the live salon records available to your role. Automated campaigns, delivery channels, and export formats are pending a team decision.
      </div>

      {success && (
        <p className="form-success" role="status">
          {success}
        </p>
      )}

      {error && (
        <ErrorState
          title="Reporting data is unavailable"
          description={error}
          action={
            <button className="button" type="button" onClick={() => void loadData()}>
              Try again
            </button>
          }
        />
      )}

      {!error && (
        <section className="inventory-section" aria-label="Reports and analytics">
          <div className="reports-tabs" role="tablist" aria-label="Report views">
            <button
              className={tab === 'overview' ? 'button' : 'button button-secondary'}
              type="button"
              role="tab"
              aria-selected={tab === 'overview'}
              onClick={() => setTab('overview')}
            >
              Overview
            </button>
            <button
              className={tab === 'operations' ? 'button' : 'button button-secondary'}
              type="button"
              role="tab"
              aria-selected={tab === 'operations'}
              onClick={() => setTab('operations')}
            >
              Operations
            </button>
            <button
              className={tab === 'invoices' ? 'button' : 'button button-secondary'}
              type="button"
              role="tab"
              aria-selected={tab === 'invoices'}
              onClick={() => setTab('invoices')}
            >
              Invoices & Revenue
            </button>
            <button
              className={tab === 'trends' ? 'button' : 'button button-secondary'}
              type="button"
              role="tab"
              aria-selected={tab === 'trends'}
              onClick={() => setTab('trends')}
            >
              Trends & Insights
            </button>
            {canManageMarketing && (
              <button
                className={tab === 'marketing' ? 'button' : 'button button-secondary'}
                type="button"
                role="tab"
                aria-selected={tab === 'marketing'}
                onClick={() => setTab('marketing')}
              >
                Campaigns
              </button>
            )}
            {canManageNotifications && (
              <button
                className={tab === 'notifications' ? 'button' : 'button button-secondary'}
                type="button"
                role="tab"
                aria-selected={tab === 'notifications'}
                onClick={() => setTab('notifications')}
              >
                Notifications
              </button>
            )}
          </div>

          {loading ? (
            <LoadingState label="Loading report data…" />
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {tab === 'overview' && (
                <div className="report-summary">
                  <div className="report-metrics">
                    <div>
                      <span>Total Billed</span>
                      <strong>{formatCurrency(summary?.totalBilledMinor)}</strong>
                    </div>
                    <div>
                      <span>Invoices Issued</span>
                      <strong>{formatCount(summary?.invoiceCount)}</strong>
                    </div>
                    <div>
                      <span>Appointments Scheduled</span>
                      <strong>{formatCount(summary?.appointmentCount)}</strong>
                    </div>
                    <div>
                      <span>Low Stock Alerts</span>
                      <strong className={summary && summary.lowStockCount > 0 ? 'stock-low' : ''}>
                        {formatCount(summary?.lowStockCount)}
                      </strong>
                    </div>
                    <div>
                      <span>Active Customers</span>
                      <strong>{formatCount(operations?.customers)}</strong>
                    </div>
                    <div>
                      <span>Active Services</span>
                      <strong>{formatCount(operations?.services)}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: OPERATIONS */}
              {tab === 'operations' && (
                <div className="report-summary">
                  <div className="report-metrics">
                    <div>
                      <span>Customers</span>
                      <strong>{formatCount(operations?.customers)}</strong>
                    </div>
                    <div>
                      <span>Services</span>
                      <strong>{formatCount(operations?.services)}</strong>
                    </div>
                    <div>
                      <span>Team Members</span>
                      <strong>{formatCount(operations?.staff)}</strong>
                    </div>
                  </div>

                  {operations?.appointments && operations.appointments.length > 0 && (
                    <div className="report-breakdown">
                      <h3>Appointment Status Breakdown</h3>
                      {operations.appointments.map((item) => (
                        <p key={item._id}>
                          <span className={`status-badge status-${item._id}`}>
                            {formatStatus(item._id)}
                          </span>
                          <strong>{formatCount(item.count)}</strong>
                        </p>
                      ))}
                    </div>
                  )}

                  {operations?.stock && operations.stock.length > 0 && (
                    <div className="report-breakdown">
                      <h3>Stock Movement Activity</h3>
                      {operations.stock.map((item) => (
                        <p key={item._id}>
                          <span className="status-badge">{formatStatus(item._id)}</span>
                          <strong>
                            {item.quantity > 0 ? `+${item.quantity}` : item.quantity} units
                          </strong>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: INVOICES & REVENUE */}
              {tab === 'invoices' && (
                <div>
                  {!invoices.length ? (
                    <EmptyState
                      title="No billing activity"
                      description="Invoices and financial metrics will appear as invoices are generated."
                    />
                  ) : (
                    <div className="data-table-wrap">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Invoice Status</th>
                            <th>Invoices</th>
                            <th>Total Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoices.map((row) => (
                            <tr key={row._id}>
                              <td>
                                <span className={`status-badge status-${row._id}`}>
                                  {formatStatus(row._id)}
                                </span>
                              </td>
                              <td>{formatCount(row.count)}</td>
                              <td>
                                <strong>{formatCurrency(row.totalMinor)}</strong>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: TRENDS & INSIGHTS */}
              {tab === 'trends' && (
                <div>
                  <div className="trends-toolbar">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        void loadData()
                      }}
                    >
                      <label>
                        From Date
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </label>
                      <label>
                        To Date
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </label>
                      <button className="button button-secondary" type="submit">
                        Apply Filter
                      </button>
                      {(startDate || endDate) && (
                        <button
                          className="button button-quiet"
                          type="button"
                          onClick={() => {
                            setStartDate('')
                            setEndDate('')
                          }}
                        >
                          Clear
                        </button>
                      )}
                    </form>
                  </div>

                  {!trends?.appointments.length &&
                  !trends?.serviceDemand.length &&
                  !trends?.lowStock.length ? (
                    <EmptyState
                      title="No trend signals found"
                      description="Try adjusting your date range or record more appointment activity."
                    />
                  ) : (
                    <div className="report-summary">
                      {trends.appointments.length > 0 && (
                        <div className="report-breakdown">
                          <h3>Appointments Over Time</h3>
                          {trends.appointments.map((item) => {
                            const pct = Math.round((item.count / maxAppointmentCount) * 100)
                            return (
                              <div className="bar-stat-row" key={item._id}>
                                <span className="bar-stat-label">{item._id}</span>
                                <div className="bar-stat-track">
                                  <div className="bar-stat-fill" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="bar-stat-val">{item.count} bookings</span>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {trends.serviceDemand.length > 0 && (
                        <div className="report-breakdown">
                          <h3>Service Demand Distribution</h3>
                          {trends.serviceDemand.map((item, index) => {
                            const pct = Math.round((item.count / maxServiceDemandCount) * 100)
                            return (
                              <div className="bar-stat-row" key={item._id || index}>
                                <span className="bar-stat-label">Service #{index + 1}</span>
                                <div className="bar-stat-track">
                                  <div
                                    className="bar-stat-fill"
                                    style={{ width: `${pct}%`, background: '#805838' }}
                                  />
                                </div>
                                <span className="bar-stat-val">{item.count} appointments</span>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {trends.lowStock.length > 0 && (
                        <div className="report-breakdown">
                          <h3>Low Stock Inventory Signals</h3>
                          <div className="data-table-wrap">
                            <table className="data-table">
                              <thead>
                                <tr>
                                  <th>Product</th>
                                  <th>SKU</th>
                                  <th>Current Stock</th>
                                  <th>Threshold</th>
                                </tr>
                              </thead>
                              <tbody>
                                {trends.lowStock.map((p) => (
                                  <tr key={p._id}>
                                    <td>
                                      <strong>{p.name}</strong>
                                    </td>
                                    <td>
                                      <span className="sku-badge">{p.sku}</span>
                                    </td>
                                    <td>
                                      <span className="stock-tag stock-low">{p.currentStock} units</span>
                                    </td>
                                    <td>{p.lowStockThreshold} units</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: MARKETING CAMPAIGNS */}
              {tab === 'marketing' && canManageMarketing && (
                <div>
                  {!campaigns.length ? (
                    <EmptyState
                      title="No marketing campaigns"
                      description="Create a campaign to organize seasonal offers, promotions, and client outreach."
                    />
                  ) : (
                    <div className="campaigns-grid">
                      {campaigns.map((camp) => (
                        <article className="campaign-card" key={camp._id}>
                          <div>
                            <strong>{camp.name}</strong>
                            <p>{camp.audienceNote || 'No audience notes recorded.'}</p>
                          </div>
                          <div className="campaign-card-footer">
                            <span className={`status-badge status-${camp.status}`}>
                              {camp.status}
                            </span>
                            <button
                              className="button button-secondary"
                              type="button"
                              onClick={() =>
                                setCampaignModal({
                                  id: camp._id,
                                  name: camp.name,
                                  status: camp.status,
                                  audienceNote: camp.audienceNote || '',
                                })
                              }
                            >
                              Edit
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: NOTIFICATIONS */}
              {tab === 'notifications' && canManageNotifications && (
                <div>
                  {!notifications.length ? (
                    <EmptyState
                      title="No notifications"
                      description="Salon notifications and internal updates will appear here."
                    />
                  ) : (
                    <div className="notifications-list">
                      {notifications.map((notif) => {
                        const isUnread = !notif.readAt
                        return (
                          <div
                            key={notif._id}
                            className={`notification-card ${isUnread ? 'unread' : ''}`}
                          >
                            <div className="notification-content">
                              <strong>{notif.title}</strong>
                              <p>{notif.body}</p>
                              <span>{formatDateTime(notif.createdAt)}</span>
                            </div>
                            <div className="notification-actions">
                              {isUnread && (
                                <button
                                  className="button button-secondary"
                                  type="button"
                                  onClick={() => void handleMarkRead(notif._id)}
                                >
                                  Mark read
                                </button>
                              )}
                              {!isUnread && (
                                <span className="status-badge status-completed">Read</span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* Campaign Editor Modal */}
      {campaignModal && (
        <section
          className="inventory-editor"
          role="dialog"
          aria-modal="true"
          aria-labelledby="campaign-modal-title"
        >
          <div className="appointment-editor-header">
            <div>
              <p className="eyebrow">{campaignModal.id ? 'Edit Campaign' : 'New Campaign'}</p>
              <h2 id="campaign-modal-title">
                {campaignModal.id ? `Update ${campaignModal.name}` : 'Create Marketing Campaign'}
              </h2>
              <p>Campaign records persist to the shared database.</p>
            </div>
            <button
              className="button button-quiet"
              type="button"
              onClick={() => setCampaignModal(undefined)}
            >
              Close
            </button>
          </div>

          <form onSubmit={submitCampaign}>
            <div className="form-grid">
              <label>
                Campaign Name *
                <input
                  required
                  value={campaignModal.name}
                  onChange={(e) =>
                    setCampaignModal((curr) => (curr ? { ...curr, name: e.target.value } : undefined))
                  }
                  disabled={savingCampaign}
                />
              </label>
              <label>
                Status
                <select
                  value={campaignModal.status}
                  onChange={(e) =>
                    setCampaignModal((curr) =>
                      curr ? { ...curr, status: e.target.value as CampaignStatus } : undefined,
                    )
                  }
                  disabled={savingCampaign}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <label style={{ gridColumn: '1 / -1' }}>
                Audience / Promotional Note
                <textarea
                  rows={3}
                  value={campaignModal.audienceNote}
                  onChange={(e) =>
                    setCampaignModal((curr) =>
                      curr ? { ...curr, audienceNote: e.target.value } : undefined,
                    )
                  }
                  disabled={savingCampaign}
                />
              </label>
            </div>

            {campaignError && (
              <p className="form-error" role="alert">
                {campaignError}
              </p>
            )}

            <div className="form-actions">
              <button className="button" type="submit" disabled={savingCampaign}>
                {savingCampaign ? 'Saving…' : campaignModal.id ? 'Save Changes' : 'Create Campaign'}
              </button>
              <button
                className="button button-secondary"
                type="button"
                disabled={savingCampaign}
                onClick={() => setCampaignModal(undefined)}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Notification Editor Modal */}
      {notificationModal && (
        <section
          className="inventory-editor"
          role="dialog"
          aria-modal="true"
          aria-labelledby="notif-modal-title"
        >
          <div className="appointment-editor-header">
            <div>
              <p className="eyebrow">Internal Announcement</p>
              <h2 id="notif-modal-title">Create Notification</h2>
              <p>Dispatches a notification to salon users.</p>
            </div>
            <button
              className="button button-quiet"
              type="button"
              onClick={() => setNotificationModal(undefined)}
            >
              Close
            </button>
          </div>

          <form onSubmit={submitNotification}>
            <div className="form-grid">
              <label style={{ gridColumn: '1 / -1' }}>
                Title *
                <input
                  required
                  placeholder="Notification title…"
                  value={notificationModal.title}
                  onChange={(e) =>
                    setNotificationModal((curr) => (curr ? { ...curr, title: e.target.value } : undefined))
                  }
                  disabled={savingNotification}
                />
              </label>
              <label style={{ gridColumn: '1 / -1' }}>
                Message Body *
                <textarea
                  required
                  rows={3}
                  placeholder="Enter message details…"
                  value={notificationModal.body}
                  onChange={(e) =>
                    setNotificationModal((curr) => (curr ? { ...curr, body: e.target.value } : undefined))
                  }
                  disabled={savingNotification}
                />
              </label>
            </div>

            {notificationError && (
              <p className="form-error" role="alert">
                {notificationError}
              </p>
            )}

            <div className="form-actions">
              <button className="button" type="submit" disabled={savingNotification}>
                {savingNotification ? 'Dispatching…' : 'Send Notification'}
              </button>
              <button
                className="button button-secondary"
                type="button"
                disabled={savingNotification}
                onClick={() => setNotificationModal(undefined)}
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
