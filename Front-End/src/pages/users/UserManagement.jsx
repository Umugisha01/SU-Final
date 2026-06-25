import { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit, UserX, UserCheck, Download, Upload, Shield, Eye, X, Check } from 'lucide-react';
import { mockUsers, REGIONS, DEPARTMENTS } from '../../data/mockData';
import { userService } from '../../services/api';

const ROLE_CONFIG = {
  administrator: { cls: 'badge-danger', label: 'Administrator' },
  national_manager: { cls: 'badge-warning', label: 'National Manager' },
  regional_coordinator: { cls: 'badge-primary', label: 'Regional Coordinator' },
  field_officer: { cls: 'badge-info', label: 'Field Officer' }
};

const PERMISSION_MATRIX = [
  { feature: 'Submit Reports', administrator: true, national_manager: true, field_officer: true, regional_coordinator: true },
  { feature: 'Approve Reports', administrator: true, national_manager: true, field_officer: false, regional_coordinator: true },
  { feature: 'View All Regions', administrator: true, national_manager: false, field_officer: false, regional_coordinator: false },
  { feature: 'AI Analysis', administrator: true, national_manager: true, field_officer: false, regional_coordinator: false },
  { feature: 'Manage Users', administrator: true, national_manager: false, field_officer: false, regional_coordinator: false },
  { feature: 'Security Audit', administrator: true, national_manager: false, field_officer: false, regional_coordinator: false },
  { feature: 'Consolidate Reports', administrator: true, national_manager: true, field_officer: false, regional_coordinator: false },
  { feature: 'View Analytics', administrator: true, national_manager: true, field_officer: false, regional_coordinator: false },
  { feature: 'Support Requests', administrator: true, national_manager: true, field_officer: true, regional_coordinator: true },
  { feature: 'Prayer Requests', administrator: true, national_manager: true, field_officer: true, regional_coordinator: true },
];

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('users');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'field_officer', region: '', department: '', phone: '' });

  const [rejectingUser, setRejectingUser] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.list();
      setUsers(data || []);
      
      const pendingData = await userService.getPending();
      if (pendingData.success) {
        setPendingUsers(pendingData.data || []);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users from the server.');
      setUsers(mockUsers);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = users.filter(u => u.status !== 'pending').filter(u => {
    if (search) {
      const s = search.toLowerCase();
      const roleLabel = ROLE_CONFIG[u.role]?.label || '';
      const matchName = (u.name || '').toLowerCase().includes(s);
      const matchEmail = (u.email || '').toLowerCase().includes(s);
      const matchRole = (u.role || '').toLowerCase().includes(s) || roleLabel.toLowerCase().includes(s);
      const matchRegion = (u.region || '').toLowerCase().includes(s);
      const matchDept = (u.department || '').toLowerCase().includes(s);
      const matchPhone = (u.phone || '').toLowerCase().includes(s);
      if (!matchName && !matchEmail && !matchRole && !matchRegion && !matchDept && !matchPhone) return false;
    }
    if (filterRole !== 'all' && u.role !== filterRole) return false;
    if (filterStatus !== 'all' && u.status !== filterStatus) return false;
    return true;
  });

  const toggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await userService.toggleStatus(id, nextStatus);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status: nextStatus } : u));
    } catch (err) {
      console.error('Failed to toggle status:', err);
      alert(err.response?.data?.error || 'Failed to update user status.');
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this user?')) return;
    try {
      await userService.approve(id);
      await fetchUsers();
      alert('User approved successfully!');
    } catch (err) {
      console.error('Error approving user:', err);
      alert(err.response?.data?.error || 'Failed to approve user.');
    }
  };

  const handleRejectPrompt = (user) => {
    setRejectingUser(user);
    setRejectReason('');
  };

  const handleReject = async () => {
    if (!rejectingUser) return;
    try {
      await userService.reject(rejectingUser.id, rejectReason);
      setRejectingUser(null);
      setRejectReason('');
      await fetchUsers();
      alert('User rejected successfully.');
    } catch (err) {
      console.error('Error rejecting user:', err);
      alert(err.response?.data?.error || 'Failed to reject user.');
    }
  };

  const addUser = () => {
    if (!newUser.name || !newUser.email) return;
    setUsers(prev => [...prev, { ...newUser, id: Date.now(), status: 'active', avatar: newUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(), lastLogin: 'Never', joinDate: new Date().toISOString().split('T')[0] }]);
    setShowAddModal(false);
    setNewUser({ name: '', email: '', role: 'field_officer', region: '', department: '', phone: '' });
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Users size={24} style={{ verticalAlign: 'middle', marginRight: 10 }} />User Management</h1>
          <p className="page-subtitle">{filtered.length} users · {users.filter(u => u.status === 'active').length} active</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm"><Upload size={14} />Import CSV</button>
          <button className="btn btn-secondary btn-sm"><Download size={14} />Export</button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}><Plus size={16} />Add User</button>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 20 }}>
        {[
          { id: 'users', label: 'Users' },
          { id: 'pending', label: `Pending Approvals (${pendingUsers.length})` },
          { id: 'permissions', label: 'Permissions' },
          { id: 'sessions', label: 'Sessions' }
        ].map(t => (
          <button key={t.id} className={`tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'users' && (
        <>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-body" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div className="search-wrapper" style={{ flex: 1, minWidth: 200 }}>
                  <Search size={16} className="search-icon" />
                  <input className="form-control" style={{ paddingLeft: 40 }} placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="form-control form-select" style={{ width: 140 }} value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                  <option value="all">All Roles</option>
                  {Object.entries(ROLE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <select className="form-control form-select" style={{ width: 130 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>User</th><th>Role</th><th>Region</th><th>Department</th><th>Last Login</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar" style={{ background: u.status === 'inactive' ? 'var(--border)' : 'var(--primary)', width: 36, height: 36, fontSize: '0.78rem' }}>{u.avatar}</div>
                          <div>
                            <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{u.name}</p>
                            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td><span className={`badge ${ROLE_CONFIG[u.role].cls}`}>{ROLE_CONFIG[u.role].label}</span></td>
                      <td style={{ fontSize: '0.82rem' }}>{u.region}</td>
                      <td style={{ fontSize: '0.82rem' }}>{u.department}</td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.lastLogin}</td>
                      <td>
                        <span className={`badge ${u.status === 'active' ? 'badge-success' : 'badge-gray'}`}>
                          {u.status === 'active' ? '● Active' : '○ Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditUser(u)} title="Edit"><Edit size={14} /></button>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => toggleStatus(u.id, u.status)} title={u.status === 'active' ? 'Deactivate' : 'Activate'}>
                            {u.status === 'active' ? <UserX size={14} color="var(--danger)" /> : <UserCheck size={14} color="var(--success)" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'pending' && (
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1rem' }}><Users size={16} style={{ marginRight: 8 }} />Pending Approvals</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Self-registered user accounts awaiting administrator activation</p>
          </div>
          {pendingUsers.length === 0 ? (
            <div className="card-body" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              No pending registrations found.
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Region</th>
                    <th>Department & Position</th>
                    <th>Location</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar" style={{ background: 'var(--warning)', width: 36, height: 36, fontSize: '0.78rem' }}>
                            {u.avatar || u.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'}
                          </div>
                          <div>
                            <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{u.name}</p>
                            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.email}</p>
                            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.phone || 'No phone'}</p>
                          </div>
                        </div>
                      </td>
                      <td><span className={`badge ${ROLE_CONFIG[u.role]?.cls || 'badge-gray'}`}>{ROLE_CONFIG[u.role]?.label || u.role}</span></td>
                      <td style={{ fontSize: '0.82rem' }}>{u.region}</td>
                      <td style={{ fontSize: '0.82rem' }}>
                        <div>{u.department}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.position}</div>
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>{u.location || 'N/A'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button 
                            className="btn btn-ghost btn-icon btn-sm" 
                            style={{ color: 'var(--success)' }} 
                            onClick={() => handleApprove(u.id)} 
                            title="Approve User"
                          >
                            <UserCheck size={16} />
                          </button>
                          <button 
                            className="btn btn-ghost btn-icon btn-sm" 
                            style={{ color: 'var(--danger)' }} 
                            onClick={() => handleRejectPrompt(u)} 
                            title="Reject User"
                          >
                            <UserX size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'permissions' && (
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1rem' }}><Shield size={16} style={{ marginRight: 8 }} />Permission Matrix</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Role-based access control configuration</p>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Feature / Permission</th>
                  <th style={{ textAlign: 'center' }}>Administrator</th>
                  <th style={{ textAlign: 'center' }}>National Manager</th>
                  <th style={{ textAlign: 'center' }}>Field Officer</th>
                  <th style={{ textAlign: 'center' }}>Regional Coordinator</th>
                </tr>
              </thead>
              <tbody>
                {PERMISSION_MATRIX.map(p => (
                  <tr key={p.feature}>
                    <td style={{ fontWeight: 500, fontSize: '0.875rem' }}>{p.feature}</td>
                    {['administrator', 'national_manager', 'field_officer', 'regional_coordinator'].map(role => (
                      <td key={role} style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '1.2rem' }}>{p[role] ? '✅' : '❌'}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="card">
          <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Active Sessions</h3></div>
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>User</th><th>Role</th><th>Login Time</th><th>IP Address</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {users.filter(u => u.status === 'active').map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar" style={{ width: 28, height: 28, fontSize: '0.65rem' }}>{u.avatar}</div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{u.name}</span>
                      </div>
                    </td>
                    <td><span className={`badge ${ROLE_CONFIG[u.role].cls}`}>{ROLE_CONFIG[u.role].label}</span></td>
                    <td style={{ fontSize: '0.82rem' }}>{u.lastLogin}</td>
                    <td style={{ fontSize: '0.78rem', fontFamily: 'monospace' }}>196.12.1.{u.id}</td>
                    <td><span className="badge badge-success">● Active</span></td>
                    <td><button className="btn btn-danger btn-sm" style={{ fontSize: '0.72rem' }}>Terminate</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New User</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name <span>*</span></label>
                  <input className="form-control" value={newUser.name} onChange={e => setNewUser(u => ({ ...u, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email <span>*</span></label>
                  <input className="form-control" type="email" value={newUser.email} onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-control" value={newUser.phone} onChange={e => setNewUser(u => ({ ...u, phone: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-control form-select" value={newUser.role} onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))}>
                    {Object.entries(ROLE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Region</label>
                  <select className="form-control form-select" value={newUser.region} onChange={e => setNewUser(u => ({ ...u, region: e.target.value }))}>
                    <option value="">Select...</option>
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-control form-select" value={newUser.department} onChange={e => setNewUser(u => ({ ...u, department: e.target.value }))}>
                    <option value="">Select...</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={addUser} disabled={!newUser.name || !newUser.email}><Plus size={14} />Add User</button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectingUser && (
        <div className="modal-overlay" onClick={() => setRejectingUser(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reject User Registration</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setRejectingUser(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 15 }}>
                Please provide a reason for rejecting the registration request from <strong>{rejectingUser.name}</strong> ({rejectingUser.email}).
              </p>
              <div className="form-group">
                <label className="form-label">Rejection Reason</label>
                <textarea 
                  className="form-control" 
                  style={{ minHeight: 100, width: '100%', padding: '10px' }} 
                  placeholder="e.g. Invalid department, unrecognized phone number, etc."
                  value={rejectReason} 
                  onChange={e => setRejectReason(e.target.value)} 
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setRejectingUser(null)}>Cancel</button>
              <button 
                className="btn btn-danger" 
                onClick={handleReject} 
                disabled={!rejectReason.trim()}
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
