import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { apiRequest } from '../../shared/api/client'
import { EmptyState, ErrorState, LoadingState } from '../../shared/components/AsyncStates'

type ReportRecord = Record<string, unknown>
type ReportState = { loading: boolean; error?: boolean; data?: unknown }
const isRecord = (value: unknown): value is ReportRecord => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
const asArray = (value: unknown) => Array.isArray(value) ? value : []
const asNumber = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : 0

function ReportSection({ eyebrow, title, description, path, children }: { eyebrow: string; title: string; description: string; path: string; children: (data: unknown) => ReactNode }) {
  const { session } = useAuth()
  const [state, setState] = useState<ReportState>({ loading: true })
  const load = useCallback(() => {
    if (!session) return
    setState({ loading: true })
    apiRequest<{ data?: unknown }>({ path, method: 'GET', token: session.accessToken })
      .then((result) => setState({ loading: false, data: result.data }))
      .catch(() => setState({ loading: false, error: true }))
  }, [path, session])
  useEffect(() => { load() }, [load])
  return <section className="data-panel" aria-label={title}><div className="data-panel-header"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p>{description}</p></div><button className="button button-quiet" type="button" onClick={load} disabled={state.loading}>{state.loading ? 'Refreshing…' : 'Refresh'}</button></div>{state.loading ? <div className="data-panel-footer"><LoadingState label={`Loading ${title.toLowerCase()}…`} /></div> : state.error ? <div className="data-panel-footer"><ErrorState title="This report is temporarily unavailable" description="We couldn’t load this information right now." action={<button className="button" type="button" onClick={load}>Try again</button>} /></div> : <div className="report-content">{children(state.data)}</div>}</section>
}

function InvoiceReport({ data }: { data: unknown }) {
  const rows = asArray(data).filter(isRecord)
  if (!rows.length) return <EmptyState title="No billing data available yet" description="Reports will become more useful as billing activity is recorded." />
  return <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Invoice status</th><th>Invoices</th><th>Total billed</th></tr></thead><tbody>{rows.map((row, index) => <tr key={String(row._id ?? index)}><td><span className="status-badge">{String(row._id ?? 'Unspecified')}</span></td><td>{asNumber(row.count).toLocaleString()}</td><td>{asNumber(row.totalMinor).toLocaleString()}</td></tr>)}</tbody></table></div>
}

function OperationsReport({ data }: { data: unknown }) {
  if (!isRecord(data)) return <EmptyState title="No operations data available yet" description="This view will build as your team records activity." />
  const appointmentStates = asArray(data.appointments).filter(isRecord)
  const stockMoves = asArray(data.stock).filter(isRecord)
  const hasActivity = asNumber(data.customers) || asNumber(data.services) || asNumber(data.staff) || appointmentStates.length || stockMoves.length
  if (!hasActivity) return <EmptyState title="No operations data available yet" description="This view will build as your team records activity." />
  return <div className="report-summary"><div className="report-metrics"><div><span>Customers</span><strong>{asNumber(data.customers).toLocaleString()}</strong></div><div><span>Services</span><strong>{asNumber(data.services).toLocaleString()}</strong></div><div><span>Team members</span><strong>{asNumber(data.staff).toLocaleString()}</strong></div></div>{appointmentStates.length > 0 && <div className="report-breakdown"><h3>Appointment activity</h3>{appointmentStates.map((item, index) => <p key={String(item._id ?? index)}><span className="status-badge">{String(item._id ?? 'Unspecified')}</span><strong>{asNumber(item.count).toLocaleString()}</strong></p>)}</div>}</div>
}

function TrendsReport({ data }: { data: unknown }) {
  if (!isRecord(data)) return <EmptyState title="No trends available yet" description="Insights will appear as more salon activity is recorded." />
  const appointments = asArray(data.appointments)
  const services = asArray(data.serviceDemand)
  const lowStock = asArray(data.lowStock)
  if (!appointments.length && !services.length && !lowStock.length) return <EmptyState title="No trends available yet" description="Insights will appear as more salon activity is recorded." />
  return <div className="report-metrics"><div><span>Appointment periods</span><strong>{appointments.length.toLocaleString()}</strong></div><div><span>Services in demand</span><strong>{services.length.toLocaleString()}</strong></div><div><span>Low-stock products</span><strong>{lowStock.length.toLocaleString()}</strong></div></div>
}

export function ReportsPage() {
  return <div className="module-stack"><div className="page-heading"><div><p className="eyebrow">Business performance</p><h1>Reports & insights</h1><p className="page-intro">Review the activity that helps you make informed salon decisions.</p></div></div><ReportSection eyebrow="Billing" title="Invoice report" path="/api/v1/reports/invoices" description="Billing activity recorded for your salon.">{(data) => <InvoiceReport data={data} />}</ReportSection><ReportSection eyebrow="Operations" title="Operations report" path="/api/v1/reports/operations" description="A view of day-to-day salon operations.">{(data) => <OperationsReport data={data} />}</ReportSection><ReportSection eyebrow="Insights" title="Business trends" path="/api/v1/insights/trends" description="Patterns based on your recorded salon activity.">{(data) => <TrendsReport data={data} />}</ReportSection></div>
}
