import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, Edit, RotateCcw, MapPin, Calendar, Users, FileText, Heart, MessageSquare, Download, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { reportService } from '../../services/api';

const STATUS_CONFIG = {
  approved: { cls: 'badge-success', icon: CheckCircle, label: 'Approved' },
  submitted: { cls: 'badge-info', icon: Clock, label: 'Submitted' },
  draft: { cls: 'badge-gray', icon: Edit, label: 'Draft' },
  returned: { cls: 'badge-danger', icon: RotateCcw, label: 'Returned' },
};

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  const [status, setStatus] = useState('draft');
  const [analyzing, setAnalyzing] = useState(false);

  const fetchReport = () => {
    reportService.get(id)
      .then(data => {
        setReport(data);
        setStatus(data.status);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching report:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReport();
  }, [id]);

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center' }}>Loading report details...</div>;
  }

  if (!report) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <h3>Report Not Found</h3>
        <button className="btn btn-primary" onClick={() => navigate('/reports')}>Back to Reports</button>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const Icon = cfg.icon;
  const canApprove = user?.role === 'admin' || user?.role === 'manager';

  const approve = async () => {
    try {
      await reportService.updateStatus(id, 'approved', comment || 'Approved');
      setStatus('approved');
      addNotification({ type: 'report', title: 'Report Approved', message: `"${report.title}" has been approved.`, icon: 'check' });
      setComment('');
      fetchReport();
    } catch (err) {
      console.error(err);
      addNotification({ type: 'error', title: 'Action Failed', message: err.response?.data?.error || 'Could not approve report.', icon: 'x' });
    }
  };

  const returnReport = async () => {
    try {
      await reportService.updateStatus(id, 'returned', comment || 'Returned for Revision');
      setStatus('returned');
      addNotification({ type: 'report', title: 'Report Returned', message: `"${report.title}" has been returned for revision.`, icon: 'alert' });
      setComment('');
      fetchReport();
    } catch (err) {
      console.error(err);
      addNotification({ type: 'error', title: 'Action Failed', message: err.response?.data?.error || 'Could not return report.', icon: 'x' });
    }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      await reportService.analyze(id);
      addNotification({ type: 'success', title: 'AI Job Queued', message: 'Gemini analysis has been started.', icon: 'check' });
      setTimeout(() => {
        fetchReport();
        setAnalyzing(false);
      }, 3000);
    } catch (err) {
      console.error(err);
      addNotification({ type: 'error', title: 'AI Analysis Failed', message: err.response?.data?.error || 'Could not analyze report.', icon: 'x' });
      setAnalyzing(false);
    }
  };

  const handleOverride = async (category) => {
    try {
      await reportService.aiOverride(id, category);
      addNotification({ type: 'success', title: 'Category Overridden', message: `Report category changed to ${category}.`, icon: 'check' });
      fetchReport();
    } catch (err) {
      console.error(err);
      addNotification({ type: 'error', title: 'Override Failed', message: err.response?.data?.error || 'Could not override category.', icon: 'x' });
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/reports')}><ArrowLeft size={18} /></button>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.25rem' }}>{report.title}</h1>
            <p className="page-subtitle">{report.type} · {report.region}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <span className={`badge ${cfg.cls}`}><Icon size={11} />{cfg.label}</span>
          {canApprove && status === 'submitted' && (
            <>
              <button className="btn btn-primary btn-sm" onClick={approve}><ThumbsUp size={14} />Approve</button>
              <button className="btn btn-danger btn-sm" onClick={returnReport}><ThumbsDown size={14} />Return</button>
            </>
          )}
          {report.submitted_by?.id === user?.id && ['draft', 'returned'].includes(status) && (
            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/reports/${report.id}/edit`)}>
              <Edit size={14} />Edit
            </button>
          )}
          <button className="btn btn-secondary btn-sm"><Download size={14} />Export PDF</button>
        </div>
      </div>

      {/* Meta cards */}
      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        {[
          { icon: Calendar, label: 'Date', val: report.date },
          { icon: Clock, label: 'Duration', val: report.duration },
          { icon: MapPin, label: 'Location', val: report.location },
          { icon: Users, label: 'Participants', val: report.participants.toLocaleString() },
        ].map(({ icon: I, label, val }) => (
          <div key={label} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="stat-icon green" style={{ width: 36, height: 36 }}><I size={16} /></div>
              <div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{val}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 320px', gap: 20 }}>
        <div>
          {/* Tabs */}
          <div className="tabs" style={{ marginBottom: 20 }}>
            {['details', 'attendance', 'prayer', 'comments'].map(t => (
              <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === 'details' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                { title: 'Activity Description', icon: FileText, content: report.description },
                { title: 'Outcomes & Impact', icon: CheckCircle, content: report.outcomes },
                { title: 'Challenges Encountered', icon: RotateCcw, content: report.challenges },
              ].map(({ title, icon: I, content }) => (
                <div key={title} className="card">
                  <div className="card-header" style={{ paddingBottom: 12 }}><h3 style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}><I size={16} />{title}</h3></div>
                  <div className="card-body" style={{ paddingTop: 8 }}>
                    <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text-primary)' }}>{content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="card">
              <div className="card-header"><h3 style={{ fontSize: '0.95rem' }}>Attendance Statistics</h3></div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { label: 'Male Participants', val: report.demographics.male, color: '#1565c0' },
                    { label: 'Female Participants', val: report.demographics.female, color: '#9c27b0' },
                    { label: 'Youth (under 25)', val: report.demographics.youth, color: '#2e7d32' },
                    { label: 'Adults (25+)', val: report.demographics.adults, color: '#e65100' },
                  ].map(({ label, val, color }) => (
                    <div key={label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{label}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{val} ({Math.round((val / report.participants) * 100)}%)</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${(val / report.participants) * 100}%`, background: color }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ padding: '16px', background: 'var(--primary-50)', borderRadius: 'var(--radius)', marginTop: 8 }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-dark)' }}>Total Participants: {report.participants}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'prayer' && (
            <div className="card">
              <div className="card-header">
                <h3 style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}><Heart size={16} />Prayer Requests</h3>
              </div>
              <div className="card-body">
                <div style={{ background: '#fce7f3', borderRadius: 'var(--radius)', padding: '16px', border: '1px solid #f9a8d4' }}>
                  <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: '#831843' }}>{report.prayerRequests}</p>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 12 }}>This prayer request has been shared with the organizational prayer team.</p>
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="card">
              <div className="card-header"><h3 style={{ fontSize: '0.95rem' }}><MessageSquare size={16} style={{ marginRight: 8 }} />Comments & Review</h3></div>
              <div className="card-body">
                <div style={{ marginBottom: 20 }}>
                  <textarea className="form-control" rows={3} placeholder="Add a comment or review note..."
                    value={comment} onChange={e => setComment(e.target.value)} style={{ marginBottom: 10 }} />
                  <button className="btn btn-primary btn-sm" disabled={!comment.trim()}>Post Comment</button>
                </div>
                <div className="empty-state" style={{ padding: '30px 0' }}>
                  <MessageSquare size={32} className="empty-state-icon" />
                  <p>No comments yet. Be the first to add a review.</p>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-header"><h3 style={{ fontSize: '0.9rem' }}>Report Info</h3></div>
            <div className="card-body" style={{ paddingTop: 12 }}>
              {[
                { label: 'Submitted by', val: report.submittedBy },
                { label: 'Department', val: report.department },
                { label: 'Region', val: report.region },
                { label: 'Attachments', val: `${report.attachments} files` },
              ].map(({ label, val }) => (
                <div key={label} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>{label}</span>
                  <span style={{ fontWeight: 600 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Gemini AI Analysis Card */}
          {(status === 'submitted' || status === 'approved' || report.ai_category || report.aiCategory) && (
            <div className="card" style={{ border: '1px solid var(--primary-100)', background: 'linear-gradient(to bottom right, var(--primary-50), white)' }}>
              <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12 }}>
                <h3 style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary-dark)', margin: 0 }}>
                  <Sparkles size={16} /> Gemini AI Analysis
                </h3>
                {analyzing && <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>Analyzing...</span>}
              </div>
              <div className="card-body" style={{ paddingTop: 8 }}>
                {report.ai_category || report.aiCategory ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Category Classification</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <span className="badge badge-primary" style={{ textTransform: 'capitalize', fontSize: '0.85rem' }}>
                          {report.ai_category || report.aiCategory}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          ({report.confidence || 0}% confidence)
                        </span>
                      </div>
                    </div>

                    {report.ai_summary && (
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Executive Summary</span>
                        <p style={{ fontSize: '0.8rem', lineHeight: 1.5, marginTop: 4, fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                          "{report.ai_summary}"
                        </p>
                      </div>
                    )}

                    {report.keywords && (
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Keywords</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {(Array.isArray(report.keywords) ? report.keywords : (() => {
                            try {
                              return typeof report.keywords === 'string' ? JSON.parse(report.keywords) : [];
                            } catch(e) {
                              return typeof report.keywords === 'string' ? report.keywords.split(',').map(k => k.trim()) : [];
                            }
                          })()).map(kw => (
                            <span key={kw} className="badge badge-gray" style={{ fontSize: '0.7rem' }}>{kw}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {canApprove && (
                      <div style={{ marginTop: 8, borderTop: '1px solid var(--border-light)', paddingTop: 12 }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Override Category</span>
                        <select 
                          className="form-control" 
                          style={{ fontSize: '0.8rem', padding: '4px 8px', height: 'auto' }}
                          value={report.ai_category || report.aiCategory || ''}
                          onChange={(e) => handleOverride(e.target.value)}
                        >
                          <option value="Outreach">Outreach</option>
                          <option value="Bible Study">Bible Study</option>
                          <option value="Training">Training</option>
                          <option value="Meeting">Meeting</option>
                          <option value="Community Event">Community Event</option>
                          <option value="Prayer Meeting">Prayer Meeting</option>
                          <option value="Youth Program">Youth Program</option>
                        </select>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '10px 0' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                      No AI analysis is available for this report yet.
                    </p>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={runAnalysis}
                      disabled={analyzing}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    >
                      <Sparkles size={14} /> {analyzing ? 'Analyzing...' : 'Run Gemini Analysis'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status timeline */}
          <div className="card">
            <div className="card-header"><h3 style={{ fontSize: '0.9rem' }}>Status Timeline</h3></div>
            <div className="card-body" style={{ paddingTop: 12 }}>
              <div className="timeline">
                {[
                  { label: 'Report Created', time: `${report.date} · 09:00`, done: true },
                  { label: 'Submitted for Review', time: `${report.date} · 10:30`, done: status !== 'draft' },
                  { label: status === 'approved' ? 'Approved' : status === 'returned' ? 'Returned for Revision' : 'Awaiting Review', time: status !== 'submitted' && status !== 'draft' ? 'Completed' : 'Pending', done: status === 'approved' || status === 'returned' },
                ].map((s, i) => (
                  <div key={i} className="timeline-item">
                    <div className="timeline-dot" style={{ background: s.done ? 'var(--primary-50)' : 'var(--border)' }}>
                      <CheckCircle size={14} color={s.done ? 'var(--primary)' : 'var(--text-light)'} />
                    </div>
                    <div className="timeline-content">
                      <p style={{ fontSize: '0.8rem', fontWeight: 600 }}>{s.label}</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
