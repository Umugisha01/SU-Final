import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-layout">
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
      />
      <div className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}
           style={{ marginLeft: collapsed ? 68 : 'var(--sidebar-width)' }}>
        <Header
          onMenuToggle={() => setMobileOpen(o => !o)}
          collapsed={collapsed}
        />
        <main className="page-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
