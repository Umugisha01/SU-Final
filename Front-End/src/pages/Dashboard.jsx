import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Eye, Plus, AlertCircle, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useTheme } from '../contexts/ThemeContext';
import DashboardRouter from './dashboard/DashboardRouter';
import api, { userService } from '../services/api';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { systemAlerts, dismissSystemAlert, fetchSystemAlerts } = useNotifications();
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const role = user?.role;

  // System Alert Creation states
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertPriority, setAlertPriority] = useState('medium');
  const [alertIsAnnouncement, setAlertIsAnnouncement] = useState(false);
  const [alertDuration, setAlertDuration] = useState('24'); // Default 24 hours
  const [alertTargetUsers, setAlertTargetUsers] = useState(new Set());
  const [alertUserSearch, setAlertUserSearch] = useState('');

  // Cycle system alerts one-by-one every 30 seconds
  useEffect(() => {
    if (!systemAlerts || systemAlerts.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentAlertIndex(prev => (prev + 1) % systemAlerts.length);
    }, 30000);
    return () => clearInterval(interval);
  }, [systemAlerts]);

  // Adjust active index if alerts list changes
  useEffect(() => {
    if (systemAlerts && currentAlertIndex >= systemAlerts.length) {
      setCurrentAlertIndex(Math.max(0, systemAlerts.length - 1));
    }
  }, [systemAlerts, currentAlertIndex]);

  // Fetch users for targeting system alerts (admin only)
  useEffect(() => {
    if (role === 'administrator' && showAlertModal) {
      const fetchUsers = async () => {
        try {
          setLoadingUsers(true);
          const usrs = await userService.list();
          setUsersList(usrs);
        } catch (err) {
          console.error('Failed to load users for alert targeting:', err);
        } finally {
          setLoadingUsers(false);
        }
      };
      fetchUsers();
    }
  }, [role, showAlertModal]);

  const getAlertStyle = (alert, isDark) => {
    if (alert.is_announcement) {
      return {
        background: isDark ? 'rgba(22, 101, 52, 0.25)' : 'rgba(22, 101, 52, 0.08)',
        color: isDark ? '#dcfce7' : '#15803d',
        border: isDark ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(22, 101, 52, 0.15)',
      };
    }
    switch (alert.priority) {
      case 'urgent':
        return {
          background: isDark ? 'rgba(153, 27, 27, 0.3)' : 'rgba(220, 38, 38, 0.08)',
          color: isDark ? '#fca5a5' : '#b91c1c',
          border: isDark ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(220, 38, 38, 0.15)',
        };
      case 'high':
        return {
          background: isDark ? 'rgba(194, 65, 12, 0.3)' : 'rgba(234, 88, 12, 0.08)',
          color: isDark ? '#fed7aa' : '#c2410c',
          border: isDark ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid rgba(234, 88, 12, 0.15)',
        };
      case 'low':
        return {
          background: isDark ? 'rgba(7, 89, 133, 0.3)' : 'rgba(2, 132, 199, 0.08)',
          color: isDark ? '#bae6fd' : '#0369a1',
          border: isDark ? '1px solid rgba(14, 165, 233, 0.4)' : '1px solid rgba(2, 132, 199, 0.15)',
        };
      case 'medium':
      default:
        return {
          background: isDark ? 'rgba(133, 77, 14, 0.3)' : 'rgba(202, 138, 4, 0.08)',
          color: isDark ? '#fef08a' : '#a16207',
          border: isDark ? '1px solid rgba(234, 179, 8, 0.4)' : '1px solid rgba(202, 138, 4, 0.15)',
        };
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
        fetchSystemAlerts(); // Reload active alerts
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create system alert');
    }
  };

  const filteredUsers = usersList.filter(u => 
    u.name.toLowerCase().includes(alertUserSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(alertUserSearch.toLowerCase()) ||
    u.region?.toLowerCase().includes(alertUserSearch.toLowerCase())
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '32px' }}>
      {/* System Active Alerts Box */}
      {systemAlerts && systemAlerts.length > 0 && (() => {
        const alert = systemAlerts[currentAlertIndex];
        if (!alert) return null;
        const style = getAlertStyle(alert, theme === 'dark');
        return (
          <div style={{ marginBottom: 20 }}>
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                padding: '14px 20px', 
                borderRadius: 'var(--radius-lg)',
                background: style.background,
                color: style.color,
                border: style.border,
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <AlertCircle size={18} style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <strong style={{ fontSize: '0.9rem' }}>{alert.title}</strong>
                  <span style={{ fontSize: '0.72rem', opacity: 0.8, marginLeft: 8 }}>
                    (Expires: {new Date(alert.expires_at).toLocaleString('en-RW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })})
                  </span>
                  <p style={{ fontSize: '0.85rem', marginTop: 4, lineHeight: 1.4, opacity: 0.9 }}>{alert.message}</p>
                </div>
              </div>
              
              {systemAlerts.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentAlertIndex(prev => (prev - 1 + systemAlerts.length) % systemAlerts.length);
                    }}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: 'inherit', 
                      cursor: 'pointer', 
                      padding: 2,
                      opacity: 0.7,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, opacity: 0.8, minWidth: 40, textAlign: 'center' }}>
                    {currentAlertIndex + 1} / {systemAlerts.length}
                  </span>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentAlertIndex(prev => (prev + 1) % systemAlerts.length);
                    }}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: 'inherit', 
                      cursor: 'pointer', 
                      padding: 2,
                      opacity: 0.7,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {getGreeting()}, {user?.name ? user.name.split(' ')[0] : 'User'}!
          </h1>
          <p className="page-subtitle">
            {role === 'administrator' 
              ? 'System Administrator' 
              : role === 'national_manager' 
                ? 'National Manager' 
                : role === 'regional_coordinator' 
                  ? `${user?.region || 'Regional'} Province` 
                  : 'Field Officer'}
            {' · '}
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {role === 'administrator' && (
            <button className="btn btn-secondary" onClick={() => setShowAlertModal(true)}>
              <Bell size={16} /> Create Update / Alert
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => navigate('/reports')}>
            <Eye size={16} /> View Reports
          </button>
          {role === 'field_officer' && (
            <button className="btn btn-primary" onClick={() => navigate('/reports/new')}>
              <Plus size={16} /> Submit Report
            </button>
          )}
        </div>
      </div>

      {/* Mount Dashboard Router for role-specific components */}
      <DashboardRouter />

      {/* Create Alert Modal (Admin Only) */}
      {showAlertModal && role === 'administrator' && (
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
                  id="is_announcement" 
                  checked={alertIsAnnouncement} 
                  onChange={e => setAlertIsAnnouncement(e.target.checked)} 
                />
                <label htmlFor="is_announcement" style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>
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
                  {loadingUsers ? (
                    <p style={{ padding: 12, fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>Loading user directory...</p>
                  ) : filteredUsers.length === 0 ? (
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
                            {u.role?.replace('_', ' ').toUpperCase()} · {u.region || 'No Region'}
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
