import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'
import type { AccessRequirement } from '../shared/auth/access'

interface NavigationItem { to: string; label: string; access?: AccessRequirement }

const navigation: NavigationItem[] = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/customers', label: 'Customers' },
  { to: '/appointments', label: 'Appointments' },
  { to: '/billing', label: 'Billing' },
  { to: '/services', label: 'Services' },
  { to: '/staff', label: 'Staff' },
  { to: '/inventory', label: 'Inventory' },
  { to: '/reports', label: 'Reports' },
]

export function AppLayout() {
  const { user, logout, can } = useAuth()
  const visibleNavigation = navigation.filter((item) => can(item.access))

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <NavLink className="brand" to="/dashboard">Salon SaaS</NavLink>
        <nav>
          {visibleNavigation.map((item) => (
            <NavLink key={item.to} className="nav-link" to={item.to}>{item.label}</NavLink>
          ))}
        </nav>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <div><p className="eyebrow">Staff operations</p><p className="user-name">{user?.displayName}</p></div>
          <button className="button button-secondary" type="button" onClick={() => logout()}>Sign out</button>
        </header>
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  )
}
