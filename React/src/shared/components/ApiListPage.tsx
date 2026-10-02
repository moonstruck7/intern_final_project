import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../api/client'
import { useAuth } from '../../features/auth/AuthProvider'
import { EmptyState, ErrorState, LoadingState } from './AsyncStates'

type RecordValue = Record<string, unknown>

interface ApiListPageProps {
  eyebrow: string
  title: string
  path: string
  description?: string
  emptyTitle?: string
  emptyDescription?: string
}

const preferredFields = ['displayName', 'name', 'title', 'email', 'phone', 'status', 'date', 'startDate', 'createdAt']

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') {
    const item = value as RecordValue
    return String(item.displayName ?? item.name ?? item._id ?? 'Details available')
  }
  return String(value).replaceAll('_', ' ')
}

function columnLabel(key: string) {
  return key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, (letter) => letter.toUpperCase())
}

export function ApiListPage({ eyebrow, title, path, description, emptyTitle, emptyDescription }: ApiListPageProps) {
  const { session } = useAuth()
  const [state, setState] = useState<{ loading: boolean; error?: string; data?: RecordValue[] }>({ loading: true })
  const load = useCallback(() => {
    if (!session) return
    setState({ loading: true })
    apiRequest<{ data: RecordValue[] }>({ path, method: 'GET', token: session.accessToken })
      .then((result) => setState({ loading: false, data: result.data }))
      .catch(() => setState({ loading: false, error: 'Please check your connection and try again.' }))
  }, [path, session])

  useEffect(() => { load() }, [load])
  const records = state.data ?? []
  const columns = records.length ? preferredFields.filter((field) => records.some((item) => item[field] !== undefined)).slice(0, 4) : []
  const firstField = columns.find((field) => ['displayName', 'name', 'title'].includes(field)) ?? columns[0]

  return <section className="data-panel" aria-label={title}>
    <div className="data-panel-header">
      <div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2>{description && <p>{description}</p>}</div>
      <button className="button button-quiet" type="button" onClick={load} disabled={state.loading}>{state.loading ? 'Refreshing…' : 'Refresh'}</button>
    </div>
    {state.loading ? <div className="data-panel-footer"><LoadingState label={`Loading ${title.toLowerCase()}…`} /></div>
      : state.error ? <div className="data-panel-footer"><ErrorState title={`${title} are unavailable`} description={state.error} action={<button className="button" type="button" onClick={load}>Try again</button>} /></div>
        : !records.length ? <div className="data-panel-footer"><EmptyState title={emptyTitle ?? `No ${title.toLowerCase()} yet`} description={emptyDescription ?? `New ${title.toLowerCase()} will appear here as you add them.`} /></div>
          : <><div className="data-table-wrap"><table className="data-table"><thead><tr>{columns.map((field) => <th key={field}>{columnLabel(field)}</th>)}</tr></thead><tbody>{records.map((record, index) => <tr key={String(record._id ?? record.id ?? index)}>{columns.map((field, fieldIndex) => <td key={field}>{fieldIndex === 0 ? <><span className="record-title">{displayValue(record[field])}</span>{firstField !== field && record._id && <span className="record-detail">Reference: {String(record._id)}</span>}</> : field === 'status' ? <span className="status-badge">{displayValue(record[field])}</span> : displayValue(record[field])}</td>)}</tr>)}</tbody></table></div><div className="data-panel-footer">Showing {records.length} {records.length === 1 ? 'record' : 'records'}</div></>}
  </section>
}
