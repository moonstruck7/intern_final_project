import { EmptyState } from './AsyncStates'
export function ModulePlaceholderPage({ title }: { title: string }) {
  return <section><p className="eyebrow">Module boundary ready</p><h1>{title}</h1><EmptyState title="This module has not been implemented" description="Its route, protected application layout, API boundary, responsive styles, and standard empty/error/loading patterns are ready. Implement it against the agreed shared API contract." /></section>
}
