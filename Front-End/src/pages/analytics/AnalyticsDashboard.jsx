import { useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, FileText, Users, LifeBuoy, Download, RefreshCw, Filter, CheckCircle } from 'lucide-react';
import { mockAnalytics } from '../../data/mockData';

const COLORS = ['#2e7d32', '#1565c0', '#f9a825', '#6a1b9a', '#c62828', '#00838f', '#e91e63'];
const COMPLETION_RATES = [
  { region: 'Kigali City', rate: 87, target: 90 },
  { region: 'Northern Province', rate: 72, target: 85 },
  { region: 'Southern Province', rate: 65, target: 80 },
  { region: 'Eastern Province', rate: 58, target: 80 },
  { region: 'Western Province', rate: 52, target: 75 },
];

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('monthly');
  const [exporting, setExporting] = useState(false);

  const totalReports = mockAnalytics.monthlyTrend.reduce((a, m) => a + m.reports, 0);
  const totalParticipants = mockAnalytics.monthlyTrend.reduce((a, m) => a + m.participants, 0);
  const avgApproval = Math.round((mockAnalytics.monthlyTrend.reduce((a, m) => a + m.approved, 0) / totalReports) * 100);

  const handleExport = async (format) => {
    setExporting(true);
    await new Promise(r => setTimeout(r, 1200));
    setExporting(false);
    alert(`Exporting as ${format}...`);
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title"><TrendingUp size={24} style={{ verticalAlign: 'middle', marginRight: 10 }} />Reporting & Analytics</h1>
          <p className="page-subtitle">Comprehensive organizational performance metrics</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['weekly', 'monthly', 'quarterly', 'annual'].map(d => (
              <button key={d} className={`btn btn-sm ${dateRange === d ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setDateRange(d)}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => handleExport('PDF')} disabled={exporting}>
            <Download size={14} />{exporting ? 'Exporting...' : 'Export PDF'}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => handleExport('Excel')}>
            <Download size={14} />Export Excel
          </button>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 20 }}>
        {['overview', 'activities', 'regions', 'support', 'custom'].map(t => (
          <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-4" style={{ marginBottom: 24 }}>
            {[
              { icon: FileText, label: 'Total Reports', val: totalReports, sub: 'All time', color: 'green' },
              { icon: Users, label: 'Total Participants', val: totalParticipants.toLocaleString(), sub: 'All regions', color: 'blue' },
              { icon: CheckCircle, label: 'Approval Rate', val: `${avgApproval}%`, sub: 'Of submitted reports', color: 'purple' },
              { icon: LifeBuoy, label: 'Support Resolved', val: '84%', sub: 'Resolution rate', color: 'amber' },
            ].map(({ icon: I, label, val, sub, color }) => (
              <div key={label} className="stat-card">
                <div className={`stat-icon ${color}`}><I size={22} /></div>
                <div>
                  <div className="stat-value">{val}</div>
                  <div className="stat-label">{label}</div>
                </div>
                <div className="text-muted" style={{ fontSize: '0.72rem' }}>{sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-2" style={{ marginBottom: 24 }}>
            <div className="card">
              <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Monthly Trend</h3></div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={mockAnalytics.monthlyTrend} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                    <Legend />
                    <Line type="monotone" dataKey="reports" stroke="#2e7d32" strokeWidth={2} dot={{ fill: '#2e7d32' }} name="Reports" />
                    <Line type="monotone" dataKey="approved" stroke="#4caf50" strokeWidth={2} dot={{ fill: '#4caf50' }} name="Approved" strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Activity Type Distribution</h3></div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={mockAnalytics.byType} cx="50%" cy="50%" outerRadius={90} innerRadius={40} dataKey="count" nameKey="type">
                      {mockAnalytics.byType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'activities' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Activity Volume by Type</h3></div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockAnalytics.byType} layout="vertical" margin={{ left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="type" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {mockAnalytics.byType.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Participants by Month</h3></div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={mockAnalytics.monthlyTrend} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                  <Bar dataKey="participants" fill="#1565c0" radius={[4, 4, 0, 0]} name="Participants" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'regions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Reporting Completion Rates by Region</h3></div>
            <div className="card-body">
              {COMPLETION_RATES.map(r => (
                <div key={r.region} style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{r.region}</span>
                    <span style={{ fontSize: '0.82rem' }}>
                      <span style={{ fontWeight: 700, color: r.rate >= r.target ? 'var(--success)' : r.rate >= 70 ? 'var(--warning)' : 'var(--danger)' }}>{r.rate}%</span>
                      <span style={{ color: 'var(--text-muted)' }}> / {r.target}% target</span>
                    </span>
                  </div>
                  <div className="progress-bar" style={{ height: 10 }}>
                    <div className="progress-fill" style={{
                      width: `${r.rate}%`,
                      background: r.rate >= r.target ? 'var(--success)' : r.rate >= 70 ? 'var(--warning)' : 'var(--danger)'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'support' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Support Request Trends</h3></div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={mockAnalytics.supportTrend} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                  <Legend />
                  <Line type="monotone" dataKey="submitted" stroke="#ef4444" strokeWidth={2} name="Submitted" dot={{ fill: '#ef4444' }} />
                  <Line type="monotone" dataKey="resolved" stroke="#22c55e" strokeWidth={2} name="Resolved" dot={{ fill: '#22c55e' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'custom' && (
        <div className="card">
          <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Custom Report Builder</h3></div>
          <div className="card-body">
            <div className="grid grid-3" style={{ marginBottom: 20 }}>
              {[
                { label: 'Report Type', options: ['Activity Summary', 'Participant Report', 'Regional Overview', 'Support Analysis', 'Prayer Report'] },
                { label: 'Group By', options: ['Region', 'Activity Type', 'Month', 'Department', 'Status'] },
                { label: 'Date Range', options: ['Last 7 days', 'This Month', 'Last Month', 'This Quarter', 'This Year', 'Custom'] },
              ].map(({ label, options }) => (
                <div key={label} className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">{label}</label>
                  <select className="form-control form-select">
                    {options.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div className="alert alert-info" style={{ marginBottom: 20 }}>
              <CheckCircle size={16} />
              <span>Configure your report parameters above, then click <strong>Generate</strong> to preview and export.</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary"><RefreshCw size={16} />Generate Report</button>
              <button className="btn btn-secondary"><Download size={16} />Schedule Auto-Report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
