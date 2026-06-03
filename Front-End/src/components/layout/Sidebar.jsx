import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Brain, BarChart3, LifeBuoy, MapPin,
  Bell, FolderOpen, TrendingUp, Heart, Users, Shield, Settings,
  ChevronLeft, ChevronRight, LogOut, Leaf
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.css';

const ALL_NAV = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard',        roles: ['admin','manager','staff','coordinator'] },
  { to: '/reports',       icon: FileText,        label: 'Reports',          roles: ['admin','manager','staff','coordinator'] },
  { to: '/ai-analysis',   icon: Brain,           label: 'AI Analysis',      roles: ['admin','manager'] },
  { to: '/consolidation', icon: BarChart3,        label: 'Consolidation',    roles: ['admin','manager'] },
  { to: '/support',       icon: LifeBuoy,        label: 'Support Requests', roles: ['admin','manager','staff','coordinator'] },
  { to: '/regions',       icon: MapPin,          label: 'Regions',          roles: ['admin','manager'] },
  { to: '/notifications', icon: Bell,            label: 'Notifications',    roles: ['admin','manager','staff','coordinator'] },
  { to: '/documents',     icon: FolderOpen,      label: 'Documents',        roles: ['admin','manager','staff','coordinator'] },
  { to: '/analytics',     icon: TrendingUp,      label: 'Analytics',        roles: ['admin','manager'] },
  { to: '/prayer',        icon: Heart,           label: 'Prayer Requests',  roles: ['admin','manager','staff','coordinator'] },
  { to: '/users',         icon: Users,           label: 'User Management',  roles: ['admin'] },
  { to: '/security',      icon: Shield,          label: 'Security & Audit', roles: ['admin'] },
  { to: '/settings',      icon: Settings,        label: 'Settings',         roles: ['admin','manager','staff','coordinator'] },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || 'staff';
  const navItems = ALL_NAV.filter(n => n.roles.includes(role));

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-icon"><Leaf size={20} /></div>
        {!collapsed && (
          <div className="logo-text">
            <span className="logo-name">SU Connect</span>
            <span className="logo-sub">Scripture Union</span>
          </div>
        )}
        <button className="collapse-btn" onClick={() => setCollapsed(c => !c)}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            title={collapsed ? label : ''}>
            <Icon size={18} className="nav-icon" />
            {!collapsed && <span className="nav-label">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {!collapsed && user && (
          <div className="user-info">
            <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>{user.avatar}</div>
            <div className="user-details">
              <p className="user-name truncate">{user.name}</p>
              <p className="user-role">{user.role}</p>
            </div>
          </div>
        )}
        <button className="logout-btn btn btn-ghost btn-sm" onClick={handleLogout} title="Logout">
          <LogOut size={16} />
          {!collapsed && 'Logout'}
        </button>
      </div>
    </aside>
  );
}
