import { EmptyState } from './AsyncStates'

interface ContractUnavailableSectionProps {
  eyebrow: string
  title: string
  description: string
  missing: readonly string[]
}

/** Reusable visible boundary for a module feature blocked on an approved API contract. */
export function ContractUnavailableSection({ eyebrow, title, description, missing }: ContractUnavailableSectionProps) {
  const headingId = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-heading`
  return <section className="contract-section" aria-labelledby={headingId}>
    <div><p className="eyebrow">{eyebrow}</p><h2 id={headingId}>{title}</h2><p className="muted">{description}</p></div>
    <EmptyState title={`${title} unavailable`} description={`NEEDS API CONTRACT: ${missing.join('; ')}.`} />
  </section>
}
