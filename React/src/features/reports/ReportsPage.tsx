import { ContractUnavailableSection } from '../../shared/components/ContractUnavailableSection'
import { getReportsContractRequirement } from './reportsApi'

export function ReportsPage() {
  return (
    <section className="reports-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">B4 Reports and engagement</p>
          <h1>Reports</h1>
          <p className="muted">B4 will consume backend-produced, integrated data from customers, services, staff, appointments, billing, and inventory. It does not maintain a second analytics dataset.</p>
        </div>
      </div>
      <div className="catalog-grid">
        <ContractUnavailableSection eyebrow="B4 Reports" title="Operational reports" description="Operational reports, their filters, results, and exports will be rendered only from approved reporting API responses." missing={getReportsContractRequirement('reports').missing} />
        <ContractUnavailableSection eyebrow="B4 Analytics" title="Analytics" description="Appointment, customer, service, billing, staff, and inventory analytics will use backend-defined metrics rather than frontend KPI calculations." missing={getReportsContractRequirement('analytics').missing} />
        <ContractUnavailableSection eyebrow="B4 Business insights" title="Business insights" description="Insights will be displayed only when the shared backend defines their source data, generation rules, and response contract." missing={getReportsContractRequirement('insights').missing} />
        <ContractUnavailableSection eyebrow="B4 Marketing" title="Marketing campaigns" description="Campaign interfaces will integrate with approved segmentation, communication, and campaign contracts; no targeting or promotion behavior is assumed." missing={getReportsContractRequirement('marketing').missing} />
        <ContractUnavailableSection eyebrow="B4 Notifications" title="Notifications" description="Notification interfaces await approved event, delivery, read-state, and preference contracts. No channels or triggers are fabricated." missing={getReportsContractRequirement('notifications').missing} />
      </div>
    </section>
  )
}
