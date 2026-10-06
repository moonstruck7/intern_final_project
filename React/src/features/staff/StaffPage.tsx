import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { ApiError } from '../../shared/api/ApiError'
import { EmptyState, ErrorState, LoadingState } from '../../shared/components/AsyncStates'
import { formatDate, formatStatus } from '../../shared/formatters'
import {
  createAttendance,
  createAvailability,
  createLeave,
  createStaff,
  getAttendance,
  getAvailability,
  getLeave,
  getStaff,
  updateAttendance,
  updateAvailability,
  updateLeave,
  updateStaff,
  type ActiveStatus,
  type AttendanceRecord,
  type AttendanceStatus,
  type AvailabilityRecord,
  type LeaveRecord,
  type LeaveStatus,
  type StaffRecord,
} from './staffApi'

type Editor =
  | { kind: 'staff'; record?: StaffRecord }
  | { kind: 'availability'; record?: AvailabilityRecord }
  | { kind: 'attendance'; record?: AttendanceRecord }
  | { kind: 'leave'; record?: LeaveRecord }

type StaffWorkspaceTab = 'overview' | 'availability' | 'attendance' | 'leave'

function today() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (!parts.length || !parts[0]) return 'ST'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function fail(error: unknown, fallback: string) {
  const message = error instanceof ApiError ? (error.details as { error?: { message?: unknown } } | undefined)?.error?.message : undefined
  return typeof message === 'string' && message ? message : error instanceof ApiError && error.status === 403 ? 'You do not have permission to manage staff.' : fallback
}

