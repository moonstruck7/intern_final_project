import { ContractUnavailableSection } from '../../shared/components/ContractUnavailableSection'
import { getInventoryContractRequirement } from './inventoryApi'

export function InventoryPage() {
  return <section className="inventory-page">
    <div className="page-heading"><div><p className="eyebrow">B3 Inventory</p><h1>Inventory</h1><p className="muted">Inventory items, stock, and movements will be maintained through the shared API and become an upstream source for B4 reporting without a duplicate analytics dataset.</p></div></div>
    <div className="catalog-grid">
      <ContractUnavailableSection eyebrow="B3 Inventory" title="Products and inventory items" description="Create, edit, categorize, and view inventory items only after the approved product and category contract is available." missing={getInventoryContractRequirement('products').missing} />
      <ContractUnavailableSection eyebrow="B3 Inventory" title="Stock" description="Current stock and stock-in/stock-out operations will use backend-owned stock rules; quantities and adjustment behavior are not assumed." missing={getInventoryContractRequirement('stock').missing} />
      <ContractUnavailableSection eyebrow="B3 Inventory" title="Stock transactions" description="Stock movements will remain attached to canonical inventory items once their contract and approved relationships are available." missing={getInventoryContractRequirement('transactions').missing} />
      <ContractUnavailableSection eyebrow="B3 Inventory" title="Inventory history" description="Inventory history will be sourced from integrated stock and transaction data, not a separate frontend record set." missing={getInventoryContractRequirement('history').missing} />
      <ContractUnavailableSection eyebrow="B3 Inventory" title="Low stock" description="Low-stock identification will come from backend-approved thresholds and rules; the frontend does not calculate it independently." missing={getInventoryContractRequirement('lowStock').missing} />
    </div>
  </section>
}
