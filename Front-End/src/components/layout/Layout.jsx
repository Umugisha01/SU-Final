import { useState, useEffect } from 'react';
import { Navigate, Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, FileText, Heart, LifeBuoy, Bell, Menu, MoreHorizontal,
  Brain, Settings
} from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import SUConnectAI from '../ai/SUConnectAI';
import IdleTimer from './IdleTimer';
import { useNotifications } from '../../contexts/NotificationContext';

/* Bottom-nav items shown on mobile (subset of full sidebar nav).
   Tailored per role for field relevance. */
const BOTTOM_NAV_BASE = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Home',       roles: ['administrator','national_manager','field_officer','regional_coordinator'] },
  { to: '/reports',       icon: FileText,        label: 'Reports',    roles: ['administrator','national_manager','field_officer','regional_coordinator'] },
  { to: '/prayer',        icon: Heart,           label: 'Prayer',     roles: ['administrator','national_manager','field_officer','regional_coordinator'] },
  { to: '/support',       icon: LifeBuoy,        label: 'Support',    roles: ['administrator','national_manager','field_officer','regional_coordinator'] },
  { to: '/notifications', icon: Bell,            label: 'Alerts',     roles: ['administrator','national_manager','field_officer','regional_coordinator'] },
];

export default function Layout() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close sidebar overlay when navigating
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  if (!user) return <Navigate to="/login" replace />;

  const role = user?.role || 'field_officer';
  const bottomNavItems = BOTTOM_NAV_BASE.filter(n => n.roles.includes(role));

  return (
    <div className="app-layout">
      {/* Sidebar overlay backdrop (mobile only) */}
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
      />

      <div className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <Header
          onMenuToggle={() => setMobileOpen(o => !o)}
          collapsed={collapsed}
        />
        <main className="page-body">
          <Outlet />
        </main>
      </div>

      {/* ─── Mobile Bottom Navigation Bar ─────────────────────────────
          Visible only on ≤768px. Gives field officers thumb-zone access.
          CSS for this is in Sidebar.css (.mobile-bottom-nav)
          ──────────────────────────────────────────────────────────── */}
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {bottomNavItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
          const showBadge = to === '/notifications' && unreadCount > 0;
          return (
            <NavLink
              key={to}
              to={to}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
              aria-label={label}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              {showBadge && (
                <span className="mobile-nav-badge">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              <span>{label}</span>
            </NavLink>
          );
        })}
      </nav>

      <SUConnectAI />
      <IdleTimer />
    </div>
  );
}