export function StaffPage() {
  const { session } = useAuth()
  const [staff, setStaff] = useState<StaffRecord[]>([])
  const [availability, setAvailability] = useState<AvailabilityRecord[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [leave, setLeave] = useState<LeaveRecord[]>([])
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [status, setStatus] = useState<ActiveStatus | ''>('')
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [selectedDate, setSelectedDate] = useState(today)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [editor, setEditor] = useState<Editor>()
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string>()
  const [success, setSuccess] = useState<string>()
  const [activeTab, setActiveTab] = useState<StaffWorkspaceTab>('overview')

  // Form states
  const [displayName, setDisplayName] = useState('')
  const [designation, setDesignation] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [formStatus, setFormStatus] = useState<ActiveStatus>('active')
  const [date, setDate] = useState(today)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>('present')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [leaveStatus, setLeaveStatus] = useState<LeaveStatus>('pending')
  const [endDate, setEndDate] = useState(today)
  const [reason, setReason] = useState('')

  const staffById = useMemo(() => new Map(staff.map((person) => [person._id, person])), [staff])

  // Real-time derived stats
  const totalStaff = staff.length
  const activeStaff = useMemo(() => staff.filter((s) => s.status === 'active').length, [staff])
  const presentToday = useMemo(
    () => attendance.filter((a) => a.date === selectedDate && a.status === 'present').length,
    [attendance, selectedDate]
  )
  const onLeave = useMemo(
    () => leave.filter((l) => l.status === 'approved' && l.startDate <= selectedDate && l.endDate >= selectedDate).length,
    [leave, selectedDate]
  )

  const filteredAvailability = useMemo(
    () => availability.filter((item) => (!selectedStaffId || item.staffId === selectedStaffId) && (!selectedDate || item.date === selectedDate)),
    [availability, selectedDate, selectedStaffId]
  )
  const filteredAttendance = useMemo(
    () => attendance.filter((item) => (!selectedStaffId || item.staffId === selectedStaffId) && (!selectedDate || item.date === selectedDate)),
    [attendance, selectedDate, selectedStaffId]
  )
  const filteredLeave = useMemo(
    () => leave.filter((item) => !selectedStaffId || item.staffId === selectedStaffId),
    [leave, selectedStaffId]
  )

  const load = useCallback(async () => {
    if (!session) return
    setLoading(true)
    setError(undefined)
    try {
      const [people, availabilityData, attendanceData, leaveData] = await Promise.all([
        getStaff(session.accessToken, { search: appliedSearch || undefined, status: status || undefined, limit: 100 }),
        getAvailability(session.accessToken),
        getAttendance(session.accessToken),
        getLeave(session.accessToken),
      ])
      setStaff(people.data)
      setAvailability(availabilityData.data)
      setAttendance(attendanceData.data)
      setLeave(leaveData.data)
    } catch (cause) {
      setError(fail(cause, 'We couldn’t load staff operations. Please try again.'))
    } finally {
      setLoading(false)
    }
  }, [appliedSearch, session, status])

  useEffect(() => {
    void load()
  }, [load])

  function open(next: Editor) {
    setEditor(next)
    setFormError(undefined)
    setSuccess(undefined)
    setDisplayName('')
    setDesignation('')
    setEmail('')
    setPhone('')
    setFormStatus('active')
    setDate(selectedDate || today())
    setStartTime('')
    setEndTime('')
    setAttendanceStatus('present')
    setCheckIn('')
    setCheckOut('')
    setLeaveStatus('pending')
    setEndDate(selectedDate || today())
    setReason('')
    if (next.kind === 'staff' && next.record) {
      setDisplayName(next.record.displayName)
      setDesignation(next.record.designation ?? '')
      setEmail(next.record.email ?? '')
      setPhone(next.record.phone ?? '')
      setFormStatus(next.record.status)
    }
    if (next.kind === 'availability' && next.record) {
      setDate(next.record.date)
      setStartTime(next.record.startTime)
      setEndTime(next.record.endTime)
      setFormStatus(next.record.status)
    }
    if (next.kind === 'attendance' && next.record) {
      setDate(next.record.date)
      setAttendanceStatus(next.record.status)
      setCheckIn(next.record.checkIn ?? '')
      setCheckOut(next.record.checkOut ?? '')
    }
    if (next.kind === 'leave' && next.record) {
      setDate(next.record.startDate)
      setEndDate(next.record.endDate)
      setLeaveStatus(next.record.status)
      setReason(next.record.reason ?? '')
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session || !editor) return
    const staffId = editor.kind === 'staff' ? '' : editor.record?.staffId ?? selectedStaffId
    if (editor.kind !== 'staff' && !staffId) {
      setFormError('Select a team member first.')
      return
    }
    if (editor.kind === 'staff' && !displayName.trim()) {
      setFormError('Enter the staff member’s full name.')
      return
    }
    if (editor.kind === 'availability' && (!date || !startTime || !endTime)) {
      setFormError('Enter a date, start time, and end time.')
      return
    }
    if (editor.kind === 'attendance' && !date) {
      setFormError('Enter an attendance date.')
      return
    }
    if (editor.kind === 'leave' && (!date || !endDate)) {
      setFormError('Enter a start and end date for leave.')
      return
    }
    setSaving(true)
    setFormError(undefined)
    try {
      if (editor.kind === 'staff') {
        const body = {
          displayName: displayName.trim(),
          designation: designation.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          status: formStatus,
        }
        if (editor.record) await updateStaff(session.accessToken, editor.record._id, body)
        else await createStaff(session.accessToken, body)
      } else if (editor.kind === 'availability') {
        const body = { staffId, date, startTime, endTime, status: formStatus }
        if (editor.record) await updateAvailability(session.accessToken, editor.record._id, body)
        else await createAvailability(session.accessToken, body)
      } else if (editor.kind === 'attendance') {
        const body = {
          staffId,
          date,
          status: attendanceStatus,
          checkIn: checkIn || undefined,
          checkOut: checkOut || undefined,
        }
        if (editor.record) await updateAttendance(session.accessToken, editor.record._id, body)
        else await createAttendance(session.accessToken, body)
      } else {
        const body = { staffId, startDate: date, endDate, status: leaveStatus, reason: reason.trim() || undefined }
        if (editor.record) await updateLeave(session.accessToken, editor.record._id, body)
        else await createLeave(session.accessToken, body)
      }
      setSuccess(`${editor.kind === 'staff' ? 'Staff profile' : editor.kind === 'availability' ? 'Working hours' : editor.kind === 'attendance' ? 'Attendance record' : 'Time away record'} saved successfully.`)
      setEditor(undefined)
      await load()
    } catch (cause) {
      setFormError(fail(cause, 'We couldn’t save this record. Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="staff-workspace">
      {/* Header */}
      <div className="page-heading">
        <div>
          <p className="eyebrow">Team Operations</p>
          <h1>Staff & Team</h1>
          <p className="page-intro">Manage your team members, date-specific working hours, attendance tracking, and time away.</p>
        </div>
        <div className="page-heading-actions">
          {activeTab === 'overview' && <button className="button" type="button" onClick={() => open({ kind: 'staff' })}>+ Add staff member</button>}
          {activeTab === 'availability' && <button className="button" type="button" onClick={() => open({ kind: 'availability' })}>+ Add availability</button>}
          {activeTab === 'attendance' && <button className="button" type="button" onClick={() => open({ kind: 'attendance' })}>+ Record attendance</button>}
          {activeTab === 'leave' && <button className="button" type="button" onClick={() => open({ kind: 'leave' })}>+ Add leave</button>}
        </div>
      </div>

      {success && (
        <p className="form-success" role="status">
          {success}
        </p>
      )}

      {/* Summary / Quick Stats */}
      <section className="dashboard-grid staff-stats-grid" aria-label="Team metrics summary">
        <article className="metric-card">
          <p>Total Staff</p>
          <strong>{totalStaff}</strong>
        </article>
        <article className="metric-card">
          <p>Active Members</p>
          <strong>{activeStaff}</strong>
        </article>
        <article className="metric-card">
          <p>Present Today</p>
          <strong>{presentToday}</strong>
        </article>
        <article className="metric-card">
          <p>On Leave</p>
          <strong>{onLeave}</strong>
        </article>
      </section>

      <div className="workspace-tabs" role="tablist" aria-label="Staff workspace sections">
        {([
          ['overview', 'Overview'],
          ['availability', 'Availability'],
          ['attendance', 'Attendance'],
          ['leave', 'Leave'],
        ] as const).map(([tab, label]) => (
          <button
            key={tab}
            className={`workspace-tab${activeTab === tab ? ' is-active' : ''}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filters Toolbar */}
      <section className="staff-toolbar" aria-label="Staff filters">
        <form
          id="staff-search-form"
          onSubmit={(event) => {
            event.preventDefault()
            setAppliedSearch(search.trim())
          }}
        >
          <label className="visually-hidden" htmlFor="staff-search">
            Search staff
          </label>
          <input
            id="staff-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by staff name or designation…"
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
          <select value={status} onChange={(event) => setStatus(event.target.value as ActiveStatus | '')}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <label>
          Staff Filter
          <select value={selectedStaffId} onChange={(event) => setSelectedStaffId(event.target.value)}>
            <option value="">All team members</option>
            {staff.map((person) => (
              <option key={person._id} value={person._id}>
                {person.displayName}
              </option>
            ))}
          </select>
        </label>
        <label>
          Active Date
          <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
        </label>
      </section>

      {error ? (
        <ErrorState
          title="Staff operations are unavailable"
          description={error}
          action={
            <button className="button" type="button" onClick={() => void load()}>
              Try again
            </button>
          }
        />
      ) : loading ? (
        <LoadingState label="Loading staff operations…" />
      ) : (
        <>
          {activeTab === 'overview' && <section className="staff-section" aria-labelledby="team-directory-heading">
            <header>
              <div>
                <p className="eyebrow">Team Directory</p>
                <h2 id="team-directory-heading">Staff Members</h2>
                <p>Team members eligible for appointments, working hour allocation, and scheduling.</p>
              </div>
              <button className="button button-secondary" type="button" onClick={() => open({ kind: 'staff' })}>
                + Add staff member
              </button>
            </header>

            {staff.length ? (
              <div className="staff-card-grid">
                {staff.map((person) => {
                  const todayHours = availability.filter((a) => a.staffId === person._id && a.date === selectedDate)
                  return (
                    <article key={person._id} className="staff-member-card">
                      <div className="staff-card-top">
                        <div className="staff-avatar" aria-hidden="true">
                          {getInitials(person.displayName)}
                        </div>
                        <div className="staff-card-info">
                          <div className="staff-card-name-row">
                            <strong>{person.displayName}</strong>
                            <span className={`status-badge status-${person.status}`}>{formatStatus(person.status)}</span>
                          </div>
                          <p className="staff-designation">{person.designation || 'Salon Specialist'}</p>
                          <div className="staff-contact-info">
                            {person.email && <span>✉ {person.email}</span>}
                            {person.phone && <span>☎ {person.phone}</span>}
                            {!person.email && !person.phone && <span className="muted">No contact recorded</span>}
                          </div>
                        </div>
                      </div>

                      <div className="staff-card-schedule">
                        <span className="schedule-label">Hours ({formatDate(selectedDate)}):</span>
                        <strong className="schedule-value">
                          {todayHours.length
                            ? todayHours.map((h) => `${h.startTime}–${h.endTime}`).join(', ')
                            : 'No hours scheduled'}
                        </strong>
                      </div>

                      <div className="staff-card-footer">
                        <button
                          className="button button-secondary button-small"
                          type="button"
                          onClick={() => open({ kind: 'staff', record: person })}
                        >
                          Edit profile
                        </button>
                        <button
                          className="button button-quiet button-small"
                          type="button"
                          onClick={() => {
                            setSelectedStaffId(person._id)
                            open({ kind: 'availability' })
                          }}
                        >
                          + Set hours
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              <EmptyState
                title="No staff members found"
                description="Add your salon stylists, therapists, and specialists to start managing appointments and schedules."
                action={
                  <button className="button" type="button" onClick={() => open({ kind: 'staff' })}>
                    + Add your first staff member
                  </button>
                }
              />
            )}
          </section>}

          {activeTab === 'availability' && <section className="staff-section" aria-labelledby="working-hours-heading">
              <header>
                <div>
                  <p className="eyebrow">Scheduling</p>
                  <h2 id="working-hours-heading">Working Hours</h2>
                  <p>Date-specific availability for {formatDate(selectedDate)}.</p>
                </div>
                <button
                  className="button button-secondary button-small"
                  type="button"
                  onClick={() => open({ kind: 'availability' })}
                >
                  + Add availability
                </button>
              </header>

              {filteredAvailability.length ? (
                <div className="operations-list">
                  {filteredAvailability.map((item) => (
                    <article key={item._id} className="operation-item">
                      <div>
                        <strong>{staffById.get(item.staffId)?.displayName ?? 'Staff member'}</strong>
                        <span>
                          {formatDate(item.date)} · {item.startTime} — {item.endTime}
                        </span>
                      </div>
                      <span className={`status-badge status-${item.status}`}>{formatStatus(item.status)}</span>
                      <button
                        className="button button-secondary button-small"
                        type="button"
                        onClick={() => open({ kind: 'availability', record: item })}
                      >
                        Edit
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No availability recorded"
                  description={`No working hours configured for ${formatDate(selectedDate)}.`}
                  action={
                    <button
                      className="button button-secondary button-small"
                      type="button"
                      onClick={() => open({ kind: 'availability' })}
                    >
                      + Add working hours
                    </button>
                  }
                />
              )}
          </section>}

          {activeTab === 'attendance' && <section className="staff-section" aria-labelledby="attendance-heading">
              <header>
                <div>
                  <p className="eyebrow">Daily Tracking</p>
                  <h2 id="attendance-heading">Attendance</h2>
                  <p>Check-in and check-out tracking for {formatDate(selectedDate)}.</p>
                </div>
                <button
                  className="button button-secondary button-small"
                  type="button"
                  onClick={() => open({ kind: 'attendance' })}
                >
                  + Record attendance
                </button>
              </header>

              {filteredAttendance.length ? (
                <div className="operations-list">
                  {filteredAttendance.map((item) => (
                    <article key={item._id} className="operation-item">
                      <div>
                        <strong>{staffById.get(item.staffId)?.displayName ?? 'Staff member'}</strong>
                        <span>
                          {item.checkIn ? `In: ${item.checkIn}` : 'No check-in'} · {item.checkOut ? `Out: ${item.checkOut}` : 'No check-out'}
                        </span>
                      </div>
                      <span className={`status-badge status-${item.status}`}>{formatStatus(item.status)}</span>
                      <button
                        className="button button-secondary button-small"
                        type="button"
                        onClick={() => open({ kind: 'attendance', record: item })}
                      >
                        Edit
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No attendance recorded"
                  description={`No attendance logged for ${formatDate(selectedDate)}.`}
                  action={
                    <button
                      className="button button-secondary button-small"
                      type="button"
                      onClick={() => open({ kind: 'attendance' })}
                    >
                      + Record attendance
                    </button>
                  }
                />
              )}
          </section>}

          {activeTab === 'leave' && <section className="staff-section" aria-labelledby="time-away-heading">
            <header>
              <div>
                <p className="eyebrow">Leave Management</p>
                <h2 id="time-away-heading">Time Away & Leave</h2>
                <p>Approved leaves, vacation requests, and team time off records.</p>
              </div>
              <button
                className="button button-secondary"
                type="button"
                onClick={() => open({ kind: 'leave' })}
              >
                + Add leave
              </button>
            </header>

            {filteredLeave.length ? (
              <div className="operations-list">
                {filteredLeave.map((item) => (
                  <article key={item._id} className="operation-item">
                    <div>
                      <strong>{staffById.get(item.staffId)?.displayName ?? 'Staff member'}</strong>
                      <span>
                        {formatDate(item.startDate)} — {formatDate(item.endDate)}
                        {item.reason ? ` · ${item.reason}` : ''}
                      </span>
                    </div>
                    <span className={`status-badge status-${item.status}`}>{formatStatus(item.status)}</span>
                    <button
                      className="button button-secondary button-small"
                      type="button"
                      onClick={() => open({ kind: 'leave', record: item })}
                    >
                      Edit
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No time away records"
                description="No active leave or scheduled time off recorded for the team."
                action={
                  <button
                    className="button button-secondary button-small"
                    type="button"
                    onClick={() => open({ kind: 'leave' })}
                  >
                    + Add leave record
                  </button>
                }
              />
            )}
          </section>}
        </>
      )}

      {/* Editor Modal */}
      {editor && (
        <section className="staff-editor" role="dialog" aria-modal="true" aria-labelledby="staff-editor-title">
          <div className="appointment-editor-header">
            <div>
              <p className="eyebrow">
                {editor.record ? 'Edit Record' : 'Create Record'}
              </p>
              <h2 id="staff-editor-title">
                {editor.kind === 'staff'
                  ? editor.record ? `Edit ${editor.record.displayName}` : 'Add Staff Member'
                  : editor.kind === 'availability'
                  ? 'Set Working Hours'
                  : editor.kind === 'attendance'
                  ? 'Record Attendance'
                  : 'Record Time Away'}
              </h2>
              <p>Changes persist immediately to the shared salon database.</p>
            </div>
            <button className="button button-quiet" type="button" onClick={() => setEditor(undefined)}>
              Close
            </button>
          </div>
          <form onSubmit={submit}>
            <div className="form-grid">
              {editor.kind === 'staff' ? (
                <>
                  <label>
                    Full name *
                    <input
                      required
                      placeholder="e.g. Elena Rostova"
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      disabled={saving}
                    />
                  </label>
                  <label>
                    Designation / Title
                    <input
                      placeholder="e.g. Master Stylist, Colorist"
                      value={designation}
                      onChange={(event) => setDesignation(event.target.value)}
                      disabled={saving}
                    />
                  </label>
                  <label>
                    Email address
                    <input
                      type="email"
                      placeholder="elena@salon.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      disabled={saving}
                    />
                  </label>
                  <label>
                    Phone number
                    <input
                      placeholder="+1 (555) 234-5678"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      disabled={saving}
                    />
                  </label>
                  <label>
                    Profile Status
                    <select
                      value={formStatus}
                      onChange={(event) => setFormStatus(event.target.value as ActiveStatus)}
                      disabled={saving}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </label>
                </>
              ) : (
                <>
                  <label style={{ gridColumn: '1 / -1' }}>
                    Team Member *
                    <select
                      value={editor.record?.staffId ?? selectedStaffId}
                      onChange={(event) => setSelectedStaffId(event.target.value)}
                      disabled={saving || Boolean(editor.record)}
                    >
                      <option value="">Select a team member</option>
                      {staff.map((person) => (
                        <option key={person._id} value={person._id}>
                          {person.displayName} {person.designation ? `(${person.designation})` : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                  {editor.kind === 'availability' && (
                    <>
                      <label>
                        Date *
                        <input required type="date" value={date} onChange={(event) => setDate(event.target.value)} disabled={saving} />
                      </label>
                      <label>
                        Start time *
                        <input required type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} disabled={saving} />
                      </label>
                      <label>
                        End time *
                        <input required type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} disabled={saving} />
                      </label>
                      <label>
                        Status
                        <select value={formStatus} onChange={(event) => setFormStatus(event.target.value as ActiveStatus)} disabled={saving}>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </label>
                    </>
                  )}
                  {editor.kind === 'attendance' && (
                    <>
                      <label>
                        Date *
                        <input required type="date" value={date} onChange={(event) => setDate(event.target.value)} disabled={saving} />
                      </label>
                      <label>
                        Attendance Status
                        <select
                          value={attendanceStatus}
                          onChange={(event) => setAttendanceStatus(event.target.value as AttendanceStatus)}
                          disabled={saving}
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                        </select>
                      </label>
                      <label>
                        Check-in Time
                        <input type="time" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} disabled={saving} />
                      </label>
                      <label>
                        Check-out Time
                        <input type="time" value={checkOut} onChange={(event) => setCheckOut(event.target.value)} disabled={saving} />
                      </label>
                    </>
                  )}
                  {editor.kind === 'leave' && (
                    <>
                      <label>
                        Start Date *
                        <input required type="date" value={date} onChange={(event) => setDate(event.target.value)} disabled={saving} />
                      </label>
                      <label>
                        End Date *
                        <input required type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} disabled={saving} />
                      </label>
                      <label>
                        Approval Status
                        <select
                          value={leaveStatus}
                          onChange={(event) => setLeaveStatus(event.target.value as LeaveStatus)}
                          disabled={saving}
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </label>
                      <label>
                        Reason / Notes
                        <input
                          placeholder="e.g. Annual leave, Personal day"
                          value={reason}
                          onChange={(event) => setReason(event.target.value)}
                          disabled={saving}
                        />
                      </label>
                    </>
                  )}
                </>
              )}
            </div>
            {formError && (
              <p className="form-error" role="alert">
                {formError}
              </p>
            )}
            <div className="form-actions">
              <button className="button" type="submit" disabled={saving}>
                {saving ? 'Saving…' : editor.record ? 'Save changes' : 'Create record'}
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
