import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FileText, Users, Clock, CheckCircle, Plus, Eye, LifeBuoy, TrendingUp, Bell, AlertCircle, MapPin, Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { mockAnalytics } from '../data/mockData';
import { reportService, supportService, userService } from '../services/api';

const RECENT_ACTIVITY = [
  { id: 1, action: 'Report Approved', detail: 'Kigali Youth Outreach Program', time: '2 min ago', icon: CheckCircle, color: 'green' },
  { id: 2, action: 'New Support Request', detail: 'Transport Allowance — Eastern Province', time: '1 hour ago', icon: LifeBuoy, color: 'blue' },
  { id: 3, action: 'Report Submitted', detail: 'Monthly Staff Meeting — May', time: '3 hours ago', icon: FileText, color: 'purple' },
  { id: 4, action: 'Prayer Request Added', detail: 'Safety During Outreach Missions', time: '5 hours ago', icon: Heart, color: 'red' },
  { id: 5, action: 'User Registered', detail: 'Solange Uwera joined as Staff', time: '1 day ago', icon: Users, color: 'amber' },
];

const DEADLINES = [
  { title: 'May Monthly Report', region: 'All Regions', due: '2025-05-09', daysLeft: 3, priority: 'urgent' },
  { title: 'Q2 Outreach Summary', region: 'Eastern Province', due: '2025-05-15', daysLeft: 9, priority: 'high' },
  { title: 'Youth Ministry Review', region: 'Western Province', due: '2025-05-20', daysLeft: 14, priority: 'medium' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [reports, setReports] = useState([]);
  const [supportRequests, setSupportRequests] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const role = user?.role;

  useEffect(() => {
    const loadData = async () => {
      try {
        const reps = await reportService.list();
        setReports(reps);
        
        const sups = await supportService.list();
        setSupportRequests(sups);

        if (role === 'admin' || role === 'manager') {
          const usrs = await userService.list();
          setUsersList(usrs);
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [role]);

  const totalReports = reports.length;
  const approved = reports.filter(r => r.status === 'approved').length;
  const pending = reports.filter(r => r.status === 'submitted').length;
  const draft = reports.filter(r => r.status === 'draft').length;
  const totalParticipants = reports.reduce((a, r) => a + (r.participants || r.totalParticipants || 0), 0);
  const activeUsers = usersList.filter(u => u.status === 'active' || u.is_active || u.is_active === undefined).length;
  const pendingRequests = supportRequests.filter(s => s.status === 'submitted' || s.status === 'under review').length;

  const myReports = reports.filter(r => r.submittedBy === user?.name);

  const SYSTEM_ANNOUNCEMENT = {
    title: 'Scheduled Maintenance',
    message: 'System maintenance on May 10, 2025 from 2:00 AM to 4:00 AM. Please save all work beforehand.',
    type: 'warning'
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading dashboard metrics...</div>;
  }

  return (
    <div className="fade-in">
      {/* System Announcement */}
      <div className="alert alert-warning" style={{ marginBottom: 20, borderRadius: 'var(--radius-lg)' }}>
        <Bell size={16} />
        <div>
          <strong>{SYSTEM_ANNOUNCEMENT.title}:</strong> {SYSTEM_ANNOUNCEMENT.message}
        </div>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">
            {role === 'admin' ? '⚙️ Admin Dashboard' : role === 'manager' ? '📊 Manager Dashboard' : role === 'coordinator' ? '🌍 Coordinator Dashboard' : '👤 My Dashboard'}
          </h1>
          <p className="page-subtitle">Welcome back, {user?.name} · {new Date().toLocaleDateString('en-RW', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => navigate('/reports')}><Eye size={16} /> View Reports</button>
          <button className="btn btn-primary" onClick={() => navigate('/reports/new')}><Plus size={16} /> Submit Report</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon green"><FileText size={22} /></div>
          <div>
            <div className="stat-value">{role === 'admin' || role === 'manager' ? totalReports : myReports.length}</div>
            <div className="stat-label">Reports Submitted</div>
          </div>
          <div className="stat-change up"><TrendingUp size={12} /> +12% this month</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber"><Clock size={22} /></div>
          <div>
            <div className="stat-value">{role === 'admin' || role === 'manager' ? pending : myReports.filter(r => r.status === 'submitted').length}</div>
            <div className="stat-label">Pending Review</div>
          </div>
          <div className="stat-change" style={{ color: 'var(--warning)' }}><AlertCircle size={12} /> Needs attention</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><Users size={22} /></div>
          <div>
            <div className="stat-value">{role === 'admin' ? activeUsers : totalParticipants.toLocaleString()}</div>
            <div className="stat-label">{role === 'admin' ? 'Active Users' : 'Total Participants'}</div>
          </div>
          <div className="stat-change up"><TrendingUp size={12} /> Growing</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><CheckCircle size={22} /></div>
          <div>
            <div className="stat-value">{role === 'admin' || role === 'manager' ? approved : myReports.filter(r => r.status === 'approved').length}</div>
            <div className="stat-label">Approved Reports</div>
          </div>
          <div className="stat-change up"><TrendingUp size={12} /> {Math.round((approved/totalReports)*100)}% approval rate</div>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 24 }}>
        {/* Charts */}
        <div className="card" style={{ gridColumn: '1 / 3' }}>
          <div className="card-header">
            <h3 style={{ fontSize: '1rem' }}>Report Submission Trends</h3>
            <div className="tabs" style={{ width: 'auto' }}>
              {['overview', 'monthly'].map(t => (
                <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`}
                  style={{ flex: 'none', padding: '5px 14px' }}
                  onClick={() => setActiveTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
              ))}
            </div>
          </div>
          <div className="card-body" style={{ paddingTop: 16 }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={mockAnalytics.monthlyTrend} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="reports" fill="#2e7d32" radius={[4, 4, 0, 0]} name="Submitted" />
                <Bar dataKey="approved" fill="#4caf50" radius={[4, 4, 0, 0]} name="Approved" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="card">
          <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Upcoming Deadlines</h3></div>
          <div className="card-body" style={{ paddingTop: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {DEADLINES.map((d, i) => (
                <div key={i} style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius)', borderLeft: `3px solid ${d.daysLeft <= 3 ? 'var(--danger)' : d.daysLeft <= 7 ? 'var(--warning)' : 'var(--primary)'}` }}>
                  <p style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 2 }}>{d.title}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.region}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{d.due}</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: d.daysLeft <= 3 ? 'var(--danger)' : d.daysLeft <= 7 ? 'var(--warning)' : 'var(--primary)' }}>
                      {d.daysLeft} days left
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        {/* Recent Activity */}
        <div className="card">
          <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Recent Activity</h3></div>
          <div className="card-body" style={{ paddingTop: 16 }}>
            <div className="timeline">
              {RECENT_ACTIVITY.map((a) => {
                const Icon = a.icon;
                const bgMap = { green: '#dcfce7', blue: '#dbeafe', purple: '#ede9fe', red: '#fee2e2', amber: '#fef3c7' };
                const clMap = { green: '#166534', blue: '#1e40af', purple: '#5b21b6', red: '#991b1b', amber: '#92400e' };
                return (
                  <div key={a.id} className="timeline-item">
                    <div className="timeline-dot" style={{ background: bgMap[a.color] }}>
                      <Icon size={14} color={clMap[a.color]} />
                    </div>
                    <div className="timeline-content">
                      <p style={{ fontSize: '0.82rem', fontWeight: 600 }}>{a.action}</p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{a.detail}</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginTop: 2 }}>{a.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Quick Actions</h3></div>
          <div className="card-body" style={{ paddingTop: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Submit Report', icon: FileText, color: 'var(--primary)', to: '/reports/new' },
                { label: 'View All Reports', icon: Eye, color: '#1565c0', to: '/reports' },
                { label: 'Request Support', icon: LifeBuoy, color: '#6a1b9a', to: '/support/new' },
                { label: 'Prayer Requests', icon: Heart, color: '#c62828', to: '/prayer' },
                { label: 'View Analytics', icon: TrendingUp, color: '#00838f', to: '/analytics' },
                { label: 'My Region', icon: MapPin, color: '#f9a825', to: '/regions' },
              ].map(a => (
                <button key={a.label} onClick={() => navigate(a.to)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 'var(--radius)', background: 'var(--bg-input)', border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all var(--transition)', textAlign: 'left' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-input)'; }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: a.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <a.icon size={18} color={a.color} />
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{a.label}</span>
                </button>
              ))}
            </div>

            {/* Role-specific panel */}
            {(role === 'admin' || role === 'manager') && (
              <div style={{ marginTop: 16, padding: '14px', background: 'var(--primary-50)', borderRadius: 'var(--radius)', border: '1px solid var(--primary-100)' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: 8 }}>
                  {role === 'admin' ? '⚙️ Admin Actions' : '📋 Manager Actions'}
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {role === 'admin' && <>
                    <button className="btn btn-sm btn-secondary" onClick={() => navigate('/users')}>Manage Users</button>
                    <button className="btn btn-sm btn-secondary" onClick={() => navigate('/security')}>Audit Logs</button>
                  </>}
                  {(role === 'admin' || role === 'manager') && <>
                    <button className="btn btn-sm btn-secondary" onClick={() => navigate('/consolidation')}>Consolidate Reports</button>
                    <button className="btn btn-sm btn-secondary" onClick={() => navigate('/ai-analysis')}>AI Analysis</button>
                  </>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
