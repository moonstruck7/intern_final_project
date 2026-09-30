import { ContractUnavailableSection } from '../../shared/components/ContractUnavailableSection'
import { getBillingContractRequirement } from './billingApi'

export function BillingPage() {
  return <section className="billing-page">
    <div className="page-heading"><div><p className="eyebrow">A4 Billing and POS</p><h1>Billing</h1><p className="muted">Billing will use approved appointment data to resolve its canonical customer, services, and staff attribution before creating invoices and recording payments.</p></div></div>
    <div className="catalog-grid">
      <ContractUnavailableSection eyebrow="A4 Billing and POS" title="Billing and POS" description="Start a bill from a valid A3 appointment once the approved billing preview, calculation, and invoice-creation contracts are available." missing={getBillingContractRequirement('pos').missing} />
      <ContractUnavailableSection eyebrow="A4 Billing and POS" title="Invoices" description="Invoices and line items will be generated from approved integrated data; invoice numbers, statuses, documents, and totals are not assumed." missing={getBillingContractRequirement('invoices').missing} />
      <ContractUnavailableSection eyebrow="A4 Billing and POS" title="Payments" description="Payments will be recorded against approved invoices once payment methods, transaction rules, and authorization are defined." missing={getBillingContractRequirement('payments').missing} />
      <ContractUnavailableSection eyebrow="A4 Billing and POS" title="Billing history" description="Customer and appointment billing history will come from shared API data, not a separate A4 history dataset." missing={getBillingContractRequirement('history').missing} />
    </div>
  </section>
}
