import { ContractUnavailableSection } from '../../shared/components/ContractUnavailableSection'
import { getStaffContractRequirement } from './staffApi'

export function StaffPage() {
  return <section className="staff-page">
    <div className="page-heading"><div><p className="eyebrow">B2 Staff operations</p><h1>Staff</h1><p className="muted">This is the canonical staff-management boundary for A3 appointment scheduling and availability checks through the shared backend API.</p></div></div>
    <div className="catalog-grid">
      <ContractUnavailableSection eyebrow="B2 Staff operations" title="Staff records and profiles" description="Manage staff records, profiles, and approved business roles or designations once the shared staff API contract is available." missing={getStaffContractRequirement('staff').missing} />
      <ContractUnavailableSection eyebrow="B2 Staff operations" title="Scheduling and availability" description="Scheduling will provide the real availability A3 needs for appointments; no shifts or working hours are assumed here." missing={getStaffContractRequirement('scheduling').missing} />
      <ContractUnavailableSection eyebrow="B2 Staff operations" title="Attendance" description="Attendance is deferred until approved records, rules, and authorization are defined by the backend contract." missing={getStaffContractRequirement('attendance').missing} />
      <ContractUnavailableSection eyebrow="B2 Staff operations" title="Leave" description="Leave is deferred until approved leave policies, lifecycle rules, and API contract are defined." missing={getStaffContractRequirement('leave').missing} />
    </div>
  </section>
}
