import { ApiListPage } from '../../shared/components/ApiListPage'
import { ApiMutationPanel } from '../../shared/components/ApiMutationPanel'

export function BillingPage() { return <><ApiListPage eyebrow="A4 Billing and POS" title="Invoices" path="/api/v1/billing/invoices" /><ApiMutationPanel title="Create invoice" path="/api/v1/billing/invoices" fields={[{ name: 'appointmentId', label: 'Appointment ID', required: true }]} /><ApiMutationPanel title="Record payment" path="/api/v1/billing/invoices/:invoiceId/payments" fields={[{ name: 'invoiceId', label: 'Invoice ID', required: true, route: true }, { name: 'amountMinor', label: 'Amount (minor units)', required: true, type: 'number' }, { name: 'method', label: 'Method: cash, card, upi, or other', required: true }]} /></> }
