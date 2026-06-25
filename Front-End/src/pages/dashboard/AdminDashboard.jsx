import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Clock, FileText, CheckCircle, 
  Activity, Check, X, ShieldAlert, Key, Settings 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { dashboardService, userService } from '../../services/api';
import MetricCard from './components/MetricCard';
import LoadingSkeleton from './components/LoadingSkeleton';
import EmptyState from './components/EmptyState';
import SystemHealth from './components/SystemHealth';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [healthLoading, setHealthLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [data, setData] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [rejectingUser, setRejectingUser] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadAdminDashboardData = async () => {
    try {
      setLoading(true);
      const [adminRes, healthRes] = await Promise.all([
        dashboardService.getAdminData(),
        dashboardService.getSystemHealth()
      ]);
      if (adminRes.success) setData(adminRes);
      if (healthRes.success) setHealthData(healthRes);
    } catch (err) {
      console.error('Failed to load Admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshHealthData = async () => {
    try {
      setHealthLoading(true);
      const res = await dashboardService.getSystemHealth();
      if (res.success) setHealthData(res);
    } catch (err) {
      toast.error('Failed to refresh system infrastructure health data');
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    loadAdminDashboardData();
  }, []);

  const handleApproveUser = async (userId) => {
    try {
      setActionLoadingId(userId);
      const res = await userService.approve(userId);
      toast.success(res.message || 'User approved successfully!');
      // Reload admin dashboard data
      const adminRes = await dashboardService.getAdminData();
      if (adminRes.success) setData(adminRes);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve user registration');
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectUser = (userId) => {
    setRejectingUser(userId);
    setRejectReason('');
  };

  const handleRejectUserSubmit = async (userId, reason) => {
    try {
      setActionLoadingId(userId);
      setRejectingUser(null);
      const res = await userService.reject(userId, reason);
      toast.success('User registration rejected and notification sent.');
      // Reload admin dashboard data
      const adminRes = await dashboardService.getAdminData();
      if (adminRes.success) setData(adminRes);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reject user registration');
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <LoadingSkeleton type="card" count={4} />
        <div className="grid grid-2">
          <LoadingSkeleton type="chart" count={1} />
          <LoadingSkeleton type="list" count={4} />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <EmptyState 
        title="Dashboard Error" 
        description="Could not load Admin aggregates. Please check network logs." 
        actionText="Retry"
        onAction={loadAdminDashboardData}
      />
    );
  }

  const { metrics, pending_users, system_activity, mfa_compliance, recent_audits, uptime } = data;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Admin metrics grid */}
      <div className="grid grid-4">
        <MetricCard 
          value={metrics.active_users}
          label="ACTIVE USERS"
          icon={Users}
          color="green"
          trend={metrics.users_trend}
          trendLabel="Staff & coordinators"
        />

        <MetricCard 
          value={metrics.pending_approvals}
          label="PENDING REGISTRATIONS"
          icon={Clock}
          color="amber"
          trend={metrics.pending_approvals > 0 ? `${metrics.pending_approvals} pending` : 'All approved'}
          trendType={metrics.pending_approvals > 0 ? 'down' : 'up'}
          trendLabel="Need approval"
        />

        <MetricCard 
          value={`${metrics.reports_submitted}%`}
          label="SYSTEM STORAGE"
          icon={Activity}
          color="blue"
          trend={metrics.reports_trend}
          trendLabel="Used storage of 10GB"
        />

        <MetricCard 
          value={metrics.approval_rate}
          label="SECURITY EVENTS"
          icon={ShieldAlert}
          color="purple"
          trend="7 Days"
          trendLabel="Failed logins"
        />
      </div>

      {/* System activity charts & System health widgets */}
      <div className="grid grid-2" style={{ gridTemplateColumns: '1.2fr 0.8fr' }}>
        {/* Recharts System Activity log */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>System Usage Trends (7 Days)</h3>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Logins, reports, and API workload</span>
          </div>
          <div className="card-body" style={{ flex: 1, display: 'flex', alignItems: 'center', paddingTop: '16px' }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={system_activity} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="logins" fill="var(--primary)" radius={[2, 2, 0, 0]} name="Logins" />
                <Bar dataKey="reports" fill="var(--info)" radius={[2, 2, 0, 0]} name="Reports Submitted" />
                <Bar dataKey="apiCalls" fill="var(--purple)" radius={[2, 2, 0, 0]} name="API requests (x10)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Infrastructures System Health gauges */}
        <div>
          <SystemHealth 
            health={healthData} 
            onRefresh={refreshHealthData} 
            loading={healthLoading} 
          />
        </div>
      </div>

      {/* Pending approvals and MFA Compliance */}
      <div className="grid grid-3" style={{ gridTemplateColumns: '1.3fr 0.7fr' }}>
        
        {/* Pending approvals */}
        <div className="card">
          <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>👥 PENDING USER APPROVALS — Review new registrations</h3>
            </div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {pending_users && pending_users.length > 0 ? (
              <div className="table-wrapper">
                <table className="table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Full Name</th>
                      <th>Email & Region</th>
                      <th>Requested Role</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending_users.map((usr) => (
                      <tr key={usr.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="avatar" style={{ width: 26, height: 26, fontSize: '0.7rem' }}>
                              {usr.name.substring(0, 2).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 600 }}>{usr.name}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.8rem' }}>{usr.email}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>{usr.region || 'No Region'}</div>
                        </td>
                        <td>
                          <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                            {usr.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button 
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 8px', color: 'var(--danger)', background: '#fee2e2', border: 'none', fontSize: '0.75rem' }}
                              disabled={actionLoadingId === usr.id}
                              onClick={() => handleRejectUser(usr.id)}
                            >
                              Reject
                            </button>
                            <button 
                              className="btn btn-primary btn-sm"
                              style={{ padding: '4px 8px', boxShadow: 'none', fontSize: '0.75rem' }}
                              disabled={actionLoadingId === usr.id}
                              onClick={() => handleApproveUser(usr.id)}
                            >
                              Approve
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <CheckCircle size={32} color="var(--success)" style={{ opacity: 0.6, marginBottom: '8px' }} />
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>No registrations are currently awaiting approval.</p>
              </div>
            )}
          </div>
        </div>

        {/* MFA Compliance Status */}
        <div className="card">
          <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>🔐 MFA COMPLIANCE</h3>
          </div>
          <div className="card-body" style={{ paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {mfa_compliance && mfa_compliance.map((c, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                  <span style={{ fontWeight: 600 }}>{c.role}</span>
                  <span style={{ fontWeight: 700, color: c.percentage === 100 ? 'var(--success)' : 'var(--warning)' }}>
                    {c.enabled} / {c.total} ({c.percentage}%) {c.percentage === 100 ? '✅' : '⚠️'}
                  </span>
                </div>
                <div style={{ height: '6px', background: 'var(--border-light)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${c.percentage}%`, height: '100%', background: c.percentage === 100 ? 'var(--success)' : 'var(--warning)', borderRadius: '3px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Security Audit events */}
      <div className="card">
        <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>📋 RECENT AUDIT EVENTS (Security Log)</h3>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {recent_audits && recent_audits.length > 0 ? (
            <div className="table-wrapper">
              <table className="table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Event / Action</th>
                    <th>User Snapshot</th>
                    <th>Origin IP</th>
                    <th>Severity</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {recent_audits.map((audit) => (
                    <tr key={audit.id}>
                      <td>
                        <strong style={{ color: 'var(--text-primary)', fontSize: '0.82rem' }}>{audit.action}</strong>
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>{audit.user}</td>
                      <td style={{ fontSize: '0.82rem', fontFamily: 'monospace' }}>{audit.ip}</td>
                      <td>
                        <span 
                          className={`badge ${audit.severity === 'danger' ? 'badge-danger' : (audit.severity === 'warning' ? 'badge-warning' : 'badge-primary')}`}
                          style={{ fontSize: '0.68rem', padding: '2px 8px' }}
                        >
                          {audit.severity}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{audit.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>No critical security events recorded.</p>
            </div>
          )}
        </div>
      </div>
      {rejectingUser && (
        <div className="modal-overlay" onClick={() => setRejectingUser(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ background: 'rgba(var(--card-rgb), 0.85)', backdropFilter: 'blur(16px)' }}>
            <div className="modal-header">
              <h3>Reject User Registration</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setRejectingUser(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 15, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Please provide a reason for rejecting this user's registration.
              </p>
              <div className="form-group">
                <label className="form-label">Rejection Reason</label>
                <textarea 
                  className="form-control" 
                  style={{ minHeight: 100, width: '100%', padding: '10px' }} 
                  placeholder="e.g. Invalid region, incorrect role assignment, unrecognized email."
                  value={rejectReason} 
                  onChange={e => setRejectReason(e.target.value)} 
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setRejectingUser(null)}>Cancel</button>
              <button 
                className="btn btn-danger" 
                onClick={() => handleRejectUserSubmit(rejectingUser, rejectReason.trim())} 
                disabled={!rejectReason.trim()}
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
