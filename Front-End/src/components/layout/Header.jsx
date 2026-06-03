import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Sun, Moon, Menu, X, Check, CheckCheck, Clock, Package, Heart, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import './Header.css';

const ICON_MAP = { check: Check, clock: Clock, package: Package, heart: Heart, alert: AlertCircle, bell: Bell };

export default function Header({ onMenuToggle, collapsed }) {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const { notifications, unreadCount, markRead, markAllRead, dismiss } = useNotifications();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const [search, setSearch] = useState('');
  const notifRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const ROLE_LABELS = { admin: 'Administrator', manager: 'Regional Manager', staff: 'Staff Member', coordinator: 'Field Coordinator' };

  return (
    <header className="header">
      <div className="header-left">
        <button className="btn btn-ghost btn-icon mobile-menu-btn" onClick={onMenuToggle}>
          <Menu size={20} />
        </button>
        <div className="search-wrapper" style={{ flex: 1, maxWidth: 480 }}>
          <Search size={16} className="search-icon" />
          <input
            className="form-control"
            style={{ paddingLeft: 40, borderRadius: 'var(--radius-full)', background: 'var(--bg-input)' }}
            placeholder="Search reports, documents, requests..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && navigate(`/documents?q=${search}`)}
          />
        </div>
      </div>

      <div className="header-right">
        <button className="btn btn-ghost btn-icon" onClick={toggle} title="Toggle theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="notif-wrapper" ref={notifRef}>
          <button className="btn btn-ghost btn-icon notif-btn" onClick={() => setShowNotifs(s => !s)}>
            <Bell size={18} />
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>

          {showNotifs && (
            <div className="notif-dropdown slide-up">
              <div className="notif-header">
                <h4>Notifications</h4>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={markAllRead}><CheckCheck size={14} /> All read</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setShowNotifs(false); navigate('/notifications'); }}>View all</button>
                </div>
              </div>
              <div className="notif-list">
                {notifications.slice(0, 6).map(n => {
                  const Icon = ICON_MAP[n.icon] || Bell;
                  return (
                    <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''}`}
                      onClick={() => markRead(n.id)}>
                      <div className={`notif-icon-wrap type-${n.type}`}>
                        <Icon size={14} />
                      </div>
                      <div className="notif-content">
                        <p className="notif-title">{n.title}</p>
                        <p className="notif-msg">{n.message}</p>
                        <p className="notif-time">{n.time}</p>
                      </div>
                      {!n.read && <div className="unread-dot" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="header-user">
          <div className="avatar">{user?.avatar}</div>
          <div className="header-user-info hide-mobile">
            <p className="header-user-name">{user?.name}</p>
            <p className="header-user-role">{ROLE_LABELS[user?.role]}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
