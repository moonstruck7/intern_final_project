import { ContractUnavailableSection } from '../../shared/components/ContractUnavailableSection'
import { getAppointmentContractRequirement } from './appointmentApi'

export function AppointmentsPage() {
  return <section className="appointments-page">
    <div className="page-heading"><div><p className="eyebrow">A3 Appointments</p><h1>Appointments</h1><p className="muted">Appointments will combine canonical customer data from A2, service data from B1, and staff availability from B2 through the shared API.</p></div></div>
    <div className="catalog-grid">
      <ContractUnavailableSection eyebrow="A3 Appointment operations" title="Appointment records" description="Create, edit, cancel, and view appointments only after the integrated customer, service, staff, and appointment contracts are approved." missing={getAppointmentContractRequirement('appointments').missing} />
      <ContractUnavailableSection eyebrow="A3 Appointment operations" title="Calendar and scheduling" description="The calendar will consume real appointments and B2 availability; no working hours, time slots, or appointment display rules are assumed." missing={getAppointmentContractRequirement('scheduling').missing} />
      <ContractUnavailableSection eyebrow="A3 Appointment operations" title="Queue" description="Queue entries will be related to real appointments once the queue model and operation rules are approved." missing={getAppointmentContractRequirement('queue').missing} />
    </div>
  </section>
}
