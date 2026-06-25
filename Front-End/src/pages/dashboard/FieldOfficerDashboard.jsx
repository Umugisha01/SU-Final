import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Users, Clock, CheckCircle, 
  Plus, Eye, LifeBuoy, Heart, Calendar, 
  AlertCircle, ChevronRight, ChevronLeft 
} from 'lucide-react';
import { dashboardService } from '../../services/api';
import { useNotifications } from '../../contexts/NotificationContext';
import MetricCard from './components/MetricCard';
import LoadingSkeleton from './components/LoadingSkeleton';
import EmptyState from './components/EmptyState';

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

const TYPE_CONFIG = {
  report: { label: 'Report', color: '#1e40af', borderClass: 'border-report' },
  deadline: { label: 'Deadline', color: '#92400e', borderClass: 'border-deadline' },
  support: { label: 'Support', color: '#166534', borderClass: 'border-support' },
  prayer: { label: 'Prayer', color: '#9d174d', borderClass: 'border-prayer' },
  system: { label: 'System', color: '#374151', borderClass: 'border-system' },
  other: { label: 'Other', color: '#5b21b6', borderClass: 'border-other' },
};

export default function FieldOfficerDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [activityPage, setActivityPage] = useState(1);
  const [notifPage, setNotifPage] = useState(1);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const { notifications, systemAlerts, markRead } = useNotifications();

  const loadDashboardData = async (fromVal = fromDate, toVal = toDate) => {
    try {
      setLoading(true);
      const [foRes, actRes] = await Promise.all([
        dashboardService.getFieldOfficerData(fromVal, toVal),
        dashboardService.getRecentActivity()
      ]);
      if (foRes.success) setData(foRes);
      if (actRes.success) {
        setActivities(actRes.activities);
        setActivityPage(1);
      }
    } catch (err) {
      console.error('Failed to load Field Officer dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData(fromDate, toDate);
  }, [fromDate, toDate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <LoadingSkeleton type="card" count={4} />
        <div className="grid grid-3">
          <LoadingSkeleton type="list" count={4} />
          <LoadingSkeleton type="list" count={4} />
          <LoadingSkeleton type="list" count={4} />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <EmptyState 
        title="Dashboard Error" 
        description="Could not load your dashboard metrics. Please check your network connection." 
        actionText="Retry"
        onAction={loadDashboardData}
      />
    );
  }

  const { metrics, deadlines, last_report_submitted, is_filtered } = data;

  // Icons mapping for personal activity timeline
  const getActivityIcon = (action) => {
    const act = action.toLowerCase();
    if (act.includes('approve')) return { Icon: CheckCircle, color: 'green', bg: '#dcfce7', cl: '#166534' };
    if (act.includes('support') || act.includes('request')) return { Icon: LifeBuoy, color: 'blue', bg: '#dbeafe', cl: '#1e40af' };
    if (act.includes('submit') || act.includes('report')) return { Icon: FileText, color: 'purple', bg: '#ede9fe', cl: '#5b21b6' };
    if (act.includes('prayer')) return { Icon: Heart, color: 'red', bg: '#fee2e2', cl: '#991b1b' };
    return { Icon: Calendar, color: 'amber', bg: '#fef3c7', cl: '#92400e' };
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Date Filter Container */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '16px 20px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Filter by Activity Date:</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-muted)' }}>From:</label>
            <input 
              type="date" 
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="form-control"
              style={{ padding: '6px 10px', fontSize: '0.82rem', width: '140px', height: '34px' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-muted)' }}>To:</label>
            <input 
              type="date" 
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="form-control"
              style={{ padding: '6px 10px', fontSize: '0.82rem', width: '140px', height: '34px' }}
            />
          </div>
          {(fromDate || toDate) && (
            <button 
              className="btn btn-secondary" 
              onClick={() => { setFromDate(''); setToDate(''); }}
              style={{ padding: '6px 12px', height: '34px', fontSize: '0.82rem' }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-4">
        <MetricCard 
          value={metrics.reports_submitted}
          label="MY REPORTS"
          icon={FileText}
          color="green"
          trend={is_filtered ? "" : metrics.reports_trend}
          trendLabel={is_filtered ? "In selected period" : "vs last month"}
        />
        
        <MetricCard 
          value={metrics.pending_review}
          label="PENDING"
          icon={Clock}
          color="amber"
          trend={metrics.pending_review > 0 ? 'Awaiting' : 'All caught up'}
          trendType={metrics.pending_review > 0 ? 'down' : 'up'}
          trendLabel="Awaiting review"
        />

        <MetricCard 
          value={metrics.approved_reports}
          label="APPROVED"
          icon={CheckCircle}
          color="purple"
          trend={`${metrics.approval_rate}% rate`}
          trendType="up"
          trendLabel={`Approved (${metrics.approval_rate}% rate)`}
        />

        <MetricCard 
          value={metrics.total_participants?.toLocaleString()}
          label="MY REACH"
          icon={Users}
          color="blue"
          trend={is_filtered ? "" : metrics.parts_trend}
          trendLabel={is_filtered ? "In selected period" : "vs last month"}
        />
      </div>

      <div className="grid grid-3">
        {/* My Notifications */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>My Notifications</h3>
          </div>
          <div className="card-body" style={{ paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            {notifications && notifications.length > 0 ? (
              <>
                {notifications.slice((notifPage - 1) * 2, notifPage * 2).map((n) => {
                  const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.other;
                  return (
                    <div 
                      key={n.id} 
                      onClick={() => !n.read && markRead(n.id)}
                      className={`deadline-item-box ${config.borderClass} ${!n.read ? 'unread' : ''}`}
                      style={{ cursor: !n.read ? 'pointer' : 'default' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <p style={{ fontSize: '0.82rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>{n.title}</p>
                        <span 
                          className="badge" 
                          style={{ 
                            fontSize: '0.62rem', 
                            padding: '1px 6px',
                            background: !n.read ? 'var(--primary-50)' : 'var(--bg-card)',
                            color: config.color,
                            border: `1px solid var(--border)`
                          }}
                        >
                          {config.label}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '6px 0 8px 0', lineHeight: 1.3 }}>
                        {n.message}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-light)' }}>
                          {formatRelativeTime(n.created_at || n.createdAt)}
                        </span>
                        {!n.read && (
                          <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }} />
                            New
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Pagination Controls */}
                {notifications.length > 2 && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginTop: 'auto', 
                    paddingTop: '12px', 
                    borderTop: '1px solid var(--border-light)' 
                  }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Page <strong>{notifPage}</strong> of <strong>{Math.ceil(notifications.length / 2)}</strong>
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => setNotifPage(prev => Math.max(prev - 1, 1))}
                        disabled={notifPage === 1}
                        className="btn btn-secondary"
                        style={{
                          borderRadius: '50%',
                          padding: 0,
                          width: '28px',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '28px'
                        }}
                        title="Previous Page"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <button
                        onClick={() => setNotifPage(prev => Math.min(prev + 1, Math.ceil(notifications.length / 2)))}
                        disabled={notifPage === Math.ceil(notifications.length / 2)}
                        className="btn btn-secondary"
                        style={{
                          borderRadius: '50%',
                          padding: 0,
                          width: '28px',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '28px'
                        }}
                        title="Next Page"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', margin: '20px 0' }}>
                No active notifications found
              </p>
            )}
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="card">
          <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>My Recent Activity</h3>
          </div>
          <div className="card-body" style={{ paddingTop: '16px' }}>
            {activities && activities.length > 0 ? (
              <>
                <div className="timeline">
                  {activities.slice((activityPage - 1) * 3, activityPage * 3).map((a) => {
                    const { Icon, bg, cl } = getActivityIcon(a.action);
                    return (
                      <div key={a.id} className="timeline-item">
                        <div className="timeline-dot" style={{ background: bg }}>
                          <Icon size={14} color={cl} />
                        </div>
                        <div className="timeline-content">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <p style={{ fontSize: '0.82rem', fontWeight: 600, margin: 0 }}>{a.action}</p>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>{a.time}</span>
                          </div>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', margin: 0 }}>{a.detail}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {activities.length > 3 && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginTop: '8px', 
                    paddingTop: '12px', 
                    borderTop: '1px solid var(--border-light)' 
                  }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Page <strong>{activityPage}</strong> of <strong>{Math.ceil(activities.length / 3)}</strong>
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => setActivityPage(prev => Math.max(prev - 1, 1))}
                        disabled={activityPage === 1}
                        className="btn btn-secondary"
                        style={{
                          borderRadius: '50%',
                          padding: 0,
                          width: '28px',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '28px'
                        }}
                        title="Previous Page"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <button
                        onClick={() => setActivityPage(prev => Math.min(prev + 1, Math.ceil(activities.length / 3)))}
                        disabled={activityPage === Math.ceil(activities.length / 3)}
                        className="btn btn-secondary"
                        style={{
                          borderRadius: '50%',
                          padding: 0,
                          width: '28px',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '28px'
                        }}
                        title="Next Page"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ padding: '30px 10px', textAlign: 'center' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>No recent activities logged</p>
              </div>
            )}
          </div>
        </div>

        {/* Announcements */}
        <div className="card">
          <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>📢 Announcements</h3>
          </div>
          <div className="card-body" style={{ paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {systemAlerts && systemAlerts.length > 0 ? (
              systemAlerts.map((alert) => (
                <div 
                  key={alert.id} 
                  style={{ 
                    padding: '12px', 
                    background: alert.is_announcement ? 'rgba(76,175,80,0.06)' : 'var(--bg-input)', 
                    borderRadius: 'var(--radius)', 
                    border: alert.is_announcement ? '1.5px solid rgba(76,175,80,0.2)' : '1px solid var(--border-light)'
                  }}
                >
                  <p style={{ fontSize: '0.82rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>{alert.title}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: 1.4 }}>{alert.message}</p>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-light)', marginTop: '8px', display: 'block' }}>
                    Posted: {new Date(alert.created_at || alert.createdAt).toLocaleDateString('en-RW', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ padding: '30px 10px', textAlign: 'center' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>No active announcements today</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions and Last Submit Banner */}
      <div className="grid grid-2">
        {/* Quick Actions Panel */}
        <div className="card">
          <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Quick Outreach Actions</h3>
          </div>
          <div className="card-body" style={{ paddingTop: '16px' }}>
            <div className="responsive-grid-2" style={{ gap: '12px' }}>
              <button 
                onClick={() => navigate('/reports/new')}
                className="btn-quick-action q-green"
              >
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(46,125,50,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={18} color="var(--primary)" />
                </div>
                <div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>Submit Report</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Log outreach metrics</span>
                </div>
              </button>

              <button 
                onClick={() => navigate('/reports')}
                className="btn-quick-action q-blue"
              >
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(21,101,192,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Eye size={18} color="#1565c0" />
                </div>
                <div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>View My Reports</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Check submission histories</span>
                </div>
              </button>

              <button 
                onClick={() => navigate('/support/new')}
                className="btn-quick-action q-purple"
              >
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(106,27,154,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LifeBuoy size={18} color="#6a1b9a" />
                </div>
                <div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>Request Support</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ask for resources / transport</span>
                </div>
              </button>

              <button 
                onClick={() => navigate('/prayer')}
                className="btn-quick-action q-red"
              >
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(198,40,40,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Heart size={18} color="#c62828" />
                </div>
                <div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>Prayer Requests</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Share prayer concerns</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Sync / Summary block */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '24px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyCenter: 'center', flexShrink: 0, justifyContent: 'center' }}>
                <CheckCircle size={28} color="var(--primary)" />
              </div>
              <div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', margin: 0 }}>
                  Last Active Submission
                </p>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '2px 0 4px 0', color: 'var(--text-primary)' }}>
                  {last_report_submitted}
                </h4>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-light)', margin: 0 }}>
                  Ensure your weekly outreach activities are submitted before Friday 5:00 PM.
                </p>
              </div>
            </div>
          </div>

          <div style={{ padding: '16px 20px', borderRadius: 'var(--radius)', background: 'rgba(46,125,50,0.06)', border: '1px solid rgba(46,125,50,0.12)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--primary-dark)', fontWeight: 500 }}>
              Need assistance with report guidelines? Click <strong>Request Support</strong> above to contact your coordinator.
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
