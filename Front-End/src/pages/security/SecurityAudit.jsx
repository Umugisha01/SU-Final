import { useState } from 'react';
import { Shield, AlertCircle, CheckCircle, Download, Filter, Clock, Lock, Eye, Search } from 'lucide-react';
import { mockAuditLogs } from '../../data/mockData';

const SEVERITY_CONFIG = {
  info: { cls: 'badge-info', label: 'Info', color: '#1e40af' },
  warning: { cls: 'badge-warning', label: 'Warning', color: '#92400e' },
  danger: { cls: 'badge-danger', label: 'Critical', color: '#991b1b' },
};

const ENCRYPTION_STATUS = [
  { label: 'Database Encryption', status: 'active', detail: 'AES-256 at rest' },
  { label: 'Transport Security', status: 'active', detail: 'TLS 1.3' },
  { label: 'Backup Encryption', status: 'active', detail: 'Encrypted daily backups' },
  { label: 'File Storage', status: 'active', detail: 'Server-side encryption' },
];

const MFA_STATUS = [
  { name: 'Emmanuel Habimana', email: 'admin@su.rw', role: 'Admin', mfaEnabled: true },
  { name: 'Grace Uwimana', email: 'manager@su.rw', role: 'Manager', mfaEnabled: true },
  { name: 'Patrick Nkurunziza', email: 'staff@su.rw', role: 'Staff', mfaEnabled: false },
  { name: 'Alice Mukamana', email: 'coordinator@su.rw', role: 'Coordinator', mfaEnabled: false },
];

