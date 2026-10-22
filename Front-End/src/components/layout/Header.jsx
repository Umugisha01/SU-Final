import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Sun, Moon, Menu, Check, CheckCheck, Clock, Package, Heart, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import './Header.css';

const ICON_MAP = { check: Check, clock: Clock, package: Package, heart: Heart, alert: AlertCircle, bell: Bell };

const ROLE_LABELS = {
  administrator: 'Administrator',
  national_manager: 'National Manager',
  regional_coordinator: 'Regional Coordinator',
  field_officer: 'Field Officer'
};

export default function Header({ onMenuToggle, collapsed }) {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close notif dropdown on ESC
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setShowNotifs(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <header className={`header ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {/* ─── Left: hamburger + search ─── */}
      <div className="header-left">
        <button
          className="btn btn-ghost btn-icon mobile-menu-btn"
          onClick={onMenuToggle}
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        <div className="search-wrapper" style={{ flex: 1, maxWidth: 440 }}>
          <Search size={16} className="search-icon" />
          <input
            className="form-control"
            style={{ paddingLeft: 40, borderRadius: 'var(--radius-full)', background: 'var(--bg-input)' }}
            placeholder="Search reports, documents..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            onKeyDown={e => e.key === 'Enter' && navigate(`/documents?q=${encodeURIComponent(search)}`)}
            aria-label="Search"
          />
        </div>
      </div>

      {/* ─── Right: theme + notifications + user ─── */}
      <div className="header-right">
        {/* Theme toggle */}
        <button
          className="btn btn-ghost btn-icon"
          onClick={toggle}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <div className="notif-wrapper" ref={notifRef}>
          <button
            className="btn btn-ghost btn-icon notif-btn"
            onClick={() => setShowNotifs(s => !s)}
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            aria-expanded={showNotifs}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="notif-badge" aria-hidden="true">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="notif-dropdown slide-up" role="dialog" aria-label="Notifications">
              <div className="notif-header">
                <h4>Notifications</h4>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <button className="btn btn-ghost btn-sm" onClick={markAllRead} title="Mark all read">
                    <CheckCheck size={14} /> <span className="hide-mobile">All read</span>
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => { setShowNotifs(false); navigate('/notifications'); }}
                  >
                    View all
                  </button>
                  <button
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={() => setShowNotifs(false)}
                    aria-label="Close notifications"
                    style={{ display: 'none' }}
                    id="notif-close-btn"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No notifications yet
                  </div>
                ) : notifications.slice(0, 6).map(n => {
                  const Icon = ICON_MAP[n.icon] || Bell;
                  return (
                    <div
                      key={n.id}
                      className={`notif-item ${!n.read ? 'unread' : ''}`}
                      onClick={() => { markRead(n.id); setShowNotifs(false); }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && markRead(n.id)}
                    >
                      <div className={`notif-icon-wrap type-${n.type}`}>
                        <Icon size={14} />
                      </div>
                      <div className="notif-content">
                        <p className="notif-title">{n.title}</p>
                        <p className="notif-msg">{n.message}</p>
                        <p className="notif-time">{n.time}</p>
                      </div>
                      {!n.read && <div className="unread-dot" aria-hidden="true" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* User avatar + info */}
        <div className="header-user">
          <div className="avatar" aria-hidden="true">{user?.avatar}</div>
          {/* .header-user-info is hidden on small phones via CSS */}
          <div className="header-user-info">
            <p className="header-user-name">{user?.name}</p>
            <p className="header-user-role">{ROLE_LABELS[user?.role]}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
