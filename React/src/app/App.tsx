import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { RouteAccessBoundary } from './RouteAccessBoundary'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { ServicesPage } from '../features/services/ServicesPage'
import { CustomersPage } from '../features/customers/CustomersPage'
import { StaffPage } from '../features/staff/StaffPage'
import { AppointmentsPage } from '../features/appointments/AppointmentsPage'
import { BillingPage } from '../features/billing/BillingPage'
import { InventoryPage } from '../features/inventory/InventoryPage'
import { ReportsPage } from '../features/reports/ReportsPage'
import { LoginPage } from '../features/auth/LoginPage'
import { NotFoundPage } from '../shared/components/NotFoundPage'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route element={<RouteAccessBoundary access={{ permissions: ['dashboard.read'] }} />}>
            <Route path="dashboard" element={<DashboardPage />} />
          </Route>
          <Route element={<RouteAccessBoundary access={{ permissions: ['services.manage'] }} />}>
            <Route path="services" element={<ServicesPage />} />
          </Route>
          <Route element={<RouteAccessBoundary access={{ permissions: ['customers.manage'] }} />}>
            <Route path="customers" element={<CustomersPage />} />
          </Route>
          <Route element={<RouteAccessBoundary access={{ permissions: ['staff.manage'] }} />}>
            <Route path="staff" element={<StaffPage />} />
          </Route>
          <Route element={<RouteAccessBoundary access={{ permissions: ['appointments.manage'] }} />}>
            <Route path="appointments" element={<AppointmentsPage />} />
          </Route>
          <Route element={<RouteAccessBoundary access={{ permissions: ['platform.manage'] }} />}>
            <Route path="billing" element={<BillingPage />} />
          </Route>
          <Route element={<RouteAccessBoundary access={{ permissions: ['platform.manage'] }} />}>
            <Route path="inventory" element={<InventoryPage />} />
          </Route>
          <Route element={<RouteAccessBoundary access={{ permissions: ['reports.read'] }} />}>
            <Route path="reports" element={<ReportsPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