export default function SecurityAudit() {
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [logs] = useState(mockAuditLogs);

  const filteredLogs = logs.filter(l => {
    if (search && !l.user.toLowerCase().includes(search.toLowerCase()) && !l.action.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterSeverity !== 'all' && l.severity !== filterSeverity) return false;
    return true;
  });

  const anomalies = logs.filter(l => l.severity === 'danger' || (l.severity === 'warning' && l.action.includes('Failed')));

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Shield size={24} style={{ verticalAlign: 'middle', marginRight: 10 }} />Security & Audit</h1>
          <p className="page-subtitle">System security status, audit logs, and compliance</p>
        </div>
        <button className="btn btn-secondary btn-sm"><Download size={14} />Export Audit Trail</button>
      </div>

      {/* Anomaly Alerts */}
      {anomalies.length > 0 && (
        <div className="alert alert-danger" style={{ marginBottom: 20, borderRadius: 'var(--radius-lg)' }}>
          <AlertCircle size={20} />
          <div>
            <strong>Security Alert:</strong> {anomalies.length} suspicious event(s) detected. {anomalies.map(a => a.action).join(', ')}. Review immediately.
          </div>
        </div>
      )}

      <div className="tabs" style={{ marginBottom: 20 }}>
        {['overview', 'audit-log', 'encryption', 'mfa', 'retention'].map(t => (
          <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {t === 'audit-log' ? 'Audit Log' : t === 'mfa' ? 'MFA' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-4" style={{ marginBottom: 20 }}>
            {[
              { label: 'Security Status', val: 'Protected', color: 'green', icon: Shield },
              { label: 'Audit Events (24h)', val: logs.filter(l => l.severity !== 'danger').length, color: 'blue', icon: Eye },
              { label: 'Security Alerts', val: anomalies.length, color: anomalies.length > 0 ? 'red' : 'green', icon: AlertCircle },
              { label: 'MFA Enabled', val: `${MFA_STATUS.filter(m => m.mfaEnabled).length}/${MFA_STATUS.length}`, color: 'purple', icon: Lock },
            ].map(({ label, val, color, icon: I }) => (
              <div key={label} className="stat-card">
                <div className={`stat-icon ${color}`}><I size={22} /></div>
                <div><div className="stat-value" style={{ fontSize: '1.5rem' }}>{val}</div><div className="stat-label">{label}</div></div>
              </div>
            ))}
          </div>

          <div className="grid grid-2">
            <div className="card">
              <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Recent Security Events</h3></div>
              <div style={{ padding: '0 0 16px' }}>
                {logs.slice(0, 5).map(l => {
                  const cfg = SEVERITY_CONFIG[l.severity];
                  return (
                    <div key={l.id} style={{ display: 'flex', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border-light)' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, marginTop: 6, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <p style={{ fontSize: '0.82rem', fontWeight: 600 }}>{l.action}</p>
                          <span className={`badge ${cfg.cls}`} style={{ fontSize: '0.65rem' }}>{cfg.label}</span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{l.user} · {l.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Login Activity (Last 7 Days)</h3></div>
              <div className="card-body">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                  const logins = [12, 18, 15, 20, 14, 5, 3][i];
                  return (
                    <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <span style={{ width: 28, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{day}</span>
                      <div className="progress-bar" style={{ flex: 1 }}>
                        <div className="progress-fill" style={{ width: `${(logins / 20) * 100}%` }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, width: 20 }}>{logins}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'audit-log' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <div className="search-wrapper" style={{ flex: 1, minWidth: 200 }}>
              <Search size={16} className="search-icon" />
              <input className="form-control" style={{ paddingLeft: 40 }} placeholder="Search audit logs..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="form-control form-select" style={{ width: 140 }} value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}>
              <option value="all">All Severity</option>
              {Object.entries(SEVERITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          <div className="card">
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Resource</th><th>IP Address</th><th>Severity</th></tr></thead>
                <tbody>
                  {filteredLogs.map(l => {
                    const cfg = SEVERITY_CONFIG[l.severity];
                    return (
                      <tr key={l.id}>
                        <td style={{ fontSize: '0.78rem', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{l.time}</td>
                        <td style={{ fontSize: '0.85rem', fontWeight: 500 }}>{l.user}</td>
                        <td style={{ fontSize: '0.82rem' }}>{l.action}</td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: 200 }} className="truncate">{l.resource}</td>
                        <td style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{l.ip}</td>
                        <td><span className={`badge ${cfg.cls}`}>{cfg.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'encryption' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="alert alert-success" style={{ borderRadius: 'var(--radius-lg)' }}>
            <Shield size={18} />
            <div><strong>All systems protected.</strong> Data encryption is active across all storage and transmission layers.</div>
          </div>
          <div className="card">
            <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Encryption Status</h3></div>
            <div className="card-body">
              {ENCRYPTION_STATUS.map(s => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 'var(--radius)', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Lock size={16} color="#166534" />
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.label}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.detail}</p>
                    </div>
                  </div>
                  <span className="badge badge-success"><CheckCircle size={11} />Active</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'mfa' && (
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1rem' }}>Multi-Factor Authentication Status</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{MFA_STATUS.filter(m => m.mfaEnabled).length} of {MFA_STATUS.length} users have MFA enabled</p>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>User</th><th>Role</th><th>MFA Status</th><th>Actions</th></tr></thead>
              <tbody>
                {MFA_STATUS.map(u => (
                  <tr key={u.email}>
                    <td>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{u.name}</p>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.email}</p>
                      </div>
                    </td>
                    <td><span className="badge badge-info">{u.role}</span></td>
                    <td>
                      <span className={`badge ${u.mfaEnabled ? 'badge-success' : 'badge-danger'}`}>
                        {u.mfaEnabled ? '✓ Enabled' : '✗ Not Set Up'}
                      </span>
                    </td>
                    <td>
                      {!u.mfaEnabled && <button className="btn btn-sm btn-secondary">Enforce MFA</button>}
                      {u.mfaEnabled && <button className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }}>Reset</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'retention' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Data Retention Policy</h3></div>
            <div className="card-body">
              {[
                { type: 'Activity Reports', retention: '7 years', action: 'Archive then delete', status: 'Compliant' },
                { type: 'Support Requests', retention: '3 years', action: 'Archive then delete', status: 'Compliant' },
                { type: 'Audit Logs', retention: '5 years', action: 'Immutable archive', status: 'Compliant' },
                { type: 'User Data', retention: 'Until deletion', action: 'Manual deletion on request', status: 'Compliant' },
                { type: 'Documents & Files', retention: '10 years', action: 'Compressed archive', status: 'Compliant' },
              ].map(r => (
                <div key={r.type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{r.type}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Retention: {r.retention} · {r.action}</p>
                  </div>
                  <span className="badge badge-success"><CheckCircle size={11} />{r.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
