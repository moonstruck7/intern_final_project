import type { ReactNode } from 'react'

interface StateProps {
  title?: string
  description?: string
  label?: string
  action?: ReactNode
}

export function LoadingState({ label = 'Loading your salon data…' }: StateProps) {
  return <div className="state-card loading-state" aria-live="polite"><span className="state-icon" aria-hidden="true">◌</span><strong>{label}</strong><span className="loading-line" /></div>
}

export function EmptyState({ title = 'Nothing here yet', description, action }: StateProps) {
  return <div className="state-card"><span className="state-icon" aria-hidden="true">✦</span><h2>{title}</h2>{description && <p>{description}</p>}{action}</div>
}

export function ErrorState({ title = 'We couldn’t load this right now', description, action }: StateProps) {
  return <div className="state-card error-state" role="alert"><span className="state-icon" aria-hidden="true">!</span><h2>{title}</h2>{description && <p>{description}</p>}{action}</div>
}
