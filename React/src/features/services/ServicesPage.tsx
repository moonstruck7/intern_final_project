import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { ApiError } from '../../shared/api/ApiError'
import { EmptyState, ErrorState, LoadingState } from '../../shared/components/AsyncStates'
import { formatCurrency, formatStatus } from '../../shared/formatters'
import {
  createCategory,
  createPackage,
  createService,
  getCategories,
  getPackages,
  getServices,
  updateCategory,
  updatePackage,
  updateService,
  type CatalogStatus,
  type CategoryRecord,
  type PackageRecord,
  type ServiceRecord,
} from './serviceCatalogApi'

type Editor = { kind: 'category'; record?: CategoryRecord } | { kind: 'service'; record?: ServiceRecord } | { kind: 'package'; record?: PackageRecord }

function errorFor(error: unknown, fallback: string) {
  const message = error instanceof ApiError ? (error.details as { error?: { message?: unknown } } | undefined)?.error?.message : undefined
  return typeof message === 'string' && message ? message : error instanceof ApiError && error.status === 403 ? 'You do not have permission to manage services.' : fallback
}

export function ServicesPage() {
  const { session } = useAuth()
  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [services, setServices] = useState<ServiceRecord[]>([])
  const [packages, setPackages] = useState<PackageRecord[]>([])
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [status, setStatus] = useState<CatalogStatus | ''>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [editor, setEditor] = useState<Editor>()
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string>()
  const [success, setSuccess] = useState<string>()
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [price, setPrice] = useState('')
  const [duration, setDuration] = useState('')
  const [serviceIds, setServiceIds] = useState<string[]>([])
  const [formStatus, setFormStatus] = useState<CatalogStatus>('active')

  const categoryName = useMemo(() => new Map(categories.map((category) => [category._id, category.name])), [categories])

  const load = useCallback(async () => {
    if (!session) return
    setLoading(true)
    setError(undefined)
    try {
      const filters = { search: appliedSearch || undefined, status: status || undefined, limit: 100 }
      const [nextCategories, nextServices, nextPackages] = await Promise.all([
        getCategories(session.accessToken, filters),
        getServices(session.accessToken, filters),
        getPackages(session.accessToken, filters),
      ])
      setCategories(nextCategories.data)
      setServices(nextServices.data)
      setPackages(nextPackages.data)
    } catch (cause) {
      setError(errorFor(cause, 'We couldn’t load the service catalog. Please try again.'))
    } finally {
      setLoading(false)
    }
  }, [appliedSearch, session, status])

  useEffect(() => {
    void load()
  }, [load])

  function openEditor(next: Editor) {
    setEditor(next)
    setFormError(undefined)
    setSuccess(undefined)
    if (next.kind === 'service') {
      setName(next.record?.name ?? '')
      setFormStatus(next.record?.status ?? 'active')
      setCategoryId(next.record?.categoryId ?? '')
      setPrice(next.record ? String(next.record.price) : '')
      setDuration(next.record ? String(next.record.durationMinutes) : '')
      setServiceIds([])
    } else if (next.kind === 'package') {
      setName(next.record?.name ?? '')
      setFormStatus(next.record?.status ?? 'active')
      setCategoryId('')
      setPrice('')
      setDuration('')
      setServiceIds(next.record?.serviceIds ?? [])
    } else {
      setName(next.record?.name ?? '')
      setFormStatus(next.record?.status ?? 'active')
      setCategoryId('')
      setPrice('')
      setDuration('')
      setServiceIds([])
    }
  }

  function toggleService(id: string) {
    setServiceIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session || !editor) return
    if (!name.trim()) {
      setFormError('Enter a name.')
      return
    }
    if (editor.kind === 'service') {
      const nextPrice = Number(price)
      const nextDuration = Number(duration)
      if (!categoryId || !Number.isFinite(nextPrice) || nextPrice < 0 || !Number.isInteger(nextDuration) || nextDuration <= 0) {
        setFormError('Choose a category and enter a non-negative price and whole positive duration in minutes.')
        return
      }
    }
    setSaving(true)
    setFormError(undefined)
    setSuccess(undefined)
    try {
      if (editor.kind === 'category') {
        const payload = { name: name.trim(), status: formStatus }
        if (editor.record) await updateCategory(session.accessToken, editor.record._id, payload)
        else await createCategory(session.accessToken, payload)
      } else if (editor.kind === 'service') {
        const payload = {
          name: name.trim(),
          categoryId,
          price: Number(price),
          durationMinutes: Number(duration),
          status: formStatus,
        }
        if (editor.record) await updateService(session.accessToken, editor.record._id, payload)
        else await createService(session.accessToken, payload)
      } else {
        const payload = { name: name.trim(), serviceIds, status: formStatus }
        if (editor.record) await updatePackage(session.accessToken, editor.record._id, payload)
        else await createPackage(session.accessToken, payload)
      }
      setSuccess(`${editor.kind === 'category' ? 'Category' : editor.kind === 'service' ? 'Service' : 'Package'} saved successfully.`)
      setEditor(undefined)
      await load()
    } catch (cause) {
      setFormError(errorFor(cause, 'We couldn’t save this item. Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="service-workspace">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Service menu</p>
          <h1>Services</h1>
          <p className="page-intro">Manage salon treatments, duration, pricing, and service categories.</p>
        </div>
        <div className="page-heading-actions">
          <button className="button button-secondary" type="button" onClick={() => openEditor({ kind: 'category' })}>
            New category
          </button>
          <button className="button" type="button" onClick={() => openEditor({ kind: 'service' })}>
            New service
          </button>
        </div>
      </div>
      {success && (
        <p className="form-success" role="status">
          {success}
        </p>
      )}
      {/* Summary Stats */}
      <section className="dashboard-grid staff-stats-grid" aria-label="Service menu metrics summary">
        <article className="metric-card">
          <p>Total Services</p>
          <strong>{services.length}</strong>
        </article>
        <article className="metric-card">
          <p>Active Services</p>
          <strong>{services.filter((s) => s.status === 'active').length}</strong>
        </article>
        <article className="metric-card">
          <p>Categories</p>
          <strong>{categories.length}</strong>
        </article>
        <article className="metric-card">
          <p>Service Packages</p>
          <strong>{packages.length}</strong>
        </article>
      </section>

      {/* Catalog Filters */}
      <section className="catalog-toolbar" aria-label="Service filters">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            setAppliedSearch(search.trim())
          }}
        >
          <label className="visually-hidden" htmlFor="catalog-search">
            Search services
          </label>
          <input
            id="catalog-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search service name or category…"
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
              }}
            >
              Clear
            </button>
          )}
        </form>
        <label>
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value as CatalogStatus | '')}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </section>

      {error ? (
        <ErrorState
          title="Services are unavailable"
          description={error}
          action={
            <button className="button" type="button" onClick={() => void load()}>
              Try again
            </button>
          }
        />
      ) : loading ? (
        <LoadingState label="Loading service catalogue…" />
      ) : (
        <>
          {/* SECTION 1: SERVICES TABLE */}
          <section className="catalog-section catalog-section-main" aria-labelledby="services-list-heading">
            <header>
              <div>
                <p className="eyebrow">Treatment Menu</p>
                <h2 id="services-list-heading">Services & Treatments</h2>
                <p>Configured salon treatments, pricing, and appointment durations.</p>
              </div>
              <button className="button button-secondary" type="button" onClick={() => openEditor({ kind: 'service' })}>
                + Add service
              </button>
            </header>
            {services.length ? (
              <div className="service-table-wrap">
                <table className="data-table service-table">
                  <colgroup>
                    <col className="service-column-name" />
                    <col className="service-column-category" />
                    <col className="service-column-price" />
                    <col className="service-column-duration" />
                    <col className="service-column-status" />
                    <col className="service-column-actions" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Duration</th>
                      <th>Status</th>
                      <th>
                        <span className="visually-hidden">Action</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((service) => (
                      <tr key={service._id}>
                        <td>
                          <strong>{service.name}</strong>
                        </td>
                        <td>{categoryName.get(service.categoryId) ?? 'Uncategorized'}</td>
                        <td>{formatCurrency(service.price * 100)}</td>
                        <td>{service.durationMinutes} mins</td>
                        <td>
                          <span className={`status-badge status-${service.status}`}>{formatStatus(service.status)}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="button button-secondary button-small"
                            type="button"
                            onClick={() => openEditor({ kind: 'service', record: service })}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No services found"
                description="Create salon services with duration and pricing to enable online and in-salon booking."
                action={
                  <button className="button" type="button" onClick={() => openEditor({ kind: 'service' })}>
                    + Add your first service
                  </button>
                }
              />
            )}
          </section>

          {/* SECTION 2: CATEGORIES & PACKAGES 2-COL */}
          <div className="catalog-support-grid">
            {/* Categories */}
            <section className="catalog-section" aria-labelledby="categories-heading">
              <header>
                <div>
                  <p className="eyebrow">Organization</p>
                  <h2 id="categories-heading">Categories</h2>
                  <p>Organize services into clear treatment groups.</p>
                </div>
                <button
                  className="button button-secondary button-small"
                  type="button"
                  onClick={() => openEditor({ kind: 'category' })}
                >
                  + Add category
                </button>
              </header>
              {categories.length ? (
                <div className="catalog-cards">
                  {categories.map((category) => (
                    <article key={category._id}>
                      <div>
                        <strong>{category.name}</strong>
                        <span className={`status-badge status-${category.status}`}>{formatStatus(category.status)}</span>
                      </div>
                      <button
                        className="button button-secondary button-small"
                        type="button"
                        onClick={() => openEditor({ kind: 'category', record: category })}
                      >
                        Edit
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No categories found"
                  description="Create categories to organize your service menu."
                  action={
                    <button
                      className="button button-secondary button-small"
                      type="button"
                      onClick={() => openEditor({ kind: 'category' })}
                    >
                      + Add category
                    </button>
                  }
                />
              )}
            </section>

            {/* Packages */}
            <section className="catalog-section" aria-labelledby="packages-heading">
              <header>
                <div>
                  <p className="eyebrow">Bundles</p>
                  <h2 id="packages-heading">Service Packages</h2>
                  <p>Combine multiple treatments into popular packages.</p>
                </div>
                <button
                  className="button button-secondary button-small"
                  type="button"
                  onClick={() => openEditor({ kind: 'package' })}
                >
                  + Add package
                </button>
              </header>
              {packages.length ? (
                <div className="catalog-cards">
                  {packages.map((pkg) => (
                    <article key={pkg._id}>
                      <div>
                        <strong>{pkg.name}</strong>
                        <span>{pkg.serviceIds?.length ? `${pkg.serviceIds.length} services included` : 'No bundled services'}</span>
                        <span className={`status-badge status-${pkg.status}`}>{formatStatus(pkg.status)}</span>
                      </div>
                      <button
                        className="button button-secondary button-small"
                        type="button"
                        onClick={() => openEditor({ kind: 'package', record: pkg })}
                      >
                        Edit
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No service packages"
                  description="Bundle popular treatments together into customer packages."
                  action={
                    <button
                      className="button button-secondary button-small"
                      type="button"
                      onClick={() => openEditor({ kind: 'package' })}
                    >
                      + Add package
                    </button>
                  }
                />
              )}
            </section>
          </div>
        </>
      )}

      {editor && (
        <section className="catalog-editor" role="dialog" aria-modal="true" aria-labelledby="catalog-editor-title">
          <div className="appointment-editor-header">
            <div>
              <p className="eyebrow">
                {editor.record ? 'Edit' : 'New'} {editor.kind}
              </p>
              <h2 id="catalog-editor-title">
                {editor.kind === 'category' ? 'Category' : editor.kind === 'service' ? 'Service offering' : 'Service package'}
              </h2>
            </div>
            <button className="button button-quiet" type="button" onClick={() => setEditor(undefined)}>
              Close
            </button>
          </div>
          <form onSubmit={submit}>
            <div className="form-grid">
              <label>
                Name *
                <input required value={name} onChange={(event) => setName(event.target.value)} disabled={saving} />
              </label>
              {editor.kind === 'service' && (
                <>
                  <label>
                    Category *
                    <select required value={categoryId} onChange={(event) => setCategoryId(event.target.value)} disabled={saving}>
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Price ($) *
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(event) => setPrice(event.target.value)}
                      disabled={saving}
                    />
                  </label>
                  <label>
                    Duration (minutes) *
                    <input
                      required
                      type="number"
                      min="1"
                      step="1"
                      value={duration}
                      onChange={(event) => setDuration(event.target.value)}
                      disabled={saving}
                    />
                  </label>
                </>
              )}
              {editor.kind === 'package' && (
                <fieldset className="service-picker" style={{ gridColumn: '1 / -1' }}>
                  <legend>Included services</legend>
                  {services.length ? (
                    services.map((service) => (
                      <label key={service._id}>
                        <input
                          type="checkbox"
                          checked={serviceIds.includes(service._id)}
                          onChange={() => toggleService(service._id)}
                          disabled={saving}
                        />{' '}
                        {service.name} ({formatCurrency(service.price * 100)})
                      </label>
                    ))
                  ) : (
                    <span>No active services available to bundle.</span>
                  )}
                </fieldset>
              )}
              <label>
                Status
                <select value={formStatus} onChange={(event) => setFormStatus(event.target.value as CatalogStatus)} disabled={saving}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </div>
            {formError && (
              <p className="form-error" role="alert">
                {formError}
              </p>
            )}
            <div className="form-actions">
              <button className="button" type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
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
