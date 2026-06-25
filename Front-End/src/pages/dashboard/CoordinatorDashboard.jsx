import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Users, Clock, CheckCircle, 
  TrendingUp, AlertCircle, AlertTriangle, ArrowRight, Check, X,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardService, reportService } from '../../services/api';
import MetricCard from './components/MetricCard';
import LoadingSkeleton from './components/LoadingSkeleton';
import EmptyState from './components/EmptyState';
import toast from 'react-hot-toast';

export default function CoordinatorDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [data, setData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [activityPage, setActivityPage] = useState(1);
  const [rejectingReport, setRejectingReport] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadCoordinatorData = async () => {
    try {
      setLoading(true);
      const [coordRes, actRes] = await Promise.all([
        dashboardService.getCoordinatorData(),
        dashboardService.getRecentActivity()
      ]);
      if (coordRes.success) setData(coordRes);
      if (actRes.success) {
        setActivities(actRes.activities);
        setActivityPage(1);
      }
    } catch (err) {
      console.error('Failed to load Coordinator dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoordinatorData();
  }, []);

  const handleApproveReport = async (reportId) => {
    try {
      setActionLoadingId(reportId);
      const res = await reportService.updateStatus(reportId, 'approved', 'Approved from Coordinator Dashboard Quick Actions');
      toast.success('Report approved successfully!');
      // Reload dashboard aggregates
      const coordRes = await dashboardService.getCoordinatorData();
      if (coordRes.success) setData(coordRes);
    } catch (err) {
      toast.error('Failed to approve report');
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectReport = (reportId) => {
    setRejectingReport(reportId);
    setRejectReason('');
  };

  const handleRejectReportSubmit = async (reportId, reason) => {
    try {
      setActionLoadingId(reportId);
      setRejectingReport(null);
      const res = await reportService.updateStatus(reportId, 'returned', reason);
      toast.success('Report returned for correction');
      // Reload dashboard aggregates
      const coordRes = await dashboardService.getCoordinatorData();
      if (coordRes.success) setData(coordRes);
    } catch (err) {
      toast.error('Failed to return report');
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <LoadingSkeleton type="card" count={4} />
        <LoadingSkeleton type="table" count={5} />
      </div>
    );
  }

  if (!data) {
    return (
      <EmptyState 
        title="Dashboard Error" 
        description="Could not load Coordinator metrics. Please check network logs." 
        actionText="Retry"
        onAction={loadCoordinatorData}
      />
    );
  }

  const { metrics, field_officers_count, team_performance, pending_reports, support_requests } = data;
  const { user } = useAuth();

  // Icons mapping for team activity timeline
  const getActivityIcon = (action) => {
    const act = action.toLowerCase();
    if (act.includes('approve')) return { Icon: CheckCircle, color: 'green', bg: '#dcfce7', cl: '#166534' };
    if (act.includes('support') || act.includes('request')) return { Icon: TrendingUp, color: 'blue', bg: '#dbeafe', cl: '#1e40af' };
    if (act.includes('submit') || act.includes('report')) return { Icon: FileText, color: 'purple', bg: '#ede9fe', cl: '#5b21b6' };
    return { Icon: Clock, color: 'amber', bg: '#fef3c7', cl: '#92400e' };
  };

  const avgRate = team_performance.length > 0 
    ? Math.round(team_performance.reduce((acc, curr) => acc + (parseInt(curr.approvalRate) || 0), 0) / team_performance.length)
    : 0;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Aggregates Grid */}
      <div className="grid grid-4">
        <MetricCard 
          value={metrics.pending_my_approval}
          label="PENDING REVIEWS"
          icon={Clock}
          color="amber"
          trend={metrics.pending_my_approval > 0 ? `${metrics.pending_my_approval} pending` : 'All caught up'}
          trendType={metrics.pending_my_approval > 0 ? 'down' : 'up'}
          trendLabel="Need action"
        />

        <MetricCard 
          value={metrics.team_reports}
          label="APPROVED THIS MONTH"
          icon={CheckCircle}
          color="green"
          trend={`${metrics.approval_rate}% rate`}
          trendType="up"
          trendLabel="Approved this month"
        />

        <MetricCard 
          value={field_officers_count}
          label="MY TEAM"
          icon={Users}
          color="purple"
          trend="Active staff"
          trendLabel="Staff + volunteers"
        />

        <MetricCard 
          value={metrics.total_participants?.toLocaleString()}
          label="REGIONAL REACH"
          icon={TrendingUp}
          color="blue"
          trend={metrics.parts_trend}
          trendLabel="Participants this quarter"
        />
      </div>

      <div className="grid grid-3" style={{ gridTemplateColumns: '2fr 1fr' }}>
        {/* Pending approvals queue */}
        <div className="card">
          <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>⚠️ PENDING APPROVALS — Need your action</h3>
          </div>
          <div className="card-body" style={{ paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pending_reports && pending_reports.length > 0 ? (
              pending_reports.map((report) => (
                <div 
                  key={report.id}
                  style={{ 
                    padding: '16px', 
                    background: 'var(--bg-input)', 
                    borderRadius: 'var(--radius)', 
                    border: '1.5px solid var(--border-light)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-light)', display: 'block' }}>Submitted by {report.submittedBy}</span>
                      <strong 
                        style={{ fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer', display: 'block', marginTop: '2px' }} 
                        onClick={() => navigate(`/reports/${report.id}`)}
                      >
                        {report.title}
                      </strong>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {new Date(report.date).toLocaleDateString('en-RW', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Reach: <strong>{report.participants} participants</strong>
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 12px', borderRadius: 'var(--radius)', background: 'rgba(239,68,68,0.08)', border: 'none', color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 600 }}
                        disabled={actionLoadingId === report.id}
                        onClick={() => handleRejectReport(report.id)}
                      >
                        RETURN
                      </button>
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '6px 12px', borderRadius: 'var(--radius)', boxShadow: 'none', fontSize: '0.75rem', fontWeight: 600 }}
                        disabled={actionLoadingId === report.id}
                        onClick={() => handleApproveReport(report.id)}
                      >
                        APPROVE
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <CheckCircle size={36} color="var(--success)" style={{ opacity: 0.6, marginBottom: '12px' }} />
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                  Excellent! No reports pending approval in {user?.region || 'your region'}.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Team Performance progress bars */}
        <div className="card">
          <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>👥 TEAM PERFORMANCE</h3>
          </div>
          <div className="card-body" style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {team_performance && team_performance.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '0 16px' }}>
                {team_performance.map((fo) => {
                  const rate = parseInt(fo.approvalRate) || 0;
                  return (
                    <div key={fo.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{fo.name}</span>
                        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{fo.approvalRate}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ flex: 1, height: '8px', background: 'var(--border-light)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${rate}%`, height: '100%', background: 'var(--primary)', borderRadius: '4px' }} />
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-light)', minWidth: '85px', textAlign: 'right' }}>
                          {fo.reportsSubmitted} files ({fo.pendingApproval} pend)
                        </span>
                      </div>
                    </div>
                  );
                })}

                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed var(--border-light)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Team Average</span>
                    <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{avgRate}%</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1, height: '8px', background: 'var(--border-light)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${avgRate}%`, height: '100%', background: 'var(--primary-dark)', borderRadius: '4px' }} />
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-light)', minWidth: '85px', textAlign: 'right' }}>
                      Overall Compliance
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '30px', textAlign: 'center' }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No active field officers in your region.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-3" style={{ gridTemplateColumns: '2fr 1fr' }}>
        {/* Recent Team Activity */}
        <div className="card">
          <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>📢 RECENT TEAM ACTIVITY</h3>
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
                            <p style={{ fontSize: '0.82rem', fontWeight: 600, margin: 0 }}>
                              {a.action}
                              {a.user && <span style={{ fontSize: '0.72rem', color: 'var(--primary)', marginLeft: '8px', fontWeight: 500 }}>by {a.user}</span>}
                            </p>
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

        {/* Regional Support Requests */}
        <div className="card">
          <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>📥 REGIONAL SUPPORT REQUESTS</h3>
          </div>
          <div className="card-body" style={{ paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {support_requests && support_requests.length > 0 ? (
              support_requests.map((sr) => (
                <div 
                  key={sr.id} 
                  className={`deadline-item-box ${sr.urgency === 'critical' ? 'urgent' : sr.urgency === 'high' ? 'high' : 'primary'}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate('/support-requests')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontSize: '0.82rem', fontWeight: 600, margin: 0 }}>{sr.title}</p>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>Sent by: {sr.requester}</span>
                    </div>
                    <span 
                      className={`badge ${sr.urgency === 'critical' ? 'badge-danger' : sr.urgency === 'high' ? 'badge-warning' : 'badge-primary'}`} 
                      style={{ fontSize: '0.62rem', padding: '1px 6px' }}
                    >
                      {sr.urgency}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>
                      Status: <strong style={{ textTransform: 'capitalize' }}>{sr.status}</strong>
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Due: {new Date(sr.deadline).toLocaleDateString('en-RW', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', margin: '20px 0' }}>
                No active support requests.
              </p>
            )}
          </div>
        </div>
      </div>
      {rejectingReport && (
        <div className="modal-overlay" onClick={() => setRejectingReport(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ background: 'rgba(var(--card-rgb), 0.85)', backdropFilter: 'blur(16px)' }}>
            <div className="modal-header">
              <h3>Return Report for Correction</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setRejectingReport(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 15, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Please provide comments or a reason for returning this report to draft status.
              </p>
              <div className="form-group">
                <label className="form-label">Return Reason / Comments</label>
                <textarea 
                  className="form-control" 
                  style={{ minHeight: 100, width: '100%', padding: '10px' }} 
                  placeholder="e.g. Please verify participant counts or update outcomes text."
                  value={rejectReason} 
                  onChange={e => setRejectReason(e.target.value)} 
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setRejectingReport(null)}>Cancel</button>
              <button 
                className="btn btn-danger" 
                onClick={() => handleRejectReportSubmit(rejectingReport, rejectReason.trim())} 
                disabled={!rejectReason.trim()}
              >
                Return Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
