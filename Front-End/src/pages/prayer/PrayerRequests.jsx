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

  const handleExportWord = () => {
    if (!filtered || filtered.length === 0) {
      alert('No prayer requests available to export.');
      return;
    }
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const tabLabel = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);

    const byRegion = {};
    filtered.forEach(p => {
      const region = p.region || 'General';
      if (!byRegion[region]) byRegion[region] = [];
      byRegion[region].push(p);
    });

    const regionSections = Object.entries(byRegion).map(([region, prayers]) => {
      const prayerCards = prayers.map((p, i) => `
        <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #e2e8e2;">
          <p><strong>#${i + 1} ${p.title}</strong></p>
          <p style="font-size: 0.8rem; color: #6b7280;">Region: ${p.region} | Date: ${p.createdAt} | Submitted by: ${p.submittedBy}</p>
          <p>${p.description}</p>
        </div>
      `).join('');
      return `
        <h3>📍 Region: ${region} (${prayers.length})</h3>
        ${prayerCards}
      `;
    }).join('');

    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>SU Connect Prayer Requests</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #1a2e1a;
            margin: 40px;
          }
          .header {
            border-bottom: 2px solid #2e7d32;
            padding-bottom: 20px;
            margin-bottom: 30px;
            text-align: center;
          }
          .title {
            font-size: 1.5rem;
            font-weight: bold;
            color: #2e7d32;
          }
          .subtitle {
            font-size: 0.95rem;
            color: #6b7280;
          }
          h3 {
            color: #2e7d32;
            border-bottom: 1.5px solid #2e7d32;
            padding-bottom: 6px;
            margin-top: 30px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">Scripture Union Rwanda</div>
          <h2>🙏 Prayer Meeting Requests</h2>
          <p class="subtitle">${dateStr} · ${tabLabel} Requests</p>
        </div>

        ${regionSections}
      </body>
      </html>
    `;

    const blob = new Blob(["\uFEFF", content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `su_connect_prayer_requests_${new Date().toISOString().slice(0,10)}.doc`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    if (!filtered || filtered.length === 0) {
      alert('No prayer requests available to export.');
      return;
    }

    const printWindow = window.open('', '_blank');
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const tabLabel = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);

    // Group prayers by region
    const byRegion = {};
    filtered.forEach(p => {
      const region = p.region || 'General';
      if (!byRegion[region]) byRegion[region] = [];
      byRegion[region].push(p);
    });

    const regionSections = Object.entries(byRegion).map(([region, prayers]) => {
      const prayerCards = prayers.map((p, i) => `
        <div class="prayer-card">
          <div class="prayer-number">${i + 1}</div>
          <div class="prayer-body">
            <div class="prayer-title">${p.title}</div>
            <div class="prayer-meta">
              <span>📍 ${p.region}</span>
              <span>👤 ${p.anonymous ? 'Anonymous' : p.submittedBy}</span>
              <span>📅 ${p.date}</span>
              <span>❤️ ${p.responses} committed</span>
            </div>
            <div class="prayer-text">${p.description}</div>
            ${p.themes && p.themes.length > 0 ? `
              <div class="prayer-themes">
                ${p.themes.map(t => `<span class="theme-tag">${t}</span>`).join('')}
              </div>
            ` : ''}
          </div>
        </div>
      `).join('');

      return `
        <div class="region-section">
          <div class="region-header">
            <span class="region-icon">🏛️</span>
            <span>${region}</span>
            <span class="region-count">${prayers.length} request${prayers.length !== 1 ? 's' : ''}</span>
          </div>
          ${prayerCards}
        </div>
      `;
    }).join('');

    const totalCommitments = filtered.reduce((sum, p) => sum + (p.responses || 0), 0);

    const html = `
      <html>
      <head>
        <title>Prayer Meeting – Scripture Union Rwanda</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

          * { margin: 0; padding: 0; box-sizing: border-box; }

          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            color: #1a2e1a;
            margin: 0;
            padding: 40px 48px;
            line-height: 1.6;
            background: #fff;
          }

          /* ── Header ── */
          .doc-header {
            text-align: center;
            padding-bottom: 24px;
            margin-bottom: 28px;
            border-bottom: 3px solid #2e7d32;
          }
          .org-name {
            font-size: 1.4rem;
            font-weight: 800;
            color: #2e7d32;
            letter-spacing: 0.02em;
          }
          .doc-title {
            font-size: 1.75rem;
            font-weight: 800;
            color: #1a2e1a;
            margin: 8px 0 4px;
          }
          .doc-subtitle {
            font-size: 0.9rem;
            color: #6b7280;
          }
          .scripture-verse {
            margin-top: 16px;
            padding: 14px 24px;
            background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
            border-left: 4px solid #2e7d32;
            border-radius: 0 8px 8px 0;
            font-style: italic;
            font-size: 0.88rem;
            color: #374151;
            line-height: 1.6;
          }
          .scripture-ref {
            display: block;
            text-align: right;
            font-weight: 700;
            font-style: normal;
            color: #2e7d32;
            margin-top: 6px;
            font-size: 0.82rem;
          }

          /* ── Summary strip ── */
          .summary-strip {
            display: flex;
            gap: 16px;
            margin-bottom: 28px;
          }
          .summary-card {
            flex: 1;
            text-align: center;
            background: #f8faf8;
            border: 1px solid #e2e8e2;
            border-radius: 10px;
            padding: 14px 10px;
          }
          .summary-value {
            font-size: 1.6rem;
            font-weight: 800;
            color: #2e7d32;
          }
          .summary-label {
            font-size: 0.7rem;
            text-transform: uppercase;
            color: #6b7280;
            letter-spacing: 0.06em;
            margin-top: 2px;
          }

          /* ── Region sections ── */
          .region-section {
            margin-bottom: 28px;
            break-inside: avoid;
          }
          .region-header {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 16px;
            background: #2e7d32;
            color: #fff;
            border-radius: 8px 8px 0 0;
            font-weight: 700;
            font-size: 0.95rem;
          }
          .region-icon { font-size: 1.1rem; }
          .region-count {
            margin-left: auto;
            font-size: 0.75rem;
            font-weight: 500;
            opacity: 0.85;
          }

          /* ── Prayer cards ── */
          .prayer-card {
            display: flex;
            gap: 14px;
            padding: 16px 18px;
            border: 1px solid #e2e8e2;
            border-top: none;
            background: #fff;
            break-inside: avoid;
          }
          .prayer-card:last-child {
            border-radius: 0 0 8px 8px;
          }
          .prayer-number {
            flex-shrink: 0;
            width: 28px;
            height: 28px;
            background: #e8f5e9;
            color: #2e7d32;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 0.78rem;
            margin-top: 2px;
          }
          .prayer-body { flex: 1; }
          .prayer-title {
            font-weight: 700;
            font-size: 0.92rem;
            color: #1a2e1a;
            margin-bottom: 4px;
          }
          .prayer-meta {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            font-size: 0.72rem;
            color: #6b7280;
            margin-bottom: 8px;
          }
          .prayer-text {
            font-size: 0.85rem;
            line-height: 1.7;
            color: #374151;
          }
          .prayer-themes {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            margin-top: 8px;
          }
          .theme-tag {
            display: inline-block;
            background: #f0fdf4;
            color: #2e7d32;
            border: 1px solid #bbf7d0;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.68rem;
            font-weight: 600;
          }

          /* ── Notes section ── */
          .notes-section {
            margin-top: 32px;
            padding: 20px 24px;
            border: 1.5px dashed #d1d5db;
            border-radius: 10px;
            break-inside: avoid;
          }
          .notes-title {
            font-weight: 700;
            font-size: 0.9rem;
            color: #2e7d32;
            margin-bottom: 10px;
          }
          .notes-lines {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
          .note-line {
            border-bottom: 1px solid #e5e7eb;
            height: 1px;
          }

          /* ── Footer ── */
          .doc-footer {
            margin-top: 32px;
            padding-top: 16px;
            border-top: 2px solid #2e7d32;
            text-align: center;
            font-size: 0.75rem;
            color: #9ca3af;
          }

          @media print {
            body { padding: 24px 32px; }
            .prayer-card { break-inside: avoid; }
            .region-section { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="doc-header" style="display: flex; align-items: center; justify-content: center; gap: 16px; border-bottom: 3px solid #2e7d32; padding-bottom: 24px; margin-bottom: 28px;">
          <img src="/SU-Logo.png" alt="SU Logo" style="height: 60px; filter: invert(34%) sepia(87%) saturate(1518%) hue-rotate(94deg) brightness(95%) contrast(85%);" />
          <div style="text-align: left;">
            <div class="org-name" style="margin: 0; line-height: 1.2;">Scripture Union Rwanda</div>
            <div class="doc-title" style="margin: 4px 0 0 0; font-size: 1.5rem; line-height: 1.2;">🙏 Prayer Meeting Requests</div>
          </div>
        </div>
        <div style="margin-top: 20px;">
          <div class="doc-subtitle">${dateStr} · ${tabLabel} Requests${filterRegion !== 'all' ? ' · ' + filterRegion : ''}</div>
          <div class="scripture-verse">
            "Do not be anxious about anything, but in every situation, by prayer and petition,
            with thanksgiving, present your requests to God. And the peace of God, which
            transcends all understanding, will guard your hearts and your minds in Christ Jesus."
            <span class="scripture-ref">— Philippians 4:6-7 (NIV)</span>
          </div>
        </div>

        <div class="summary-strip">
          <div class="summary-card">
            <div class="summary-value">${filtered.length}</div>
            <div class="summary-label">Prayer Requests</div>
          </div>
          <div class="summary-card">
            <div class="summary-value">${Object.keys(byRegion).length}</div>
            <div class="summary-label">Regions</div>
          </div>
          <div class="summary-card">
            <div class="summary-value">${totalCommitments}</div>
            <div class="summary-label">Commitments</div>
          </div>
          <div class="summary-card">
            <div class="summary-value">${filtered.filter(p => p.anonymous).length}</div>
            <div class="summary-label">Anonymous</div>
          </div>
        </div>

        ${regionSections}

        <div class="notes-section">
          <div class="notes-title">📝 Prayer Meeting Notes</div>
          <div class="notes-lines">
            ${Array(6).fill('<div class="note-line"></div>').join('')}
          </div>
        </div>

        <div class="doc-footer">
          Scripture Union Rwanda · SU Connect Platform · Exported on ${today.toLocaleDateString('en-GB')} at ${today.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} · Confidential
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
    printWindow.onafterprint = () => {
      printWindow.close();
    };
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
          <button className="btn btn-secondary btn-sm" onClick={handleExportPDF}><Download size={14} />Export for Prayer Meeting</button>
          {(user?.role === 'administrator' || user?.role === 'national_manager' || user?.role === 'regional_coordinator') && (
            <button className="btn btn-secondary btn-sm" onClick={handleExportWord}><Download size={14} />Export Word</button>
          )}
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
                    {p.status === 'pending' && (user?.role === 'administrator' || user?.role === 'national_manager' || p.submittedBy === user?.name) && (
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
