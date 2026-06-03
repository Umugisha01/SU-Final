import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Send, Upload, X, Plus, FileText, MapPin, Calendar, Clock, Users, CheckCircle } from 'lucide-react';
import { ACTIVITY_TYPES, REGIONS, DEPARTMENTS } from '../../data/mockData';
import { useNotifications } from '../../contexts/NotificationContext';
import { reportService, userService } from '../../services/api';

const INITIAL = {
  title: '', type: '', region: '', location: '', date: '', duration: '',
  description: '', outcomes: '', challenges: '', prayerRequests: '',
  totalParticipants: '', male: '', female: '', youth: '', adults: '',
  department: '', position: '', status: 'draft', recipientIds: [],
};

export default function ReportForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addNotification } = useNotifications();
  const [form, setForm] = useState(INITIAL);
  const [userSearch, setUserSearch] = useState('');
  const [usersList, setUsersList] = useState([]);
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const STEPS = ['Activity Details', 'Content & Outcomes', 'Attendance', 'Support & Files'];

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleRecipient = (id) => {
    setForm(f => ({
      ...f,
      recipientIds: f.recipientIds.includes(id) ? f.recipientIds.filter(x => x !== id) : [...f.recipientIds, id]
    }));
  };

  const selectRole = (role) => {
    const roleUserIds = usersList.filter(u => u.role === role).map(u => u.id);
    const newIds = [...new Set([...form.recipientIds, ...roleUserIds])];
    set('recipientIds', newIds);
  };

  useEffect(() => {
    userService.getDirectory().then(data => setUsersList(data || [])).catch(console.error);
    if (id) {
      setLoading(true);
      reportService.get(id)
        .then(report => {
          setForm({
            title: report.title || '',
            type: report.type || '',
            region: report.region || '',
            location: report.location || '',
            date: report.date || '',
            duration: report.duration || '',
            description: report.description || '',
            outcomes: report.outcomes || '',
            challenges: report.challenges || '',
            prayerRequests: report.prayerRequests || '',
            totalParticipants: report.totalParticipants || '',
            male: report.male || '',
            female: report.female || '',
            youth: report.youth || '',
            adults: report.adults || '',
            department: report.department || '',
            position: report.position || '',
            status: report.status || 'draft',
            recipientIds: report.recipients ? report.recipients.map(r => r.id) : [],
          });
          setLoading(false);
        })
        .catch(err => {
          console.error('Error loading report:', err);
          addNotification({ type: 'error', title: 'Load Error', message: 'Failed to load report details.', icon: 'x' });
          setLoading(false);
        });
    }
  }, [id, addNotification]);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title required';
    if (!form.type) e.type = 'Activity type required';
    if (!form.department) e.department = 'Department required';
    if (!form.region) e.region = 'Region required';
    if (!form.date) e.date = 'Date required';
    if (!form.description.trim()) e.description = 'Description required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (asDraft = false) => {
    if (!asDraft && !validate()) {
      addNotification({ type: 'warning', title: 'Missing Information', message: 'Please fill in all required fields before submitting.', icon: 'alert-triangle' });
      if (!form.title.trim() || !form.type || !form.department || !form.region || !form.date) {
        setStep(1);
      } else if (!form.description.trim()) {
        setStep(2);
      }
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        status: asDraft ? 'draft' : 'submitted'
      };
      
      if (id) {
        await reportService.update(id, payload);
      } else {
        await reportService.create(payload);
      }
      
      addNotification({ 
        type: 'report', 
        title: asDraft ? 'Draft Saved' : 'Report Submitted', 
        message: `"${form.title || 'New Report'}" has been ${asDraft ? 'saved as draft' : 'submitted for review'}.`, 
        icon: 'check' 
      });
      setSubmitting(false);
      navigate('/reports');
    } catch (err) {
      console.error('Error saving report:', err);
      let errorMsg = 'Failed to save report.';
      if (err.response?.data?.error) {
        const errData = err.response.data.error;
        if (typeof errData === 'object') {
          errorMsg = Object.entries(errData)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(' ') : msgs}`)
            .join(' | ');
        } else {
          errorMsg = errData;
        }
      }
      addNotification({ type: 'error', title: 'Save Error', message: errorMsg, icon: 'x' });
      setSubmitting(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files).map(f => ({ name: f.name, size: f.size, type: f.type }));
    setFiles(prev => [...prev, ...dropped]);
  };

  const fieldCls = (k) => `form-control${errors[k] ? ' error' : ''}`;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Submit Activity Report</h1>
          <p className="page-subtitle">Document your ministry activity</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/reports')}><X size={16} />Cancel</button>
      </div>

      {/* Step indicator */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: '16px 24px' }}>
          <div className="stepper">
            {STEPS.map((s, i) => (
              <div key={i} className={`step ${step > i + 1 ? 'done' : ''} ${step === i + 1 ? 'active' : ''}`}
                style={{ cursor: 'pointer' }} onClick={() => setStep(i + 1)}>
                <div className="step-circle">{step > i + 1 ? <CheckCircle size={14} /> : i + 1}</div>
                <span className="step-label">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {step === 1 && (
            <div className="card">
              <div className="card-header"><h3 style={{ fontSize: '1rem' }}><FileText size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />Activity Details</h3></div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">Report Title <span>*</span></label>
                  <input className={fieldCls('title')} placeholder="e.g. Kigali Youth Outreach — May 2025"
                    value={form.title} onChange={e => set('title', e.target.value)} />
                  {errors.title && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{errors.title}</span>}
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Activity Type <span>*</span></label>
                    <select className={`form-select ${fieldCls('type')}`} value={form.type} onChange={e => set('type', e.target.value)}>
                      <option value="">Select type...</option>
                      {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {errors.type && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{errors.type}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department <span>*</span></label>
                    <select className={`form-select ${fieldCls('department')}`} value={form.department} onChange={e => set('department', e.target.value)}>
                      <option value="">Select department...</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    {errors.department && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{errors.department}</span>}
                  </div>
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label"><Calendar size={13} style={{ marginRight: 4 }} />Activity Date <span>*</span></label>
                    <input className={fieldCls('date')} type="date" value={form.date} onChange={e => set('date', e.target.value)} />
                    {errors.date && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{errors.date}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label"><Clock size={13} style={{ marginRight: 4 }} />Duration</label>
                    <input className="form-control" placeholder="e.g. 4 hours, 2 days" value={form.duration} onChange={e => set('duration', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label"><MapPin size={13} style={{ marginRight: 4 }} />Region <span>*</span></label>
                    <select className={`form-select ${fieldCls('region')}`} value={form.region} onChange={e => set('region', e.target.value)}>
                      <option value="">Select region...</option>
                      {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    {errors.region && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{errors.region}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Specific Location</label>
                    <input className="form-control" placeholder="e.g. Kimironko, Kigali" value={form.location} onChange={e => set('location', e.target.value)} />
                  </div>
                </div>

              </div>
            </div>
          )}

          {step === 2 && (
            <div className="card">
              <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Content & Outcomes</h3></div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">Activity Description <span>*</span></label>
                  <textarea className={fieldCls('description')} rows={4}
                    placeholder="Describe the activities conducted, methods used, and how the event was organized..."
                    value={form.description} onChange={e => set('description', e.target.value)} />
                  {errors.description && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{errors.description}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Outcomes & Impact</label>
                  <textarea className="form-control" rows={3}
                    placeholder="Describe the outcomes achieved, impact on participants, decisions made, follow-up plans..."
                    value={form.outcomes} onChange={e => set('outcomes', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Challenges Encountered</label>
                  <textarea className="form-control" rows={3}
                    placeholder="Describe any challenges, obstacles, or areas for improvement..."
                    value={form.challenges} onChange={e => set('challenges', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="card">
              <div className="card-header"><h3 style={{ fontSize: '1rem' }}><Users size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />Attendance Statistics</h3></div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">Total Participants</label>
                  <input className="form-control" type="number" min="0" placeholder="0"
                    value={form.totalParticipants} onChange={e => set('totalParticipants', e.target.value)} />
                </div>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary)' }}>Demographics Breakdown</p>
                <div className="grid grid-2">
                  {[['male', 'Male'], ['female', 'Female'], ['youth', 'Youth (under 25)'], ['adults', 'Adults (25+)']].map(([k, label]) => (
                    <div key={k} className="form-group">
                      <label className="form-label">{label}</label>
                      <input className="form-control" type="number" min="0" placeholder="0"
                        value={form[k]} onChange={e => set(k, e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="card">
              <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Support & Files</h3></div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">Prayer Requests</label>
                  <textarea className="form-control" rows={3}
                    placeholder="Share any prayer requests arising from this activity..."
                    value={form.prayerRequests} onChange={e => set('prayerRequests', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Supporting Documents</label>
                  <div className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('file-input').click()}>
                    <Upload size={32} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                    <p style={{ fontWeight: 600, marginBottom: 4 }}>Drop files here or click to upload</p>
                    <p className="text-muted text-sm">Photos, attendance lists, materials (PDF, DOCX, JPG, PNG)</p>
                    <input id="file-input" type="file" multiple hidden
                      onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files).map(f => ({ name: f.name, size: f.size }))])} />
                  </div>
                  {files.length > 0 && (
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {files.map((f, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                          <span style={{ fontSize: '0.82rem' }}>{f.name}</span>
                          <button className="btn btn-ghost btn-sm" onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <hr style={{ margin: '24px 0', borderColor: 'var(--border)' }} />
                
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span><Users size={13} style={{ marginRight: 4 }} />Share With (Recipients)</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--primary)' }}>
                      {form.recipientIds.length} Selected
                    </span>
                  </label>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: 12 }}>Select individuals or roles to send this report to directly.</p>
                  
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => selectRole('admin')}>All Admins</button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => selectRole('manager')}>All Managers</button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => selectRole('coordinator')}>All Coordinators</button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => selectRole('staff')}>All Staff</button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => set('recipientIds', [])} style={{ color: 'var(--danger)' }}>Clear All</button>
                  </div>

                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Search users by name, role, or region..." 
                    value={userSearch} 
                    onChange={e => setUserSearch(e.target.value)}
                    style={{ marginBottom: '12px' }}
                  />

                  <div className="card" style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border)' }}>
                    <div className="card-body" style={{ padding: 0 }}>
                      {usersList.filter(u => {
                        const s = userSearch.toLowerCase();
                        const nameMatch = (u.name || '').toLowerCase().includes(s);
                        const roleMatch = (u.role || '').toLowerCase().includes(s);
                        const regionMatch = (u.region || '').toLowerCase().includes(s);
                        return nameMatch || roleMatch || regionMatch;
                      }).map(u => (
                        <div key={u.id} style={{ 
                          padding: '8px 16px', 
                          borderBottom: '1px solid var(--border)', 
                          display: 'flex', 
                          alignItems: 'center',
                          gap: 12,
                          cursor: 'pointer',
                          backgroundColor: form.recipientIds.includes(u.id) ? 'rgba(46, 125, 50, 0.05)' : 'transparent'
                        }} onClick={() => toggleRecipient(u.id)}>
                          <input type="checkbox" checked={form.recipientIds.includes(u.id)} readOnly style={{ cursor: 'pointer' }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--text)' }}>{u.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', textTransform: 'capitalize' }}>{u.role} &bull; {u.region}</div>
                          </div>
                        </div>
                      ))}
                      {usersList.length === 0 && <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-light)' }}>Loading users...</div>}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
            <button className="btn btn-secondary" onClick={() => step > 1 ? setStep(s => s - 1) : navigate('/reports')}>
              {step > 1 ? '← Back' : '← Cancel'}
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" onClick={() => handleSubmit(true)} disabled={submitting}>
                <Save size={16} />{submitting ? 'Saving...' : 'Save Draft'}
              </button>
              {step < 4 ? (
                <button className="btn btn-primary" onClick={() => setStep(s => s + 1)}>Continue →</button>
              ) : (
                <button className="btn btn-primary" onClick={() => handleSubmit(false)} disabled={submitting}>
                  <Send size={16} />{submitting ? 'Submitting...' : 'Submit Report'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-header"><h3 style={{ fontSize: '0.9rem' }}>Report Summary</h3></div>
            <div className="card-body" style={{ paddingTop: 12 }}>
              {[
                { label: 'Title', val: form.title || '—' },
                { label: 'Type', val: form.type || '—' },
                { label: 'Region', val: form.region || '—' },
                { label: 'Date', val: form.date || '—' },
                { label: 'Duration', val: form.duration || '—' },
                { label: 'Files', val: `${files.length} attached` },
              ].map(({ label, val }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontWeight: 500, maxWidth: 160, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="alert alert-info">
            <CheckCircle size={16} />
            <div>
              <strong>Tips:</strong>
              <ul style={{ paddingLeft: 16, marginTop: 4, fontSize: '0.78rem' }}>
                <li>Be specific about outcomes</li>
                <li>Include actual attendance numbers</li>
                <li>Attach photos as evidence</li>
                <li>Share prayer requests</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
