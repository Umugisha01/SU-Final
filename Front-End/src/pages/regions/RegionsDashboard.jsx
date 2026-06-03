import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MapPin, Users, FileText, TrendingUp, Download, ChevronRight, Heart } from 'lucide-react';
import { mockReports, mockUsers, mockAnalytics } from '../../data/mockData';

const REGIONS_DATA = [
  { id: 'kigali', name: 'Kigali City', coordinator: 'Emmanuel Habimana', staff: 3, reports: 38, participants: 1240, prayerRequests: 8, color: '#2e7d32', completion: 87 },
  { id: 'northern', name: 'Northern Province', coordinator: 'Grace Uwimana', staff: 4, reports: 24, participants: 780, prayerRequests: 5, color: '#1565c0', completion: 72 },
  { id: 'southern', name: 'Southern Province', coordinator: 'Jean Habimana', staff: 3, reports: 22, participants: 910, prayerRequests: 6, color: '#f9a825', completion: 65 },
  { id: 'eastern', name: 'Eastern Province', coordinator: 'Alice Mukamana', staff: 2, reports: 19, participants: 620, prayerRequests: 4, color: '#6a1b9a', completion: 58 },
  { id: 'western', name: 'Western Province', coordinator: 'Marie Nyiramana', staff: 2, reports: 16, participants: 510, prayerRequests: 3, color: '#c62828', completion: 52 },
];

export default function RegionsDashboard() {
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const region = REGIONS_DATA.find(r => r.id === selected);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title"><MapPin size={24} style={{ verticalAlign: 'middle', marginRight: 10 }} />Regional Management</h1>
          <p className="page-subtitle">Monitor and manage all regional operations</p>
        </div>
        <button className="btn btn-secondary"><Download size={16} />Export Regional Reports</button>
      </div>

      <div className="tabs" style={{ marginBottom: 20 }}>
        {['overview', 'comparison', selected ? 'region-detail' : null].filter(Boolean).map(t => (
          <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {t === 'region-detail' ? region?.name : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Summary row */}
          <div className="grid grid-4" style={{ marginBottom: 20 }}>
            {[
              { label: 'Total Regions', val: REGIONS_DATA.length },
              { label: 'Total Staff', val: REGIONS_DATA.reduce((a, r) => a + r.staff, 0) },
              { label: 'All Reports', val: REGIONS_DATA.reduce((a, r) => a + r.reports, 0) },
              { label: 'Total Reached', val: REGIONS_DATA.reduce((a, r) => a + r.participants, 0).toLocaleString() },
            ].map(({ label, val }) => (
              <div key={label} className="stat-card">
                <div className="stat-icon green"><MapPin size={20} /></div>
                <div><div className="stat-value">{val}</div><div className="stat-label">{label}</div></div>
              </div>
            ))}
          </div>

          <div className="grid grid-3">
            {REGIONS_DATA.map(r => (
              <div key={r.id} className="card" style={{ cursor: 'pointer', borderLeft: `4px solid ${r.color}` }}
                onClick={() => { setSelected(r.id); setActiveTab('region-detail'); }}>
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: '1rem', marginBottom: 4 }}>{r.name}</h3>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Coordinator: {r.coordinator}</p>
                    </div>
                    <ChevronRight size={16} color="var(--text-muted)" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    {[
                      { icon: Users, label: 'Staff', val: r.staff },
                      { icon: FileText, label: 'Reports', val: r.reports },
                      { icon: TrendingUp, label: 'Reached', val: r.participants.toLocaleString() },
                      { icon: Heart, label: 'Prayers', val: r.prayerRequests },
                    ].map(({ icon: I, label, val }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <I size={14} color={r.color} />
                        <div>
                          <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</p>
                          <p style={{ fontSize: '0.9rem', fontWeight: 700 }}>{val}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4 }}>
                      <span>Reporting Completion</span>
                      <span style={{ fontWeight: 700, color: r.color }}>{r.completion}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${r.completion}%`, background: r.color }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'comparison' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Reports by Region</h3></div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={REGIONS_DATA.map(r => ({ name: r.name.split(' ')[0], reports: r.reports, participants: r.participants / 10, staff: r.staff * 10 }))} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                  <Bar dataKey="reports" fill="#2e7d32" radius={[4, 4, 0, 0]} name="Reports" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Performance Comparison</h3></div>
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Region</th><th>Coordinator</th><th>Staff</th><th>Reports</th><th>Participants</th><th>Completion</th></tr></thead>
                <tbody>
                  {REGIONS_DATA.sort((a, b) => b.reports - a.reports).map((r, i) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 700 }}><span style={{ color: r.color, marginRight: 6 }}>#{i + 1}</span>{r.name}</td>
                      <td style={{ fontSize: '0.82rem' }}>{r.coordinator}</td>
                      <td>{r.staff}</td>
                      <td style={{ fontWeight: 700 }}>{r.reports}</td>
                      <td>{r.participants.toLocaleString()}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="progress-bar" style={{ width: 80 }}><div className="progress-fill" style={{ width: `${r.completion}%`, background: r.color }} /></div>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: r.color }}>{r.completion}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'region-detail' && region && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: `2px solid ${region.color}` }}>
            <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-lg)', background: region.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={28} color="#fff" />
            </div>
            <div>
              <h2 style={{ marginBottom: 4 }}>{region.name}</h2>
              <p style={{ color: 'var(--text-muted)' }}>Regional Coordinator: <strong>{region.coordinator}</strong></p>
            </div>
          </div>

          <div className="grid grid-4">
            {[
              { label: 'Staff Members', val: region.staff, color: 'blue' },
              { label: 'Activity Reports', val: region.reports, color: 'green' },
              { label: 'Total Participants', val: region.participants.toLocaleString(), color: 'purple' },
              { label: 'Prayer Requests', val: region.prayerRequests, color: 'red' },
            ].map(({ label, val, color }) => (
              <div key={label} className="stat-card">
                <div className={`stat-icon ${color}`}><FileText size={20} /></div>
                <div><div className="stat-value">{val}</div><div className="stat-label">{label}</div></div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Recent Activities</h3></div>
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Report</th><th>Type</th><th>Date</th><th>Participants</th><th>Status</th></tr></thead>
                <tbody>
                  {mockReports.filter(r => r.region.includes(region.name.split(' ')[0])).map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>{r.title}</td>
                      <td><span className="chip" style={{ cursor: 'default', fontSize: '0.72rem' }}>{r.type}</span></td>
                      <td style={{ fontSize: '0.82rem' }}>{r.date}</td>
                      <td style={{ fontWeight: 700 }}>{r.participants}</td>
                      <td><span className={`badge ${r.status === 'approved' ? 'badge-success' : r.status === 'submitted' ? 'badge-info' : r.status === 'returned' ? 'badge-danger' : 'badge-gray'}`}>{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
