import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { ApiError } from '../../shared/api/ApiError'
import { EmptyState, ErrorState, LoadingState } from '../../shared/components/AsyncStates'
import { formatStatus } from '../../shared/formatters'
import { appointmentStatuses, createAppointment, getAppointmentOptions, getAppointments, getQueue, updateAppointment, type AppointmentFilters, type AppointmentRecord, type AppointmentStatus, type AvailabilityOption, type CustomerOption, type ServiceOption, type StaffOption } from './appointmentApi'

type ViewMode = 'day' | 'week'
type Options = { customers: CustomerOption[]; services: ServiceOption[]; staff: StaffOption[]; availability: AvailabilityOption[] }
type FormValues = { customerId: string; serviceId: string; staffId: string; date: string; startTime: string; status: AppointmentStatus }

const emptyOptions: Options = { customers: [], services: [], staff: [], availability: [] }

function localDate(value = new Date()) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function offsetDate(date: string, days: number) {
  const next = new Date(`${date}T12:00:00`)
  next.setDate(next.getDate() + days)
  return localDate(next)
}

function dayLabel(date: string) {
  return new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(`${date}T12:00:00`))
}

function statusLabel(status: AppointmentStatus) { return formatStatus(status) }

function messageFor(error: unknown) {
  if (error instanceof ApiError) {
    const details = error.details as { error?: { message?: unknown } } | undefined
    const message = details?.error?.message
    if (typeof message === 'string' && message.trim()) return message
    if (error.status === 403) return 'You do not have permission to manage appointments.'
  }
  return 'We couldn’t save this appointment. Please try again.'
}

function formFrom(record: AppointmentRecord | undefined, date: string): FormValues {
  return {
    customerId: record?.customerId ?? '', serviceId: record?.serviceId ?? '', staffId: record?.staffId ?? '',
    date: record?.date ?? date, startTime: record?.startTime ?? '', status: record?.status ?? 'scheduled',
  }
}

function AppointmentCard({ appointment, customer, service, staff, onOpen }: { appointment: AppointmentRecord; customer?: CustomerOption; service?: ServiceOption; staff?: StaffOption; onOpen: () => void }) {
  return <button type="button" className="appointment-card" onClick={onOpen}>
    <span className="appointment-time">{appointment.startTime} - {appointment.endTime}</span>
    <strong>{customer?.displayName ?? 'Customer unavailable'}</strong>
    <span>{service?.name ?? 'Service unavailable'}</span>
    <span className="appointment-staff">{staff?.displayName ?? 'Staff unavailable'}</span>
    <span className={`status-badge status-${appointment.status}`}>{statusLabel(appointment.status)}</span>
  </button>
}

