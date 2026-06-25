import { useState, useEffect } from 'react';
import { Bell, CheckCheck, X, Check, Clock, Package, Heart, AlertCircle, Settings, Filter, Send, Search, Users } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ICON_MAP = { check: Check, clock: Clock, package: Package, heart: Heart, alert: AlertCircle, bell: Bell };
const TYPE_CONFIG = {
  report: { label: 'Reports', bg: '#dbeafe', color: '#1e40af' },
  deadline: { label: 'Deadlines', bg: '#fef3c7', color: '#92400e' },
  support: { label: 'Support', bg: '#dcfce7', color: '#166534' },
  prayer: { label: 'Prayer', bg: '#fce7f3', color: '#9d174d' },
  system: { label: 'System', bg: '#f3f4f6', color: '#374151' },
  other: { label: 'Other', bg: '#ede9fe', color: '#5b21b6' },
};

const PREFS_DEFAULT = { 
  deadlineReminders: true, 
  reportUpdates: true, 
  supportUpdates: true, 
  prayerResponses: true, 
  systemAlerts: true 
};

const formatRelativeTime = (dateTimeStr) => {
  if (!dateTimeStr) return '';
  const date = new Date(dateTimeStr);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hr${diffHr > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-RW', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function NotificationCenter() {
  const { notifications, unreadCount, markRead, markAllRead, dismiss } = useNotifications();
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState(PREFS_DEFAULT);
  
  // Broadcast States
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastCategory, setBroadcastCategory] = useState('other');
  const [targets, setTargets] = useState([]);
  const [selectedTargets, setSelectedTargets] = useState(new Set());
  const [targetSearch, setTargetSearch] = useState('');

  // System Alert States
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertPriority, setAlertPriority] = useState('medium');
  const [alertIsAnnouncement, setAlertIsAnnouncement] = useState(false);
  const [alertDuration, setAlertDuration] = useState('24');
  const [alertTargetUsers, setAlertTargetUsers] = useState(new Set());
  const [alertUserSearch, setAlertUserSearch] = useState('');

  const userRole = user?.role;
  const canBroadcast = userRole && ['administrator', 'national_manager', 'regional_coordinator'].includes(userRole);

  useEffect(() => {
    if (user?.notif_prefs) {
      setPrefs({
        ...PREFS_DEFAULT,
        ...user.notif_prefs
      });
    }
  }, [user]);

  // Load Broadcast / Alert Targets
  useEffect(() => {
    if ((showBroadcast || showAlertModal) && (canBroadcast || userRole === 'administrator')) {
      const fetchTargets = async () => {
        try {
          const res = await api.get('/notifications/broadcast-targets');
          if (res.data && res.data.success) {
            setTargets(res.data.data);
          }
        } catch (err) {
          toast.error('Failed to load target users');
        }
      };
      fetchTargets();
    }
  }, [showBroadcast, showAlertModal, canBroadcast, userRole]);

  const filtered = activeTab === 'all' 
    ? notifications 
    : activeTab === 'unread' 
      ? notifications.filter(n => !n.read) 
      : notifications.filter(n => n.type === activeTab);

  const handleSavePrefs = async () => {
    try {
      const res = await api.put('/users/me', { notif_prefs: prefs });
      if (res.data) {
        setUser({ ...user, notif_prefs: prefs });
        localStorage.setItem('su-user', JSON.stringify({ ...user, notif_prefs: prefs }));
        toast.success('Preferences saved successfully');
        setShowPrefs(false);
      }
    } catch (err) {
      toast.error('Failed to save preferences');
    }
  };

  const handleToggleTarget = (id) => {
    const next = new Set(selectedTargets);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedTargets(next);
  };

  const handleSelectAllTargets = () => {
    if (selectedTargets.size === filteredTargets.length) {
      setSelectedTargets(new Set());
    } else {
      setSelectedTargets(new Set(filteredTargets.map(t => t.id)));
    }
  };

  const handleSendBroadcast = async () => {
    if (selectedTargets.size === 0) {
      toast.error('Please select at least one recipient');
      return;
    }
    if (!broadcastMessage.trim()) {
      toast.error('Please type a message');
      return;
    }

    try {
      const payload = {
        recipient_ids: Array.from(selectedTargets),
        category: broadcastCategory,
        title: broadcastTitle.trim() || 'Broadcast Announcement',
        message: broadcastMessage.trim()
      };
      const res = await api.post('/notifications/broadcast', payload);
      if (res.data && res.data.success) {
        toast.success(res.data.message || 'Broadcast message sent successfully');
        setShowBroadcast(false);
        setBroadcastTitle('');
        setBroadcastMessage('');
        setSelectedTargets(new Set());
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send broadcast');
    }
  };

  const handleToggleTargetUser = (id) => {
    const next = new Set(alertTargetUsers);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setAlertTargetUsers(next);
  };

  const handleCreateSystemAlert = async () => {
    if (!alertTitle.trim() || !alertMessage.trim()) {
      toast.error('Title and message are required');
      return;
    }
    try {
      const payload = {
        title: alertTitle.trim(),
        message: alertMessage.trim(),
        priority: alertPriority,
        is_announcement: alertIsAnnouncement,
        duration_hours: parseInt(alertDuration, 10),
        user_ids: alertTargetUsers.size === 0 ? [] : Array.from(alertTargetUsers)
      };

      const res = await api.post('/notifications/system-alerts', payload);
      if (res.data && res.data.success) {
        toast.success(res.data.message || 'System alert created successfully');
        setShowAlertModal(false);
        setAlertTitle('');
        setAlertMessage('');
        setAlertPriority('medium');
        setAlertIsAnnouncement(false);
        setAlertDuration('24');
        setAlertTargetUsers(new Set());
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create system alert');
    }
  };

  const filteredTargets = targets.filter(t => 
    t.name.toLowerCase().includes(targetSearch.toLowerCase()) ||
    t.region.toLowerCase().includes(targetSearch.toLowerCase()) ||
    t.role.replace('_', ' ').toLowerCase().includes(targetSearch.toLowerCase())
  );

  const filteredUsers = targets.filter(u => 
    u.name.toLowerCase().includes(alertUserSearch.toLowerCase()) ||
    u.region.toLowerCase().includes(alertUserSearch.toLowerCase()) ||
    u.role.replace('_', ' ').toLowerCase().includes(alertUserSearch.toLowerCase())
  );

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Bell size={24} style={{ verticalAlign: 'middle', marginRight: 10 }} />Notification Center</h1>
          <p className="page-subtitle">{unreadCount} unread · {notifications.length} total</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {userRole === 'administrator' && (
            <button className="btn btn-secondary btn-sm" onClick={() => setShowAlertModal(true)}>
              <Bell size={14} />Create Update / Alert
            </button>
          )}
          {canBroadcast && (
            <button className="btn btn-secondary btn-sm" onClick={() => setShowBroadcast(true)}>
              <Send size={14} />Broadcast
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={markAllRead}><CheckCheck size={14} />Mark All Read</button>
          <button className="btn btn-ghost btn-icon" onClick={() => setShowPrefs(true)}><Settings size={18} /></button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', 'unread', 'report', 'deadline', 'support', 'prayer', 'system', 'other'].map(t => (
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
                }} onClick={() => !n.read && markRead(n.id)}>
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--radius)', background: typeCfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} color={typeCfg.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem', color: !n.read ? 'var(--primary)' : 'var(--text-primary)' }}>{n.title}</p>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{formatRelativeTime(n.created_at || n.createdAt)}</span>
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
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>Configure which categories of notifications you receive.</p>

              <p style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 12 }}>Notification Types</p>
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
              <button className="btn btn-primary" onClick={handleSavePrefs}>Save Preferences</button>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      {showBroadcast && canBroadcast && (
        <div className="modal-overlay" onClick={() => setShowBroadcast(false)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Send Broadcast Message</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowBroadcast(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select 
                  className="form-control form-select" 
                  value={broadcastCategory} 
                  onChange={e => setBroadcastCategory(e.target.value)}
                >
                  <option value="report">Reports</option>
                  <option value="deadline">Deadlines</option>
                  <option value="support">Support</option>
                  <option value="prayer">Prayer</option>
                  <option value="system">System</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Subject / Title (Optional)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Important Announcement" 
                  value={broadcastTitle} 
                  onChange={e => setBroadcastTitle(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea 
                  className="form-control" 
                  rows={3} 
                  placeholder="Type your broadcast message..." 
                  value={broadcastMessage} 
                  onChange={e => setBroadcastMessage(e.target.value)} 
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label className="form-label" style={{ margin: 0 }}>Select Target Recipients</label>
                  <button 
                    type="button" 
                    className="btn btn-ghost btn-xs" 
                    style={{ fontSize: '0.75rem', padding: '2px 6px' }}
                    onClick={handleSelectAllTargets}
                  >
                    {selectedTargets.size === filteredTargets.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                
                {/* Global target search */}
                <div style={{ position: 'relative', marginBottom: 8 }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    className="form-control" 
                    style={{ paddingLeft: 32, fontSize: '0.82rem' }}
                    placeholder="Search recipients by name, region, role..." 
                    value={targetSearch} 
                    onChange={e => setTargetSearch(e.target.value)} 
                  />
                </div>

                {/* Targeted User list */}
                <div style={{ 
                  maxHeight: 180, 
                  overflowY: 'auto', 
                  border: '1px solid var(--border)', 
                  borderRadius: 'var(--radius)', 
                  background: 'var(--bg-input)'
                }}>
                  {filteredTargets.length === 0 ? (
                    <p style={{ padding: 12, fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>No users found</p>
                  ) : (
                    filteredTargets.map(t => (
                      <div 
                        key={t.id} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 10, 
                          padding: '8px 12px', 
                          borderBottom: '1px solid var(--border-light)', 
                          cursor: 'pointer' 
                        }}
                        onClick={() => handleToggleTarget(t.id)}
                      >
                        <input 
                          type="checkbox" 
                          checked={selectedTargets.has(t.id)} 
                          onChange={() => {}} // handled by click on container
                          style={{ pointerEvents: 'none' }}
                        />
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '0.82rem', fontWeight: 600 }}>{t.name}</p>
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {t.role.replace('_', ' ').toUpperCase()} · {t.region}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Selected: {selectedTargets.size} recipient{selectedTargets.size !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowBroadcast(false)}>Cancel</button>
              <button 
                className="btn btn-primary" 
                disabled={selectedTargets.size === 0 || !broadcastMessage.trim()} 
                onClick={handleSendBroadcast}
              >
                <Send size={14} />Send Broadcast
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Create Alert Modal (Admin Only) */}
      {showAlertModal && userRole === 'administrator' && (
        <div className="modal-overlay" onClick={() => setShowAlertModal(false)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Update / Alert</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAlertModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Alert Title</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Scheduled Downtime" 
                  value={alertTitle} 
                  onChange={e => setAlertTitle(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Alert Message</label>
                <textarea 
                  className="form-control" 
                  rows={3} 
                  placeholder="Type details of the alert..." 
                  value={alertMessage} 
                  onChange={e => setAlertMessage(e.target.value)} 
                />
              </div>

              <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="form-label">Priority Level</label>
                  <select 
                    className="form-control form-select" 
                    value={alertPriority} 
                    onChange={e => setAlertPriority(e.target.value)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="form-label">Active Duration</label>
                  <select 
                    className="form-control form-select" 
                    value={alertDuration} 
                    onChange={e => setAlertDuration(e.target.value)}
                  >
                    <option value="1">1 Hour</option>
                    <option value="6">6 Hours</option>
                    <option value="24">1 Day (24 hrs)</option>
                    <option value="72">3 Days (72 hrs)</option>
                    <option value="168">1 Week (168 hrs)</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input 
                  type="checkbox" 
                  id="alert_is_announcement" 
                  checked={alertIsAnnouncement} 
                  onChange={e => setAlertIsAnnouncement(e.target.checked)} 
                />
                <label htmlFor="alert_is_announcement" style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>
                  🎉 Mark as Announcement (Green Theme)
                </label>
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label className="form-label" style={{ margin: 0 }}>Target Users (Empty = All Active Users)</label>
                <div style={{ position: 'relative', margin: '4px 0' }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    className="form-control" 
                    style={{ paddingLeft: 32, fontSize: '0.82rem' }}
                    placeholder="Search target users by name, region, position..." 
                    value={alertUserSearch} 
                    onChange={e => setAlertUserSearch(e.target.value)} 
                  />
                </div>
                
                <div style={{ 
                  maxHeight: 150, 
                  overflowY: 'auto', 
                  border: '1px solid var(--border)', 
                  borderRadius: 'var(--radius)', 
                  background: 'var(--bg-input)'
                }}>
                  {filteredUsers.length === 0 ? (
                    <p style={{ padding: 12, fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>No users found</p>
                  ) : (
                    filteredUsers.map(u => (
                      <div 
                        key={u.id} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 10, 
                          padding: '8px 12px', 
                          borderBottom: '1px solid var(--border-light)', 
                          cursor: 'pointer' 
                        }}
                        onClick={() => handleToggleTargetUser(u.id)}
                      >
                        <input 
                          type="checkbox" 
                          checked={alertTargetUsers.has(u.id)} 
                          onChange={() => {}} // handled by click
                          style={{ pointerEvents: 'none' }}
                        />
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '0.82rem', fontWeight: 600 }}>{u.name}</p>
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {u.role.replace('_', ' ').toUpperCase()} · {u.region}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Selected: {alertTargetUsers.size === 0 ? 'All active users' : `${alertTargetUsers.size} user(s)`}
                </span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAlertModal(false)}>Cancel</button>
              <button 
                className="btn btn-primary" 
                disabled={!alertTitle.trim() || !alertMessage.trim()} 
                onClick={handleCreateSystemAlert}
              >
                Create Update / Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
