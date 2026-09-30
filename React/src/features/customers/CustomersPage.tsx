import { ContractUnavailableSection } from '../../shared/components/ContractUnavailableSection'
import { getCustomerContractRequirement } from './customerApi'

export function CustomersPage() {
  return <section className="customers-page">
    <div className="page-heading"><div><p className="eyebrow">A2 Customer CRM</p><h1>Customers</h1><p className="muted">This is the canonical customer-management boundary for future A3 appointment booking, A4 billing, and B4 reporting integrations.</p></div></div>
    <div className="catalog-grid">
      <ContractUnavailableSection eyebrow="A2 Customer CRM" title="Customer records" description="Create, edit, search, filter, and view customer data once the shared customer API contract is approved." missing={getCustomerContractRequirement('customers').missing} />
      <ContractUnavailableSection eyebrow="A2 Customer CRM" title="Customer history" description="Appointments, billing, and approved activity history will be displayed from integrated APIs, never from a duplicate CRM dataset." missing={getCustomerContractRequirement('history').missing} />
      <ContractUnavailableSection eyebrow="A2 Customer CRM" title="Membership and loyalty" description="Membership and loyalty functionality is intentionally deferred until its business rules and API contract are approved." missing={getCustomerContractRequirement('membership').missing} />
    </div>
  </section>
}
