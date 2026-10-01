import { useEffect, useState } from 'react'
import { apiRequest } from '../api/client'
import { useAuth } from '../../features/auth/AuthProvider'
import { EmptyState, ErrorState, LoadingState } from './AsyncStates'

export function ApiListPage({ eyebrow, title, path }: { eyebrow: string; title: string; path: string }) {
  const { session } = useAuth(); const [state, setState] = useState<{ loading: boolean; error?: string; data?: unknown[] }>({ loading: true })
  const load = () => { if (!session) return; setState({ loading: true }); apiRequest<{ data: unknown[] }>({ path, method: 'GET', token: session.accessToken }).then((r) => setState({ loading: false, data: r.data })).catch(() => setState({ loading: false, error: 'Unable to load data. Check your access and try again.' })) }
  useEffect(load, [session?.accessToken, path])
  return <section><div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></div><button className="button button-secondary" onClick={load}>Refresh</button></div>{state.loading ? <LoadingState label={`Loading ${title.toLowerCase()}…`} /> : state.error ? <><ErrorState title={`${title} could not be loaded`} description={state.error} /><button className="button" onClick={load}>Retry</button></> : !state.data?.length ? <EmptyState title={`No ${title.toLowerCase()} found`} description="The shared API returned no records for your current access." /> : <pre className="api-records">{JSON.stringify(state.data, null, 2)}</pre>}</section>
}
