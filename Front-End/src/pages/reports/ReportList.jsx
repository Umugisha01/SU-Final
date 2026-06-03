import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, FileText, Eye, Edit, CheckCircle, Clock, AlertCircle, RotateCcw, Download } from 'lucide-react';
import { ACTIVITY_TYPES, REGIONS } from '../../data/mockData';
import { useAuth } from '../../contexts/AuthContext';
import { reportService } from '../../services/api';

const STATUS_CONFIG = {
  approved: { label: 'Approved', cls: 'badge-success', icon: CheckCircle },
  submitted: { label: 'Submitted', cls: 'badge-info', icon: Clock },
  draft: { label: 'Draft', cls: 'badge-gray', icon: Edit },
  returned: { label: 'Returned', cls: 'badge-danger', icon: RotateCcw },
};

export default function ReportList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterRegion, setFilterRegion] = useState('all');
  const [view, setView] = useState('table');

  useEffect(() => {
    reportService.list()
      .then(data => {
        setReports(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching reports:', err);
        setLoading(false);
      });
  }, []);

  const filtered = reports.filter(r => {
    if (search && !r.title.toLowerCase().includes(search.toLowerCase()) && !r.submittedBy.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (filterType !== 'all' && r.type !== filterType) return false;
    if (filterRegion !== 'all' && r.region !== filterRegion) return false;
    if (user?.role === 'staff') {
      const isRecipient = r.recipients && r.recipients.some(recip => recip.id === user.id);
      return r.submittedBy === user.name || isRecipient;
    }
    return true;
  });

  const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status];
    const Icon = cfg.icon;
    return <span className={`badge ${cfg.cls}`}><Icon size={11} />{cfg.label}</span>;
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Activity Reports</h1>
          <p className="page-subtitle">{filtered.length} reports found</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/reports/new')}><Plus size={16} />New Report</button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="search-wrapper" style={{ flex: 1, minWidth: 200 }}>
              <Search size={16} className="search-icon" />
              <input className="form-control" style={{ paddingLeft: 40 }} placeholder="Search reports..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="form-control form-select" style={{ width: 140 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select className="form-control form-select" style={{ width: 150 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="all">All Types</option>
              {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {(user?.role === 'admin' || user?.role === 'manager') && (
              <select className="form-control form-select" style={{ width: 180 }} value={filterRegion} onChange={e => setFilterRegion(e.target.value)}>
                <option value="all">All Regions</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            )}
            <button className="btn btn-secondary btn-sm"><Download size={14} /> Export</button>
          </div>
        </div>
      </div>

      {/* Status Summary chips */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {Object.entries(STATUS_CONFIG).map(([k, v]) => {
          const count = reports.filter(r => r.status === k).length;
          return (
            <button key={k} className={`chip ${filterStatus === k ? 'active' : ''}`}
              onClick={() => setFilterStatus(filterStatus === k ? 'all' : k)}>
              {v.label}: {count}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Report Title</th>
                <th>Type</th>
                <th>Region</th>
                <th>Date</th>
                <th>Participants</th>
                <th>Submitted By</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>Loading reports from database...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="empty-state">
                    <FileText size={40} className="empty-state-icon" />
                    <h3>No Reports Found</h3>
                    <p>Try adjusting your filters or submit a new report.</p>
                    <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/reports/new')}><Plus size={16} />New Report</button>
                  </div>
                </td></tr>
              ) : filtered.map(r => (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{r.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{r.attachments} attachments</div>
                  </td>
                  <td><span className="chip" style={{ cursor: 'default' }}>{r.type}</span></td>
                  <td style={{ fontSize: '0.82rem' }}>{r.region}</td>
                  <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{r.date}</td>
                  <td style={{ fontWeight: 600 }}>{r.participants.toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar" style={{ width: 28, height: 28, fontSize: '0.65rem' }}>
                        {r.submittedBy.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span style={{ fontSize: '0.82rem' }}>{r.submittedBy}</span>
                    </div>
                  </td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-icon btn-sm" title="View" onClick={() => navigate(`/reports/${r.id}`)}>
                        <Eye size={15} />
                      </button>
                      {['draft', 'returned'].includes(r.status) && (
                        <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => navigate(`/reports/${r.id}/edit`)}>
                          <Edit size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
