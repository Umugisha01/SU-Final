import { useState } from 'react';
import { Bell, CheckCheck, X, Check, Clock, Package, Heart, AlertCircle, Settings, Filter, Send } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';

const ICON_MAP = { check: Check, clock: Clock, package: Package, heart: Heart, alert: AlertCircle, bell: Bell };
const TYPE_CONFIG = {
  report: { label: 'Reports', bg: '#dbeafe', color: '#1e40af' },
  deadline: { label: 'Deadlines', bg: '#fef3c7', color: '#92400e' },
  support: { label: 'Support', bg: '#dcfce7', color: '#166534' },
  prayer: { label: 'Prayer', bg: '#fce7f3', color: '#9d174d' },
  system: { label: 'System', bg: '#f3f4f6', color: '#374151' },
};

const PREFS_DEFAULT = { email: true, sms: false, inApp: true, deadlineReminders: true, reportUpdates: true, supportUpdates: true, prayerResponses: true, systemAlerts: true };

export default function NotificationCenter() {
  const { notifications, unreadCount, markRead, markAllRead, dismiss } = useNotifications();
  const [activeTab, setActiveTab] = useState('all');
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState(PREFS_DEFAULT);
  const [broadcast, setBroadcast] = useState('');
  const [showBroadcast, setShowBroadcast] = useState(false);

  const filtered = activeTab === 'all' ? notifications : activeTab === 'unread' ? notifications.filter(n => !n.read) : notifications.filter(n => n.type === activeTab);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Bell size={24} style={{ verticalAlign: 'middle', marginRight: 10 }} />Notification Center</h1>
          <p className="page-subtitle">{unreadCount} unread · {notifications.length} total</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowBroadcast(true)}><Send size={14} />Broadcast</button>
          <button className="btn btn-secondary btn-sm" onClick={markAllRead}><CheckCheck size={14} />Mark All Read</button>
          <button className="btn btn-ghost btn-icon" onClick={() => setShowPrefs(true)}><Settings size={18} /></button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', 'unread', 'report', 'deadline', 'support', 'prayer', 'system'].map(t => (
          <button key={t} className={`chip ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {t === 'all' ? `All (${notifications.length})` : t === 'unread' ? `Unread (${unreadCount})` : TYPE_CONFIG[t]?.label}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px' }}>
            <Bell size={40} className="empty-state-icon" />
            <h3>No Notifications</h3>
            <p>You're all caught up!</p>
          </div>
        ) : (
          <div>
            {filtered.map(n => {
              const Icon = ICON_MAP[n.icon] || Bell;
              const typeCfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
              return (
                <div key={n.id} style={{
                  display: 'flex', gap: 14, padding: '16px 20px', borderBottom: '1px solid var(--border-light)',
                  background: !n.read ? 'var(--primary-50)' : 'transparent', cursor: 'pointer', transition: 'background var(--transition)'
                }} onClick={() => markRead(n.id)}>
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--radius)', background: typeCfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} color={typeCfg.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{n.title}</p>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{n.time}</span>
                        {!n.read && <div style={{ width: 8, height: 8, background: 'var(--primary)', borderRadius: '50%' }} />}
                        <button className="btn btn-ghost btn-icon" style={{ padding: 4 }} onClick={e => { e.stopPropagation(); dismiss(n.id); }}>
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.5 }}>{n.message}</p>
                    <span className="badge" style={{ background: typeCfg.bg, color: typeCfg.color, marginTop: 8, fontSize: '0.68rem' }}>{typeCfg.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preferences Modal */}
      {showPrefs && (
        <div className="modal-overlay" onClick={() => setShowPrefs(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Notification Preferences</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowPrefs(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>Configure how and when you receive notifications.</p>

              <p style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 12 }}>Delivery Channels</p>
              {[
                { key: 'inApp', label: 'In-App Notifications', desc: 'Show notifications within the platform' },
                { key: 'email', label: 'Email Notifications', desc: 'Send notifications to your email' },
                { key: 'sms', label: 'SMS Notifications', desc: 'Send SMS to your registered phone' },
              ].map(({ key, label, desc }) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{label}</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{desc}</p>
                  </div>
                  <div className={`toggle ${prefs[key] ? 'on' : ''}`} onClick={() => setPrefs(p => ({ ...p, [key]: !p[key] }))}>
                    <div className="toggle-thumb" />
                  </div>
                </div>
              ))}

              <p style={{ fontWeight: 700, fontSize: '0.85rem', marginTop: 20, marginBottom: 12 }}>Notification Types</p>
              {[
                { key: 'reportUpdates', label: 'Report Updates', desc: 'Approvals, returns, and submissions' },
                { key: 'deadlineReminders', label: 'Deadline Reminders', desc: 'Upcoming report submission deadlines' },
                { key: 'supportUpdates', label: 'Support Request Updates', desc: 'Status changes on your requests' },
                { key: 'prayerResponses', label: 'Prayer Responses', desc: 'Responses to your prayer requests' },
                { key: 'systemAlerts', label: 'System Alerts', desc: 'Maintenance and announcements' },
              ].map(({ key, label, desc }) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>{label}</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{desc}</p>
                  </div>
                  <div className={`toggle ${prefs[key] ? 'on' : ''}`} onClick={() => setPrefs(p => ({ ...p, [key]: !p[key] }))}>
                    <div className="toggle-thumb" />
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPrefs(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => setShowPrefs(false)}>Save Preferences</button>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      {showBroadcast && (
        <div className="modal-overlay" onClick={() => setShowBroadcast(false)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Send Broadcast Message</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowBroadcast(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Target Audience</label>
                <select className="form-control form-select">
                  <option>All Users</option>
                  <option>Field Coordinators Only</option>
                  <option>Managers Only</option>
                  <option>Specific Region</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea className="form-control" rows={4} placeholder="Type your broadcast message..." value={broadcast} onChange={e => setBroadcast(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowBroadcast(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={!broadcast.trim()} onClick={() => setShowBroadcast(false)}><Send size={14} />Send Broadcast</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
