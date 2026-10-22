import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, LifeBuoy, Clock, CheckCircle, Package, DollarSign, Users, 
  BookOpen, Heart, MoreHorizontal, MessageSquare, Eye, Trash2, Edit3,
  ChevronDown, ChevronUp, MapPin, Calendar 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { supportService, userService } from '../../services/api';

const PRIORITY_CONFIG = { 
  low: { cls: 'badge-gray', label: 'Low' }, 
  medium: { cls: 'badge-info', label: 'Medium' }, 
  high: { cls: 'badge-warning', label: 'High' }, 
  urgent: { cls: 'badge-danger', label: 'Urgent' } 
};

const STATUS_CONFIG = { 
  submitted: { cls: 'badge-info', label: 'Submitted' }, 
  submitted_to_coordinator: { cls: 'badge-info', label: 'Submitted' }, 
  submitted_to_manager: { cls: 'badge-info', label: 'Submitted ★' }, 
  'under review': { cls: 'badge-warning', label: 'Under Review' }, 
  approved: { cls: 'badge-success', label: 'Approved ★' }, 
  fulfilled: { cls: 'badge-primary', label: 'Fulfilled ★' }, 
  closed: { cls: 'badge-gray', label: 'Closed ★' },
  returned_by_coordinator: { cls: 'badge-danger', label: 'Returned by Coordinator' },
  returned_by_manager: { cls: 'badge-danger', label: 'Returned by Manager ★' }
};

const TYPE_ICONS = { 
  Material: Package, 
  Financial: DollarSign, 
  Personnel: Users, 
  Training: BookOpen, 
  Prayer: Heart, 
  Other: MoreHorizontal 
};

