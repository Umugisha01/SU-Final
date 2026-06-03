import { useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Brain, Tag, TrendingUp, AlertCircle, CheckCircle, Edit, Download, RefreshCw, Eye } from 'lucide-react';
import { mockReports, mockAnalytics } from '../../data/mockData';

const THEMES = [
  { theme: 'Youth Engagement', count: 18, trend: 'up', insight: 'Youth participation has increased 34% from Q1' },
  { theme: 'Bible Study Growth', count: 14, trend: 'up', insight: 'Bible study groups expanding in Northern & Eastern regions' },
  { theme: 'Community Outreach', count: 12, trend: 'stable', insight: 'Consistent outreach activities across all regions' },
  { theme: 'Training & Capacity', count: 9, trend: 'up', insight: 'Staff training requests growing — recommend budget allocation' },
  { theme: 'Resource Constraints', count: 7, trend: 'down', insight: 'Fewer resource challenges reported compared to Q1' },
  { theme: 'Partnership Opportunities', count: 5, trend: 'up', insight: 'New partnerships emerging in Kigali and Western Province' },
];

const AI_ANALYSES = mockReports.slice(0, 5).map(r => ({
  ...r,
  aiCategory: r.type,
  confidence: Math.round(80 + Math.random() * 18),
  keywords: ['ministry', 'outreach', r.type.toLowerCase(), r.region.split(' ')[0].toLowerCase(), 'participants', 'community'].slice(0, 4),
  aiSummary: `AI analysis identifies this as a ${r.type.toLowerCase()} activity with ${r.participants} participants. Key outcomes: community engagement and ${r.outcomes?.split('.')[0]?.toLowerCase() || 'positive impact'}.`,
  overridden: false,
}));

