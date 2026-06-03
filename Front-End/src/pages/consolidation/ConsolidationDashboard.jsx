import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart3, Download, Calendar, RefreshCw, Eye, MapPin, Users, FileText, Heart, CheckCircle } from 'lucide-react';
import { mockReports, mockAnalytics, REGIONS, DEPARTMENTS } from '../../data/mockData';

const PERIODS = ['Weekly', 'Monthly', 'Quarterly', 'Annual'];

const RWANDA_REGIONS = [
  { name: 'Kigali City', x: 50, y: 45, reports: 38, color: '#2e7d32' },
  { name: 'Northern', x: 48, y: 20, reports: 24, color: '#1565c0' },
  { name: 'Southern', x: 45, y: 70, reports: 22, color: '#f9a825' },
  { name: 'Eastern', x: 72, y: 48, reports: 19, color: '#6a1b9a' },
  { name: 'Western', x: 22, y: 45, reports: 16, color: '#c62828' },
];

export default function ConsolidationDashboard() {
  const [period, setPeriod] = useState('Monthly');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedDept, setSelectedDept] = useState('all');
  const [showPreview, setShowPreview] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [startDate, setStartDate] = useState('2025-05-01');
  const [endDate, setEndDate] = useState('2025-05-31');

  const filtered = mockReports.filter(r => {
    if (selectedRegion !== 'all' && !r.region.includes(selectedRegion.split(' ')[0])) return false;
    if (selectedDept !== 'all' && r.department !== selectedDept) return false;
    return true;
  });

  const totalParticipants = filtered.reduce((a, r) => a + r.participants, 0);
  const approved = filtered.filter(r => r.status === 'approved').length;

  const generate = async () => {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 1500));
    setGenerating(false);
    setShowPreview(true);
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title"><BarChart3 size={24} style={{ verticalAlign: 'middle', marginRight: 10 }} />Report Consolidation</h1>
          <p className="page-subtitle">Generate consolidated reports for any time period or region</p>
        </div>
        <button className="btn btn-primary" onClick={generate} disabled={generating}>
          <RefreshCw size={16} className={generating ? 'spin' : ''} />
          {generating ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {/* Configuration */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Consolidation Settings</h3></div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ margin: 0, flex: '0 0 auto' }}>
              <label className="form-label">Period</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {PERIODS.map(p => (
                  <button key={p} className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setPeriod(p)}>{p}</button>
                ))}
              </div>
            </div>
            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 140 }}>
              <label className="form-label"><Calendar size={13} style={{ marginRight: 4 }} />Start Date</label>
              <input className="form-control" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 140 }}>
              <label className="form-label">End Date</label>
              <input className="form-control" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 180 }}>
              <label className="form-label"><MapPin size={13} style={{ marginRight: 4 }} />Region</label>
              <select className="form-control form-select" value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)}>
                <option value="all">All Regions</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 180 }}>
              <label className="form-label">Department</label>
              <select className="form-control form-select" value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
                <option value="all">All Departments</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        {[
          { icon: FileText, label: 'Total Reports', val: filtered.length, color: 'green' },
          { icon: CheckCircle, label: 'Approved', val: approved, color: 'blue' },
          { icon: Users, label: 'Total Participants', val: totalParticipants.toLocaleString(), color: 'purple' },
          { icon: Heart, label: 'Prayer Requests', val: filtered.filter(r => r.prayerRequests).length, color: 'red' },
        ].map(({ icon: I, label, val, color }) => (
          <div key={label} className="stat-card">
            <div className={`stat-icon ${color}`}><I size={20} /></div>
            <div><div className="stat-value">{val}</div><div className="stat-label">{label}</div></div>
          </div>
        ))}
      </div>

      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        {/* Chart */}
        <div className="card">
          <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Activity by Region</h3></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={mockAnalytics.byRegion} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="region" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="reports" fill="#2e7d32" radius={[4, 4, 0, 0]} name="Reports" />
                <Bar dataKey="participants" fill="#4caf50" radius={[4, 4, 0, 0]} name="Participants" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rwanda Map Visualization */}
        <div className="card">
          <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Geographic Coverage</h3></div>
          <div className="card-body">
            <div style={{ position: 'relative', background: 'var(--bg-input)', borderRadius: 'var(--radius)', height: 220, overflow: 'hidden' }}>
              {/* Stylized Rwanda map */}
              <svg viewBox="0 0 100 80" style={{ width: '100%', height: '100%' }}>
                <ellipse cx="50" cy="45" rx="38" ry="28" fill="#e8f5e9" stroke="#c8e6c9" strokeWidth="1" />
                {RWANDA_REGIONS.map(r => (
                  <g key={r.name}>
                    <circle cx={r.x} cy={r.y} r={Math.sqrt(r.reports) * 1.2} fill={r.color} opacity="0.8" />
                    <text x={r.x} y={r.y + Math.sqrt(r.reports) * 1.2 + 4} textAnchor="middle" fontSize="3.5" fill="var(--text-primary)">{r.name.split(' ')[0]}</text>
                  </g>
                ))}
              </svg>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              {RWANDA_REGIONS.map(r => (
                <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: r.color }} />
                  <span style={{ fontSize: '0.72rem' }}>{r.name.split(' ')[0]}: {r.reports}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Impact Highlights */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Impact Highlights</h3></div>
        <div className="card-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.filter(r => r.outcomes).slice(0, 4).map(r => (
              <div key={r.id} style={{ display: 'flex', gap: 12, padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius)', borderLeft: '3px solid var(--primary)' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.82rem', fontWeight: 600 }}>{r.title}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{r.outcomes}</p>
                </div>
                <span className="badge badge-success" style={{ alignSelf: 'flex-start' }}>{r.participants} reached</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="modal-overlay" onClick={() => setShowPreview(false)}>
          <div className="modal" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Consolidated Report Preview</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowPreview(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ background: 'var(--bg-input)', padding: '24px', borderRadius: 'var(--radius)', fontFamily: 'serif' }}>
                <h2 style={{ textAlign: 'center', color: 'var(--primary)', marginBottom: 8 }}>Scripture Union Rwanda</h2>
                <h3 style={{ textAlign: 'center', marginBottom: 4 }}>{period} Activity Report</h3>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 24 }}>{startDate} to {endDate}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div style={{ padding: '12px', background: 'white', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{filtered.length}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Activity Reports</div>
                  </div>
                  <div style={{ padding: '12px', background: 'white', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{totalParticipants.toLocaleString()}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Participants</div>
                  </div>
                </div>
                <p style={{ fontSize: '0.85rem', lineHeight: 1.7 }}>This report consolidates {filtered.length} activity reports from {period.toLowerCase()} ministry operations across Scripture Union Rwanda's active regions. A total of {totalParticipants.toLocaleString()} individuals were reached through various ministry activities including outreach, Bible study, training, and community events.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary"><Download size={14} />Export Word</button>
              <button className="btn btn-primary"><Download size={14} />Export PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