export default function SupportRequests() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersList, setUsersList] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState('list');
  const [mobileKanbanCol, setMobileKanbanCol] = useState('submitted');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleBatchAIAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const response = await supportService.batchAIAnalysis();
      if (addNotification) {
        addNotification({
          type: 'system',
          title: 'AI Analysis Started',
          message: 'AI batch analysis started in the background.',
          icon: 'cpu'
        });
      }
      
      // Poll for completion
      const interval = setInterval(async () => {
        try {
          const status = await supportService.getAITaskStatus(response.task_id);
          if (status.status === 'completed') {
            clearInterval(interval);
            if (addNotification) {
              addNotification({
                type: 'support',
                title: 'AI Analysis Completed',
                message: 'All pending support requests have been analyzed.',
                icon: 'check-circle'
              });
            }
            await fetchRequests();
            setIsAnalyzing(false);
          } else if (status.status === 'failed') {
            clearInterval(interval);
            if (addNotification) {
              addNotification({
                type: 'system',
                title: 'AI Analysis Failed',
                message: status.error || 'The background analysis task failed.',
                icon: 'x-circle'
              });
            }
            setIsAnalyzing(false);
          }
        } catch (pollErr) {
          clearInterval(interval);
          console.error('Error polling AI status:', pollErr);
          setIsAnalyzing(false);
        }
      }, 3000);
      
    } catch (error) {
      console.error('Failed to run batch AI analysis:', error);
      setIsAnalyzing(false);
      if (addNotification) {
        addNotification({
          type: 'system',
          title: 'AI Analysis Failed',
          message: error.response?.data?.error || error.message,
          icon: 'x-circle'
        });
      }
    }
  };
  
  const [newComment, setNewComment] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(null);

  const handleDelete = async (reqId, reqTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${reqTitle}"?\n\nThis action cannot be undone.`)) return;
    setDeleteSubmitting(reqId);
    try {
      await supportService.delete(reqId);
      if (addNotification) {
        addNotification({
          type: 'support',
          title: 'Support Request Deleted',
          message: `"${reqTitle}" has been deleted.`,
          icon: 'trash-2'
        });
      }
      if (selected?.id === reqId) setSelected(null);
      await fetchRequests();
    } catch (err) {
      console.error('Error deleting support request:', err);
      alert(err.response?.data?.error || 'Failed to delete support request.');
    } finally {
      setDeleteSubmitting(null);
    }
  };

  const fetchRequests = async () => {
    try {
      const data = await supportService.list();
      setRequests(data);
      setLoading(false);
      if (selected) {
        const updatedSelected = data.find(r => r.id === selected.id);
        if (updatedSelected) {
          setSelected(updatedSelected);
        }
      }
    } catch (err) {
      console.error('Error fetching support requests:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    if (user?.role === 'administrator' || user?.role === 'national_manager' || user?.role === 'regional_coordinator') {
      userService.getDirectory()
        .then(setUsersList)
        .catch(console.error);
    }
  }, [user]);

  const filtered = requests.filter(r => {
    if (filterStatus !== 'all') {
      const filterLabel = STATUS_CONFIG[filterStatus]?.label;
      const requestLabel = STATUS_CONFIG[r.status]?.label || r.status;
      if (filterLabel !== requestLabel) return false;
    }
    if (filterPriority !== 'all' && r.priority !== filterPriority) return false;
    if (user?.role === 'field_officer' && r.requester !== user.name) return false;
    return true;
  });

  const KANBAN_COLS = ['submitted', 'submitted_to_manager', 'under review', 'approved', 'fulfilled'];

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading support requests...</div>;
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title"><LifeBuoy size={24} style={{ verticalAlign: 'middle', marginRight: 10 }} />Support Requests</h1>
          <p className="page-subtitle">{filtered.length} requests · {requests.filter(r => r.status === 'submitted' || r.status === 'under review').length} active</p>
        </div>
        <div className="support-header-actions">
          <div className="tabs" style={{ width: 'auto' }}>
            {['list', 'kanban'].map(v => <button key={v} className={`tab ${view === v ? 'active' : ''}`} style={{ flex: 'none', padding: '6px 14px' }} onClick={() => setView(v)}>{v.charAt(0).toUpperCase() + v.slice(1)}</button>)}
          </div>
          {(user?.role === 'administrator' || user?.role === 'national_manager') && (
            <button 
              className={`btn btn-secondary ${isAnalyzing ? 'btn-disabled' : ''}`} 
              onClick={handleBatchAIAnalysis} 
              disabled={isAnalyzing}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {isAnalyzing ? '⏳ Analyzing...' : '🤖 Run AI Analysis'}
            </button>
          )}
          <button className="btn btn-primary" onClick={() => navigate('/support/new')}><Plus size={16} />New Request</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        <div className="support-chip-bar">
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', alignSelf: 'center', whiteSpace: 'nowrap' }}>Status:</span>
          {['all', ...KANBAN_COLS, 'closed'].map(s => (
            <button key={s} className={`chip ${filterStatus === s ? 'active' : ''}`} style={{ flexShrink: 0, whiteSpace: 'nowrap' }} onClick={() => setFilterStatus(s)}>
              {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label || s}
            </button>
          ))}
        </div>
        <div className="support-chip-bar">
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', alignSelf: 'center', whiteSpace: 'nowrap' }}>Priority:</span>
          {['all', 'urgent', 'high', 'medium', 'low'].map(p => (
            <button key={p} className={`chip ${filterPriority === p ? 'active' : ''}`} style={{ flexShrink: 0, whiteSpace: 'nowrap' }} onClick={() => setFilterPriority(p)}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {view === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(req => {
            const TypeIcon = TYPE_ICONS[req.type] || MoreHorizontal;
            const isSelected = selected?.id === req.id;
            const priorityBorderColor = req.priority === 'urgent' ? '#ef4444' : req.priority === 'high' ? '#f59e0b' : req.priority === 'medium' ? '#3b82f6' : '#94a3b8';

            return (
              <div 
                key={req.id} 
                className="card mobile-support-card" 
                style={{ 
                  cursor: 'pointer',
                  borderLeft: `4px solid ${priorityBorderColor}`,
                  transition: 'all var(--transition)'
                }} 
                onClick={() => setSelected(isSelected ? null : req)}
              >
                <div style={{ padding: '16px' }}>
                  <div className="support-card-main">
                    <div className="support-card-content">
                      <div style={{ width: 38, height: 38, borderRadius: 'var(--radius)', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <TypeIcon size={18} color="var(--primary)" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <p style={{ fontWeight: 700, fontSize: '0.92rem', lineHeight: 1.35 }}>{req.title}</p>
                          <span className="mobile-chevron-icon" style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }}>
                            {isSelected ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4, fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                          <span>{req.type}</span>
                          <span>•</span>
                          <span><MapPin size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} />{req.region}</span>
                          <span>•</span>
                          <span>Submitted {req.submittedDate}</span>
                        </div>
                        {isSelected && (
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 10, lineHeight: 1.6, background: 'var(--bg-input)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
                            {req.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="support-card-badges">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span className={`badge ${PRIORITY_CONFIG[req.priority]?.cls || 'badge-gray'}`}>{PRIORITY_CONFIG[req.priority]?.label || req.priority}</span>
                        {req.aiPriority && !req.manualPriorityOverride && (
                          <span className="ai-priority-badge" title={`AI Suggestion: ${req.aiPriorityConfidence}% confidence\nReason: ${req.aiPriorityReason}`}>
                            🤖 <span className="ai-conf">{req.aiPriorityConfidence}%</span>
                          </span>
                        )}
                      </span>
                      <span className={`badge ${STATUS_CONFIG[req.status]?.cls || 'badge-gray'}`}>{STATUS_CONFIG[req.status]?.label || req.status}</span>
                    </div>
                  </div>

                  {isSelected && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-light)' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                        {req.assignedTo && <span style={{ fontSize: '0.78rem' }}>📋 Assigned to: <strong>{req.assignedTo}</strong></span>}
                        <span style={{ fontSize: '0.78rem' }}>📅 Deadline: <strong>{req.deadline}</strong></span>
                        <span style={{ fontSize: '0.78rem' }}>👤 Requester: <strong>{req.requester}</strong></span>
                      </div>

                      {/* Edit / Delete actions for owner or admin */}
                      {(req.requester === user?.name || user?.role === 'administrator' || user?.role === 'national_manager' || user?.role === 'regional_coordinator') && (
                        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                          {(req.requester === user?.name || user?.role === 'administrator' || user?.role === 'national_manager') && req.status !== 'fulfilled' && req.status !== 'closed' && (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem' }}
                              onClick={() => navigate(`/support/${req.id}/edit`)}
                            >
                              <Edit3 size={13} /> Edit Request
                            </button>
                          )}
                          <button
                            className="btn btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', background: 'rgba(239,68,68,0.08)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)' }}
                            disabled={deleteSubmitting === req.id}
                            onClick={() => handleDelete(req.id, req.title)}
                          >
                            <Trash2 size={13} /> {deleteSubmitting === req.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      )}

                      {req.aiPriority && (
                        <div className={`ai-insight-card ${req.manualPriorityOverride ? 'override' : ''}`} style={{ marginBottom: 14, padding: '12px 16px', borderRadius: 'var(--radius)', background: 'var(--bg-input)', border: req.manualPriorityOverride ? '1px dashed var(--border)' : '1px solid var(--primary-300)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.8rem', color: req.manualPriorityOverride ? 'var(--text-muted)' : 'var(--primary)' }}>
                            <span>🤖 AI Priority Insight</span>
                            {req.manualPriorityOverride && <span style={{ fontSize: '0.72rem', fontWeight: 'normal', color: 'var(--danger)' }}>(Manually Overridden)</span>}
                          </div>
                          <div style={{ fontSize: '0.78rem', marginTop: 4, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            <strong>Suggested Priority:</strong> <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{req.aiPriority}</span> (Confidence: {req.aiPriorityConfidence}%)<br />
                            <strong>Reason:</strong> {req.aiPriorityReason}
                          </div>
                        </div>
                      )}

                      {/* Comments section */}
                      <div style={{ marginTop: 16 }}>
                        <p style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: 8 }}><MessageSquare size={12} style={{ marginRight: 4, display: 'inline' }} />Comments</p>
                        {req.comments.length > 0 ? (
                          req.comments.map((c, i) => (
                            <div key={i} style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius)', padding: '10px 12px', marginBottom: 6 }}>
                              <p style={{ fontSize: '0.78rem', fontWeight: 600 }}>{c.author} · <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>{c.time}</span></p>
                              <p style={{ fontSize: '0.8rem', marginTop: 4 }}>{c.text}</p>
                            </div>
                          ))
                        ) : (
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>No comments yet.</p>
                        )}

                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            style={{ fontSize: '0.8rem' }}
                          />
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={!newComment.trim() || commentSubmitting}
                            onClick={async () => {
                              setCommentSubmitting(true);
                              try {
                                await supportService.addComment(req.id, newComment);
                                setNewComment('');
                                await fetchRequests();
                              } catch (err) {
                                console.error('Error posting comment:', err);
                              } finally {
                                setCommentSubmitting(false);
                              }
                            }}
                          >
                            Send
                          </button>
                        </div>
                      </div>

                      {/* Management tools */}
                      {(user?.role === 'administrator' || user?.role === 'national_manager' || user?.role === 'regional_coordinator') && (
                        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-light)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 150 }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Update Status</span>
                            <select
                              className="form-control"
                              style={{ fontSize: '0.8rem', padding: '4px 8px', height: 'auto' }}
                              value={req.status}
                              disabled={statusSubmitting}
                              onChange={async (e) => {
                                setStatusSubmitting(true);
                                try {
                                  await supportService.updateStatus(req.id, e.target.value);
                                  await fetchRequests();
                                } catch (err) {
                                  console.error('Error updating status:', err);
                                } finally {
                                  setStatusSubmitting(false);
                                }
                              }}
                            >
                              <option value="submitted">Submitted</option>
                              <option value="under review">Under Review</option>
                              <option value="approved">Approved</option>
                              <option value="fulfilled">Fulfilled</option>
                              <option value="closed">Closed</option>
                            </select>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 150 }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>AI Priority Analysis</span>
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.8rem', padding: '6px 8px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await supportService.triggerAIAnalysis(req.id);
                                  if (addNotification) {
                                    addNotification({
                                      type: 'system',
                                      title: 'AI Analysis Started',
                                      message: `Analysis task queued for request #${req.id}.`,
                                      icon: 'cpu'
                                    });
                                  }
                                  setTimeout(fetchRequests, 2000);
                                } catch (err) {
                                  console.error('Failed to trigger AI analysis:', err);
                                }
                              }}
                            >
                              🤖 Re-classify
                            </button>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 150 }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Assign To</span>
                            <select
                              className="form-control"
                              style={{ fontSize: '0.8rem', padding: '4px 8px', height: 'auto' }}
                              value={usersList.find(u => u.name === req.assignedTo)?.id || ''}
                              disabled={assignSubmitting}
                              onChange={async (e) => {
                                const val = e.target.value;
                                if (!val) return;
                                setAssignSubmitting(true);
                                try {
                                  await supportService.assign(req.id, val);
                                  await fetchRequests();
                                } catch (err) {
                                  console.error('Error assigning user:', err);
                                } finally {
                                  setAssignSubmitting(false);
                                }
                              }}
                            >
                              <option value="">-- Select Assignee --</option>
                              {usersList.map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="empty-state card" style={{ padding: '60px' }}>
              <LifeBuoy size={40} className="empty-state-icon" />
              <h3>No Support Requests</h3>
              <p>Submit a new request to get help from the team.</p>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/support/new')}><Plus size={16} />New Request</button>
            </div>
          )}
        </div>
      )}

      {view === 'kanban' && (
        <>
          {/* Desktop Kanban View (>=768px) */}
          <div className="support-kanban-desktop" style={{ display: 'grid', gridTemplateColumns: `repeat(${KANBAN_COLS.length}, minmax(240px, 1fr))`, gap: 16, overflowX: 'auto', paddingBottom: 10 }}>
            {KANBAN_COLS.map(col => (
              <div key={col}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{STATUS_CONFIG[col].label}</span>
                  <span className={`badge ${STATUS_CONFIG[col].cls}`}>{requests.filter(r => (STATUS_CONFIG[r.status]?.label || r.status) === STATUS_CONFIG[col]?.label).length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {requests.filter(r => (STATUS_CONFIG[r.status]?.label || r.status) === STATUS_CONFIG[col]?.label).map(req => {
                    const TypeIcon = TYPE_ICONS[req.type] || MoreHorizontal;
                    return (
                      <div key={req.id} className="card" style={{ padding: '14px', cursor: 'pointer' }} onClick={() => { setSelected(req); setView('list'); }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                          <TypeIcon size={16} color="var(--primary)" />
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <span className={`badge ${PRIORITY_CONFIG[req.priority]?.cls || 'badge-gray'}`} style={{ fontSize: '0.65rem' }}>{PRIORITY_CONFIG[req.priority]?.label || req.priority}</span>
                            {req.aiPriority && !req.manualPriorityOverride && (
                              <span className="ai-priority-badge" style={{ fontSize: '0.6rem', padding: '1px 3px' }} title={`AI: ${req.aiPriorityReason}`}>
                                🤖
                              </span>
                            )}
                          </div>
                        </div>
                        <p style={{ fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.4, marginBottom: 6 }}>{req.title}</p>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{req.requester}</p>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginTop: 4 }}>Due: {req.deadline}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Kanban View (<768px): Swipeable Column Tabs */}
          <div className="support-kanban-mobile">
            <div className="mobile-kanban-column-tabs">
              {KANBAN_COLS.map(col => {
                const count = requests.filter(r => (STATUS_CONFIG[r.status]?.label || r.status) === STATUS_CONFIG[col]?.label).length;
                return (
                  <button
                    key={col}
                    type="button"
                    className={`mobile-kanban-col-pill ${mobileKanbanCol === col ? 'active' : ''}`}
                    onClick={() => setMobileKanbanCol(col)}
                  >
                    <span>{STATUS_CONFIG[col].label}</span>
                    <span className="pill-badge">{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="mobile-kanban-cards-list">
              {requests.filter(r => (STATUS_CONFIG[r.status]?.label || r.status) === STATUS_CONFIG[mobileKanbanCol]?.label).length === 0 ? (
                <div className="card" style={{ padding: '30px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <p style={{ fontSize: '0.85rem' }}>No requests in <strong>{STATUS_CONFIG[mobileKanbanCol].label}</strong></p>
                </div>
              ) : (
                requests
                  .filter(r => (STATUS_CONFIG[r.status]?.label || r.status) === STATUS_CONFIG[mobileKanbanCol]?.label)
                  .map(req => {
                    const TypeIcon = TYPE_ICONS[req.type] || MoreHorizontal;
                    const priorityBorderColor = req.priority === 'urgent' ? '#ef4444' : req.priority === 'high' ? '#f59e0b' : req.priority === 'medium' ? '#3b82f6' : '#94a3b8';
                    return (
                      <div 
                        key={req.id} 
                        className="card" 
                        style={{ padding: '14px', borderLeft: `4px solid ${priorityBorderColor}`, cursor: 'pointer' }}
                        onClick={() => { setSelected(req); setView('list'); }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <TypeIcon size={16} color="var(--primary)" />
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{req.type}</span>
                          </div>
                          <span className={`badge ${PRIORITY_CONFIG[req.priority]?.cls || 'badge-gray'}`} style={{ fontSize: '0.68rem' }}>
                            {PRIORITY_CONFIG[req.priority]?.label || req.priority}
                          </span>
                        </div>
                        <h4 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: 6, lineHeight: 1.35 }}>{req.title}</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 8 }}>
                          <span>👤 {req.requester}</span>
                          <span>📅 Due {req.deadline}</span>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
