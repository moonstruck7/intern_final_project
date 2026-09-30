import { ContractUnavailableSection } from '../../shared/components/ContractUnavailableSection'
import { getCatalogContractRequirement } from './serviceCatalogApi'

export function ServicesPage() {
  return <section className="services-page">
    <div className="page-heading"><div><p className="eyebrow">B1 Services</p><h1>Service catalog</h1><p className="muted">This is the canonical management boundary for service data that A3 Appointments and A4 Billing will consume from the shared API.</p></div></div>
    <div className="catalog-grid">
      <ContractUnavailableSection eyebrow="B1 Service catalog" title="Services" description="Manage the shared service records used in appointment selection and billable line items." missing={getCatalogContractRequirement('services').missing} />
      <ContractUnavailableSection eyebrow="B1 Service catalog" title="Service categories" description="Manage the categories services belong to once the approved category relationship is available." missing={getCatalogContractRequirement('categories').missing} />
      <ContractUnavailableSection eyebrow="B1 Service catalog" title="Packages" description="Package functionality is intentionally deferred because approved package business rules are not available." missing={getCatalogContractRequirement('packages').missing} />
    </div>
  </section>
}
