import { useState, type FormEvent } from 'react'
import { useAuth } from '../../features/auth/AuthProvider'
import { ApiError } from '../api/ApiError'
import { apiRequest } from '../api/client'

type Field = { name: string; label: string; required?: boolean; type?: string; route?: boolean; placeholder?: string }

export function ApiMutationPanel({ title, path, fields, method = 'POST', onSuccess }: { title: string; path: string; fields: readonly Field[]; method?: 'POST' | 'PATCH'; onSuccess?: () => void }) {
  const { session } = useAuth()
  const [error, setError] = useState<string>()
  const [success, setSuccess] = useState<string>()
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) return
    const form = new FormData(event.currentTarget)
    const body: Record<string, unknown> = Object.fromEntries([...form.entries()].filter(([, value]) => String(value).trim() !== ''))
    for (const field of fields) if (field.type === 'number' && body[field.name] !== undefined) body[field.name] = Number(body[field.name])
    const resolvedPath = fields.filter((field) => field.route).reduce((value, field) => value.replace(`:${field.name}`, encodeURIComponent(String(body[field.name] || ''))), path)
    fields.filter((field) => field.route).forEach((field) => delete body[field.name])
    setSubmitting(true); setError(undefined); setSuccess(undefined)
    try {
      await apiRequest({ path: resolvedPath, method, token: session.accessToken, body })
      event.currentTarget.reset()
      setSuccess('Saved successfully.')
      window.dispatchEvent(new CustomEvent('salon:data-mutated', { detail: { path } }))
      onSuccess?.()
    } catch (cause) {
      setError(cause instanceof ApiError && cause.status === 400 ? 'Please review the information and try again.' : 'We couldn’t save your changes. Please try again.')
    } finally { setSubmitting(false) }
  }

  return <section className="contract-section"><h2>{title}</h2><p>Complete the details below. Fields marked with * are required.</p><form onSubmit={submit} noValidate><div className="form-grid">{fields.map((field) => <label key={field.name} htmlFor={field.name}>{field.label}{field.required && ' *'}<input id={field.name} name={field.name} required={field.required} type={field.type || 'text'} placeholder={field.placeholder} disabled={submitting} aria-invalid={Boolean(error)} /></label>)}</div>{error && <p className="form-error" role="alert">{error}</p>}{success && <p className="form-success" role="status">{success}</p>}<div><button className="button" disabled={submitting} type="submit">{submitting ? 'Saving…' : 'Save changes'}</button></div></form></section>
}
