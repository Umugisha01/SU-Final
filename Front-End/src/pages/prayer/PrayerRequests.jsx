import { useState, useEffect } from 'react';
import { Heart, Plus, Download, CheckCircle, Clock, Tag, MapPin } from 'lucide-react';
import { REGIONS } from '../../data/mockData';
import { useAuth } from '../../contexts/AuthContext';
import { prayerService } from '../../services/api';

const STATUS_CONFIG = {
  pending: { cls: 'badge-info', label: 'Pending', icon: Clock },
  prayed: { cls: 'badge-primary', label: 'Prayed', icon: Heart },
  answered: { cls: 'badge-success', label: 'Answered', icon: CheckCircle },
};

export default function PrayerRequests() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pending'); // default to pending (backend: active)
  const [filterRegion, setFilterRegion] = useState('all');
  const [filterTheme, setFilterTheme] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newReq, setNewReq] = useState({ title: '', description: '', anonymous: false });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async () => {
    try {
      // Map activeTab to backend status:
      // 'pending' -> 'active', 'prayed' -> 'archived', 'answered' -> 'answered'
      const statusMap = {
        all: 'active',
        pending: 'active',
        prayed: 'archived',
        answered: 'answered'
      };
      const backendStatus = statusMap[activeTab] || 'active';
      const filters = { status: backendStatus };
      if (filterRegion !== 'all') {
        filters.region = filterRegion;
      }
      
      const data = await prayerService.list(filters);
      setRequests(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching prayers:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [activeTab, filterRegion]);

  const filtered = requests.filter(p => {
    if (filterTheme !== 'all' && !p.themes.includes(filterTheme)) return false;
    return true;
  });

  const handleCommitToggle = async (p) => {
    try {
      if (p.hasCommitted) {
        await prayerService.uncommit(p.id);
      } else {
        await prayerService.commit(p.id);
      }
      fetchRequests();
    } catch (err) {
      console.error('Error toggling commitment:', err);
    }
  };

  const handleMarkAnswered = async (id) => {
    try {
      await prayerService.updateStatus(id, 'answered');
      fetchRequests();
    } catch (err) {
      console.error('Error marking as answered:', err);
    }
  };

  const validate = () => {
    const e = {};
    if (newReq.title.trim().length < 5) {
      e.title = 'Title must be at least 5 characters long';
    }
    if (newReq.description.trim().length < 10) {
      e.description = 'Prayer request description must be at least 10 characters long';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submitReq = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await prayerService.create({
        title: newReq.title,
        description: newReq.description,
        anonymous: newReq.anonymous
      });
      setShowForm(false);
      setNewReq({ title: '', description: '', anonymous: false });
      fetchRequests();
    } catch (err) {
      console.error('Error creating prayer request:', err);
      const detail = err.response?.data?.error || err.response?.data || err.message;
      setErrors({ submit: typeof detail === 'object' ? JSON.stringify(detail) : detail });
    } finally {
      setSubmitting(false);
    }
  };

  const allThemes = [...new Set(requests.flatMap(p => p.themes))];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Heart size={24} style={{ verticalAlign: 'middle', marginRight: 10 }} />Prayer Requests</h1>
          <p className="page-subtitle">{requests.length} requests in this tab</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => window.print()}><Download size={14} />Export for Prayer Meeting</button>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} />Add Request</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="tabs" style={{ width: 'auto' }}>
          {['pending', 'prayed', 'answered'].map(t => (
            <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} style={{ flex: 'none', padding: '6px 14px' }} onClick={() => setActiveTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <select className="form-control form-select" style={{ width: 180 }} value={filterRegion} onChange={e => setFilterRegion(e.target.value)}>
          <option value="all">All Regions</option>
          {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className="form-control form-select" style={{ width: 160 }} value={filterTheme} onChange={e => setFilterTheme(e.target.value)}>
          <option value="all">All Themes</option>
          {allThemes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Answered celebration banner */}
      {activeTab === 'answered' && filtered.length > 0 && (
        <div className="alert alert-success" style={{ marginBottom: 20, borderRadius: 'var(--radius-lg)', fontSize: '0.9rem' }}>
          <CheckCircle size={20} />
          <div>
            <strong>Praise God! 🙌</strong> {filtered.length} prayer requests have been answered. These testimonies encourage our faith!
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>Loading prayer requests...</div>
      ) : (
        <div className="grid grid-2">
          {filtered.map(p => {
            const cfg = STATUS_CONFIG[p.status] || { cls: 'badge-info', label: p.status, icon: Clock };
            const Icon = cfg.icon;
            return (
              <div key={p.id} className="card" style={{ padding: '20px', borderLeft: `4px solid ${p.status === 'answered' ? '#22c55e' : p.status === 'prayed' ? '#2e7d32' : '#3b82f6'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>{p.title}</p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <MapPin size={11} />{p.region}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        by {p.anonymous ? '🔒 Anonymous' : p.submittedBy}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.date}</span>
                    </div>
                  </div>
                  <span className={`badge ${cfg.cls}`}><Icon size={11} />{cfg.label}</span>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>{p.description}</p>

                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                  {p.themes.map(t => <span key={t} className="chip" style={{ fontSize: '0.72rem', cursor: 'default' }}><Tag size={10} />{t}</span>)}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    ❤️ {p.responses} prayers committed
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button 
                      className={`btn btn-sm ${p.hasCommitted ? 'btn-primary' : 'btn-secondary'}`} 
                      style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}
                      onClick={() => handleCommitToggle(p)}
                    >
                      <Heart size={11} fill={p.hasCommitted ? 'currentColor' : 'none'} />
                      {p.hasCommitted ? 'Praying' : 'Pray'}
                    </button>
                    {p.status === 'pending' && (user?.role === 'admin' || user?.role === 'manager' || p.submittedBy === user?.name) && (
                      <button 
                        className="btn btn-sm btn-secondary" 
                        style={{ fontSize: '0.72rem' }}
                        onClick={() => handleMarkAnswered(p.id)}
                      >
                        <CheckCircle size={11} /> Mark Answered
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="empty-state card" style={{ padding: '60px' }}>
          <Heart size={40} className="empty-state-icon" />
          <h3>No Prayer Requests Found</h3>
          <p>Be the first to share a prayer request with the team.</p>
        </div>
      )}

      {/* Submit modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Heart size={18} style={{ marginRight: 8 }} />New Prayer Request</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              {errors.submit && (
                <div className="alert alert-danger" style={{ fontSize: '0.82rem', marginBottom: 12 }}>
                  {errors.submit}
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Prayer Request Title <span>*</span></label>
                <input 
                  className="form-control" 
                  placeholder="Brief title of your prayer need" 
                  value={newReq.title} 
                  onChange={e => setNewReq(p => ({ ...p, title: e.target.value }))} 
                />
                {errors.title && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{errors.title}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Description <span>*</span></label>
                <textarea 
                  className="form-control" 
                  rows={4} 
                  placeholder="Share your prayer need in detail..."
                  value={newReq.description} 
                  onChange={e => setNewReq(p => ({ ...p, description: e.target.value }))} 
                />
                {errors.description && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{errors.description}</span>}
              </div>
              
              <label className="checkbox-wrapper" style={{ marginTop: 12 }} onClick={() => setNewReq(p => ({ ...p, anonymous: !p.anonymous }))}>
                <div className={`checkbox ${newReq.anonymous ? 'checked' : ''}`}>
                  {newReq.anonymous && <div style={{ width: 6, height: 6, background: '#fff', borderRadius: '50%' }} />}
                </div>
                <span style={{ fontSize: '0.875rem' }}>Submit anonymously</span>
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button 
                className="btn btn-primary" 
                onClick={submitReq} 
                disabled={!newReq.title.trim() || submitting}
              >
                <Heart size={14} /> {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
