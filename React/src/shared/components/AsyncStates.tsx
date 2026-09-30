interface StateProps { title?: string; description?: string; label?: string }
export function LoadingState({ label = 'Loading…' }: StateProps) { return <main className="state-card" aria-live="polite">{label}</main> }
export function EmptyState({ title = 'Nothing to show yet', description }: StateProps) { return <div className="state-card"><h2>{title}</h2>{description && <p>{description}</p>}</div> }
export function ErrorState({ title = 'Something went wrong', description }: StateProps) { return <div className="state-card error-state" role="alert"><h2>{title}</h2>{description && <p>{description}</p>}</div> }