export function AppointmentsPage() {
  const { session, can } = useAuth()
  const [view, setView] = useState<ViewMode>('day')
  const [selectedDate, setSelectedDate] = useState(localDate)
  const [filters, setFilters] = useState<Omit<AppointmentFilters, 'date' | 'startDate' | 'endDate'>>({})
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([])
  const [queue, setQueue] = useState<AppointmentRecord[]>([])
  const [options, setOptions] = useState<Options>(emptyOptions)
  const [loading, setLoading] = useState(true)
  const [optionsLoading, setOptionsLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [queueError, setQueueError] = useState<string>()
  const [selected, setSelected] = useState<AppointmentRecord>()
  const [editing, setEditing] = useState<AppointmentRecord | 'create'>()
  const [values, setValues] = useState<FormValues>(() => formFrom(undefined, localDate()))
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string>()
  const [success, setSuccess] = useState<string>()
  const [confirmCancel, setConfirmCancel] = useState(false)

  const customerById = useMemo(() => new Map(options.customers.map((item) => [item._id, item])), [options.customers])
  const serviceById = useMemo(() => new Map(options.services.map((item) => [item._id, item])), [options.services])
  const staffById = useMemo(() => new Map(options.staff.map((item) => [item._id, item])), [options.staff])
  const canManageQueue = can({ permissions: ['queue.manage'] })

  const loadAppointments = useCallback(async () => {
    if (!session) return
    setLoading(true); setError(undefined)
    const dateFilters = view === 'day' ? { date: selectedDate } : { startDate: selectedDate, endDate: offsetDate(selectedDate, 6) }
    try {
      const response = await getAppointments(session.accessToken, { ...dateFilters, ...filters })
      setAppointments(response.data)
    } catch (cause) { setError(messageFor(cause)) } finally { setLoading(false) }
  }, [filters, selectedDate, session, view])

  const loadOptions = useCallback(async () => {
    if (!session) return
    setOptionsLoading(true)
    try { setOptions(await getAppointmentOptions(session.accessToken)) } catch (cause) { setError(messageFor(cause)) } finally { setOptionsLoading(false) }
  }, [session])

  const loadQueue = useCallback(async () => {
    if (!session || !canManageQueue) return
    setQueueError(undefined)
    try { setQueue((await getQueue(session.accessToken)).data) } catch (cause) { setQueueError(messageFor(cause)) }
  }, [canManageQueue, session])

  useEffect(() => { void loadAppointments() }, [loadAppointments])
  useEffect(() => { void loadOptions() }, [loadOptions])
  useEffect(() => { void loadQueue() }, [loadQueue])

  function openCreate(date = selectedDate, startTime = '') {
    setValues(formFrom(undefined, date)); setValues((current) => ({ ...current, startTime })); setFormError(undefined); setSuccess(undefined); setEditing('create')
  }
  function openEdit(record: AppointmentRecord) { setValues(formFrom(record, selectedDate)); setFormError(undefined); setSuccess(undefined); setEditing(record); setSelected(undefined) }
  function updateValue<K extends keyof FormValues>(key: K, value: FormValues[K]) { setValues((current) => ({ ...current, [key]: value })) }

  const matchingAvailability = values.staffId && values.date ? options.availability.filter((item) => item.staffId === values.staffId && item.date === values.date) : []
  const selectedService = serviceById.get(values.serviceId)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) return
    if (!values.customerId || !values.serviceId || !values.staffId || !values.date || !values.startTime) { setFormError('Choose a customer, service, staff member, date, and start time.'); return }
    setSaving(true); setFormError(undefined); setSuccess(undefined)
    try {
      const payload = { customerId: values.customerId, serviceId: values.serviceId, staffId: values.staffId, date: values.date, startTime: values.startTime, status: values.status }
      const target = editing
      if (!target) return
      const response = target === 'create' ? await createAppointment(session.accessToken, payload) : await updateAppointment(session.accessToken, target._id, payload)
      setSuccess(target === 'create' ? 'Appointment created.' : 'Appointment updated.')
      setEditing(undefined); setSelected(response.data); await Promise.all([loadAppointments(), loadQueue()])
    } catch (cause) { setFormError(messageFor(cause)) } finally { setSaving(false) }
  }

  async function changeStatus(record: AppointmentRecord, status: AppointmentStatus) {
    if (!session) return
    setSaving(true); setFormError(undefined); setSuccess(undefined)
    try {
      const response = await updateAppointment(session.accessToken, record._id, { status })
      setSelected(response.data); setSuccess(status === 'cancelled' ? 'Appointment cancelled.' : 'Appointment status updated.')
      setConfirmCancel(false); await Promise.all([loadAppointments(), loadQueue()])
    } catch (cause) { setFormError(messageFor(cause)) } finally { setSaving(false) }
  }

  const dates = view === 'day' ? [selectedDate] : Array.from({ length: 7 }, (_, index) => offsetDate(selectedDate, index))
  const terminal = selected && ['completed', 'cancelled', 'no_show'].includes(selected.status)

  return <div className="appointment-workspace">
    <div className="page-heading">
      <div>
        <p className="eyebrow">Scheduling & Queue</p>
        <h1>Appointments</h1>
        <p className="page-intro">Plan your salon schedule with real-time appointments, stylist availability, and daily client queue.</p>
      </div>
      <button className="button" type="button" onClick={() => openCreate()} disabled={optionsLoading}>
        + Book appointment
      </button>
    </div>

    {success && <p className="form-success" role="status">{success}</p>}
    {error && <ErrorState title="Appointments are unavailable" description={error} action={<button className="button" type="button" onClick={() => { void loadAppointments(); void loadOptions() }}>Try again</button>} />}

    {!error && <>
      <section className="schedule-toolbar" aria-label="Appointment calendar controls">
        <div className="view-toggle" role="group" aria-label="Calendar view">
          <button className={view === 'day' ? 'button' : 'button button-secondary'} type="button" onClick={() => setView('day')}>Day view</button>
          <button className={view === 'week' ? 'button' : 'button button-secondary'} type="button" onClick={() => setView('week')}>Week view</button>
        </div>
        <div className="date-controls">
          <button className="button button-secondary" type="button" aria-label="Previous date range" onClick={() => setSelectedDate(offsetDate(selectedDate, view === 'day' ? -1 : -7))}>← Previous</button>
          <input aria-label="Calendar date" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
          <button className="button button-secondary" type="button" onClick={() => setSelectedDate(localDate())}>Today</button>
          <button className="button button-secondary" type="button" aria-label="Next date range" onClick={() => setSelectedDate(offsetDate(selectedDate, view === 'day' ? 1 : 7))}>Next →</button>
        </div>
        <div className="appointment-filters">
          <select aria-label="Filter by status" value={filters.status ?? ''} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as AppointmentStatus || undefined }))}>
            <option value="">All statuses</option>
            {appointmentStatuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
          </select>
          <select aria-label="Filter by staff member" value={filters.staffId ?? ''} onChange={(event) => setFilters((current) => ({ ...current, staffId: event.target.value || undefined }))}>
            <option value="">All team members</option>
            {options.staff.map((staff) => <option key={staff._id} value={staff._id}>{staff.displayName}</option>)}
          </select>
          <select aria-label="Filter by customer" value={filters.customerId ?? ''} onChange={(event) => setFilters((current) => ({ ...current, customerId: event.target.value || undefined }))}>
            <option value="">All customers</option>
            {options.customers.map((customer) => <option key={customer._id} value={customer._id}>{customer.displayName}</option>)}
          </select>
          <select aria-label="Filter by service" value={filters.serviceId ?? ''} onChange={(event) => setFilters((current) => ({ ...current, serviceId: event.target.value || undefined }))}>
            <option value="">All services</option>
            {options.services.map((service) => <option key={service._id} value={service._id}>{service.name}</option>)}
          </select>
        </div>
      </section>

      {loading ? <LoadingState label="Loading calendar appointments…" /> : <section className={`calendar-grid calendar-${view}`} aria-label={`${view === 'day' ? 'Day' : 'Week'} appointment calendar`}>{dates.map((date) => { const dayAppointments = appointments.filter((item) => item.date === date); return <div className="calendar-day" key={date}><header><strong>{dayLabel(date)}</strong><button type="button" className="button button-secondary button-small" onClick={() => openCreate(date)}>+ Book</button></header>{dayAppointments.length ? <div className="appointment-blocks">{dayAppointments.map((item) => <AppointmentCard key={item._id} appointment={item} customer={customerById.get(item.customerId)} service={serviceById.get(item.serviceId)} staff={staffById.get(item.staffId)} onOpen={() => { setSelected(item); setConfirmCancel(false); setFormError(undefined) }} />)}</div> : <button type="button" className="calendar-empty" onClick={() => openCreate(date)}>No appointments scheduled<br /><span>+ Book an appointment</span></button>}</div> })}</section>}

      {canManageQueue && <section className="data-panel queue-panel"><div className="data-panel-header"><div><p className="eyebrow">Daily Schedule</p><h2>Active Queue</h2><p>Appointments ordered sequentially by scheduled start time.</p></div><button className="button button-secondary button-small" type="button" onClick={() => void loadQueue()}>Refresh queue</button></div>{queueError ? <div className="data-panel-footer"><ErrorState title="Today’s queue is unavailable" description={queueError} action={<button className="button" type="button" onClick={() => void loadQueue()}>Try again</button>} /></div> : !queue.length ? <div className="data-panel-footer"><EmptyState title="No customers in today’s queue" description="Your salon queue is currently clear for today." /></div> : <ol className="queue-list">{queue.map((item, index) => <li key={item._id}><span className="queue-position">{index + 1}</span><button type="button" onClick={() => { setSelected(item); setConfirmCancel(false) }}><strong>{customerById.get(item.customerId)?.displayName ?? 'Customer unavailable'}</strong><span>{item.startTime} · {serviceById.get(item.serviceId)?.name ?? 'Service unavailable'} · {staffById.get(item.staffId)?.displayName ?? 'Staff unavailable'}</span></button><span className={`status-badge status-${item.status}`}>{statusLabel(item.status)}</span></li>)}</ol>}</section>}
    </>}

    {editing && <section className="appointment-editor" aria-labelledby="appointment-form-title"><div className="appointment-editor-header"><div><p className="eyebrow">{editing === 'create' ? 'New booking' : 'Update booking'}</p><h2 id="appointment-form-title">{editing === 'create' ? 'Schedule an appointment' : 'Edit appointment'}</h2><p>The server confirms availability, duration, and conflicts when you save.</p></div><button className="button button-quiet" type="button" onClick={() => setEditing(undefined)}>Close</button></div><form onSubmit={submit}><div className="form-grid"><label>Customer *<select value={values.customerId} onChange={(event) => updateValue('customerId', event.target.value)} disabled={saving || optionsLoading}><option value="">Select a customer</option>{options.customers.map((customer) => <option key={customer._id} value={customer._id}>{customer.displayName}</option>)}</select></label><label>Service *<select value={values.serviceId} onChange={(event) => updateValue('serviceId', event.target.value)} disabled={saving || optionsLoading}><option value="">Select a service</option>{options.services.map((service) => <option key={service._id} value={service._id}>{service.name}</option>)}</select>{selectedService && <span className="form-help">Duration: {selectedService.durationMinutes} minutes. End time is set by the server.</span>}</label><label>Staff member *<select value={values.staffId} onChange={(event) => updateValue('staffId', event.target.value)} disabled={saving || optionsLoading}><option value="">Select a staff member</option>{options.staff.map((staff) => <option key={staff._id} value={staff._id}>{staff.displayName}{staff.designation ? ` — ${staff.designation}` : ''}</option>)}</select></label><label>Date *<input required type="date" value={values.date} onChange={(event) => updateValue('date', event.target.value)} disabled={saving} /></label><label>Start time *<input required type="time" value={values.startTime} onChange={(event) => updateValue('startTime', event.target.value)} disabled={saving} /></label><label>Status *<select value={values.status} onChange={(event) => updateValue('status', event.target.value as AppointmentStatus)} disabled={saving || editing !== 'create' && ['completed', 'cancelled', 'no_show'].includes(editing.status)}>{appointmentStatuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select></label></div>{values.staffId && values.date && <p className="availability-note">{matchingAvailability.length ? `Recorded availability: ${matchingAvailability.map((item) => `${item.startTime}–${item.endTime}`).join(', ')}. Final availability is confirmed by the server.` : 'No active availability was returned for this staff member and date. The server will validate before saving.'}</p>}{formError && <p className="form-error" role="alert">{formError}</p>}<div className="form-actions"><button className="button" type="submit" disabled={saving || optionsLoading}>{saving ? 'Saving…' : editing === 'create' ? 'Create appointment' : 'Save appointment'}</button><button className="button button-secondary" type="button" disabled={saving} onClick={() => setEditing(undefined)}>Cancel</button></div></form></section>}

    {selected && <section className="appointment-detail" role="dialog" aria-modal="true" aria-labelledby="appointment-detail-title"><div className="appointment-editor-header"><div><p className="eyebrow">Appointment details</p><h2 id="appointment-detail-title">{customerById.get(selected.customerId)?.displayName ?? 'Customer unavailable'}</h2><p>{selected.date} · {selected.startTime}–{selected.endTime}</p></div><button className="button button-quiet" type="button" onClick={() => { setSelected(undefined); setConfirmCancel(false) }}>Close</button></div><dl className="appointment-detail-grid"><div><dt>Service</dt><dd>{serviceById.get(selected.serviceId)?.name ?? 'Service unavailable'}</dd></div><div><dt>Staff member</dt><dd>{staffById.get(selected.staffId)?.displayName ?? 'Staff unavailable'}</dd></div><div><dt>Status</dt><dd><span className={`status-badge status-${selected.status}`}>{statusLabel(selected.status)}</span></dd></div><div><dt>Appointment reference</dt><dd>{selected._id}</dd></div></dl>{formError && <p className="form-error" role="alert">{formError}</p>}{!terminal && <div className="appointment-actions"><button className="button button-secondary" type="button" disabled={saving} onClick={() => openEdit(selected)}>Edit appointment</button>{selected.status === 'scheduled' && <button className="button" type="button" disabled={saving} onClick={() => void changeStatus(selected, 'arrived')}>Mark arrived</button>}{selected.status === 'arrived' && <button className="button" type="button" disabled={saving} onClick={() => void changeStatus(selected, 'in_progress')}>Start service</button>}{selected.status === 'in_progress' && <button className="button" type="button" disabled={saving} onClick={() => void changeStatus(selected, 'completed')}>Mark completed</button>}{confirmCancel ? <div className="cancel-confirmation"><p>Cancel this appointment? This cannot be undone through the current workflow.</p><button className="button" type="button" disabled={saving} onClick={() => void changeStatus(selected, 'cancelled')}>{saving ? 'Cancelling…' : 'Confirm cancellation'}</button><button className="button button-secondary" type="button" disabled={saving} onClick={() => setConfirmCancel(false)}>Keep appointment</button></div> : <button className="button button-danger" type="button" disabled={saving} onClick={() => setConfirmCancel(true)}>Cancel appointment</button>}</div>}</section>}
  </div>
}
