import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'
import type { AccessRequirement } from '../shared/auth/access'

interface NavigationItem { to: string; label: string; icon: string; group: string; access?: AccessRequirement }

const navigation: NavigationItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: '◫', group: 'Overview', access: { permissions: ['dashboard.read'] } },
  { to: '/customers', label: 'Customers', icon: '◎', group: 'Customer experience', access: { permissions: ['customers.manage'] } },
  { to: '/appointments', label: 'Appointments', icon: '□', group: 'Customer experience', access: { permissions: ['appointments.manage'] } },
  { to: '/services', label: 'Services', icon: '✦', group: 'Business', access: { permissions: ['services.manage'] } },
  { to: '/staff', label: 'Team', icon: '◌', group: 'Business', access: { permissions: ['staff.manage'] } },
  { to: '/billing', label: 'Billing', icon: '⌁', group: 'Operations', access: { permissions: ['platform.manage'] } },
  { to: '/inventory', label: 'Inventory', icon: '▤', group: 'Operations', access: { permissions: ['platform.manage'] } },
  { to: '/reports', label: 'Reports', icon: '◔', group: 'Insights', access: { permissions: ['reports.read'] } },
]

export function AppLayout() {
  const { user, logout, can } = useAuth()
  const visibleNavigation = navigation.filter((item) => can(item.access))
  const groups = [...new Set(visibleNavigation.map((item) => item.group))]

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <NavLink className="brand" to="/dashboard"><span className="brand-mark">S</span><span><strong>Salon</strong><small>OPERATIONS</small></span></NavLink>
        <nav>
          {groups.map((group) => <div className="nav-group" key={group}><p>{group}</p>{visibleNavigation.filter((item) => item.group === group).map((item) => (
            <NavLink key={item.to} className="nav-link" to={item.to}><span aria-hidden="true">{item.icon}</span>{item.label}</NavLink>
          ))}</div>)}
        </nav>
        <div className="sidebar-footer"><span className="sidebar-status" aria-hidden="true" />Salon workspace</div>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <div><p className="eyebrow">Salon operations</p><p className="user-name">A calm, capable day starts here.</p></div>
          <div className="topbar-account"><span className="account-avatar" aria-hidden="true">{user?.displayName?.slice(0, 1).toUpperCase() || 'U'}</span><span className="account-copy"><strong>{user?.displayName}</strong><small>Salon team</small></span><button className="button button-quiet sign-out" type="button" onClick={() => logout()}>Sign out</button></div>
        </header>
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  )
}