export default function AIAnalysisDashboard() {
  const [analyses, setAnalyses] = useState(AI_ANALYSES);
  const [selected, setSelected] = useState(null);
  const [overrideModal, setOverrideModal] = useState(null);
  const [overrideValue, setOverrideValue] = useState('');
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const runAnalysis = async () => {
    setRunning(true);
    await new Promise(r => setTimeout(r, 2000));
    setRunning(false);
  };

  const applyOverride = () => {
    setAnalyses(prev => prev.map(a => a.id === overrideModal.id
      ? { ...a, aiCategory: overrideValue, overridden: true, confidence: 100 } : a));
    setOverrideModal(null);
  };

  const COLORS = ['#2e7d32', '#1565c0', '#f9a825', '#6a1b9a', '#c62828', '#00838f', '#e91e63'];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Brain size={24} style={{ verticalAlign: 'middle', marginRight: 10 }} />AI Report Analysis</h1>
          <p className="page-subtitle">Automated categorization, trend detection, and insights</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm"><Download size={14} />Export Analysis</button>
          <button className="btn btn-primary" onClick={runAnalysis} disabled={running}>
            <RefreshCw size={16} className={running ? 'spin' : ''} />
            {running ? 'Analyzing...' : 'Run Analysis'}
          </button>
        </div>
      </div>

      {running && (
        <div className="alert alert-info" style={{ marginBottom: 20 }}>
          <Brain size={16} /> AI is analyzing {mockReports.length} reports... Extracting keywords, classifying activity types, and detecting trends.
        </div>
      )}

      <div className="tabs" style={{ marginBottom: 20 }}>
        {['overview', 'categorization', 'themes', 'insights'].map(t => (
          <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-4" style={{ marginBottom: 20 }}>
            {[
              { label: 'Reports Analyzed', val: analyses.length, icon: Brain, color: 'green' },
              { label: 'Avg Confidence', val: `${Math.round(analyses.reduce((a, r) => a + r.confidence, 0) / analyses.length)}%`, icon: CheckCircle, color: 'blue' },
              { label: 'Themes Detected', val: THEMES.length, icon: Tag, color: 'purple' },
              { label: 'Manual Overrides', val: analyses.filter(a => a.overridden).length, icon: Edit, color: 'amber' },
            ].map(({ label, val, icon: I, color }) => (
              <div key={label} className="stat-card">
                <div className={`stat-icon ${color}`}><I size={22} /></div>
                <div><div className="stat-value">{val}</div><div className="stat-label">{label}</div></div>
              </div>
            ))}
          </div>

          <div className="grid grid-2" style={{ marginBottom: 20 }}>
            <div className="card">
              <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Activity Distribution</h3></div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={mockAnalytics.byType} cx="50%" cy="50%" outerRadius={90} dataKey="count" nameKey="type" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {mockAnalytics.byType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Regional Activity</h3></div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={mockAnalytics.byRegion} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="region" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
                    <Tooltip />
                    <Bar dataKey="reports" fill="#2e7d32" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'categorization' && (
        <div className="card">
          <div className="card-header"><h3 style={{ fontSize: '1rem' }}>AI-Classified Reports</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Click a row to view analysis · Override incorrect classifications</p>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead><tr>
                <th>Report</th><th>AI Category</th><th>Keywords</th><th>Confidence</th><th>Status</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {analyses.map(a => (
                  <tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(a === selected ? null : a)}>
                    <td style={{ fontWeight: 600, fontSize: '0.85rem', maxWidth: 220 }} className="truncate">{a.title}</td>
                    <td><span className="chip" style={{ cursor: 'default' }}>{a.aiCategory}</span>{a.overridden && <span className="badge badge-warning" style={{ marginLeft: 6 }}>Overridden</span>}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {a.keywords.map(k => <span key={k} className="badge badge-primary" style={{ fontSize: '0.68rem' }}>{k}</span>)}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar" style={{ width: 80 }}>
                          <div className="progress-fill" style={{ width: `${a.confidence}%`, background: a.confidence >= 90 ? 'var(--success)' : a.confidence >= 75 ? 'var(--warning)' : 'var(--danger)' }} />
                        </div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{a.confidence}%</span>
                      </div>
                    </td>
                    <td><span className={`badge ${a.confidence >= 85 ? 'badge-success' : 'badge-warning'}`}>{a.confidence >= 85 ? 'High' : 'Review'}</span></td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-icon btn-sm" title="View AI Summary" onClick={() => setSelected(a)}><Eye size={14} /></button>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Override" onClick={() => { setOverrideModal(a); setOverrideValue(a.aiCategory); }}><Edit size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {selected && (
            <div style={{ padding: '20px 24px', background: 'var(--primary-50)', borderTop: '1px solid var(--primary-100)' }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 8, color: 'var(--primary-dark)' }}>
                <Brain size={14} style={{ marginRight: 6 }} />AI Summary: {selected.title}
              </p>
              <p style={{ fontSize: '0.82rem', lineHeight: 1.6 }}>{selected.aiSummary}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'themes' && (
        <div>
          <div className="grid grid-3" style={{ marginBottom: 20 }}>
            {THEMES.map(t => (
              <div key={t.theme} className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{t.theme}</span>
                  <span className={`badge ${t.trend === 'up' ? 'badge-success' : t.trend === 'down' ? 'badge-danger' : 'badge-gray'}`}>
                    {t.trend === 'up' ? '↑' : t.trend === 'down' ? '↓' : '→'} {t.trend}
                  </span>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', marginBottom: 8 }}>{t.count}</div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{t.insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'insights' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { title: 'Youth Engagement Peak', type: 'positive', text: 'Youth participation has increased by 34% compared to Q1 2025. The Western Province Youth Leadership Program showed the highest youth turnout at 89% of participants.' },
            { title: 'Resource Gap Identified', type: 'warning', text: 'Bible study material requests have increased by 60% in Q2. Northern and Eastern provinces are most affected. Recommend budget reallocation for Q3.' },
            { title: 'Northern Region Underreporting', type: 'warning', text: 'Northern Province has 24% fewer reports than projected for this period. Recommend follow-up with regional coordinator.' },
            { title: 'High Activity — Kigali', type: 'positive', text: 'Kigali City leads in all activity metrics with 38 reports and 1,240 participants. Consider sharing best practices with other regions.' },
            { title: 'Prayer Request Volume Up', type: 'info', text: 'Prayer requests have increased by 28% this quarter, primarily around outreach safety and resource provision. The prayer team has responded to 73% of requests.' },
          ].map(ins => (
            <div key={ins.title} className={`alert alert-${ins.type === 'positive' ? 'success' : ins.type === 'warning' ? 'warning' : 'info'}`} style={{ borderRadius: 'var(--radius-lg)' }}>
              {ins.type === 'positive' ? <CheckCircle size={18} /> : ins.type === 'warning' ? <AlertCircle size={18} /> : <Brain size={18} />}
              <div>
                <p style={{ fontWeight: 700, marginBottom: 4 }}>{ins.title}</p>
                <p style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>{ins.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Override Modal */}
      {overrideModal && (
        <div className="modal-overlay" onClick={() => setOverrideModal(null)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Override AI Classification</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setOverrideModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                Override the AI classification for: <strong>{overrideModal.title}</strong>
              </p>
              <div className="form-group">
                <label className="form-label">New Classification</label>
                <select className="form-control form-select" value={overrideValue} onChange={e => setOverrideValue(e.target.value)}>
                  {['Outreach', 'Bible Study', 'Training', 'Meeting', 'Community Event', 'Youth Program', 'Prayer Meeting'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="alert alert-warning">
                <AlertCircle size={14} />
                <span style={{ fontSize: '0.8rem' }}>This override will be recorded in the audit trail for AI improvement.</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setOverrideModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={applyOverride}>Apply Override</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
