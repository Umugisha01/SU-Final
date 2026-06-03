import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Upload, X, CheckCircle } from 'lucide-react';
import { REGIONS } from '../../data/mockData';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { supportService } from '../../services/api';

const REQUEST_TYPES = ['Material', 'Financial', 'Personnel', 'Training', 'Prayer', 'Other'];
const PRIORITIES = [
  { val: 'low', label: 'Low', desc: 'Can wait 2–4 weeks', color: '#6b7280' },
  { val: 'medium', label: 'Medium', desc: 'Needed within 1–2 weeks', color: '#3b82f6' },
  { val: 'high', label: 'High', desc: 'Needed within days', color: '#f59e0b' },
  { val: 'urgent', label: 'Urgent', desc: 'Needed immediately', color: '#ef4444' },
];

export default function SupportForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [form, setForm] = useState({ type: '', title: '', description: '', justification: '', priority: '', deadline: '', region: user?.region || '' });
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.type) e.type = 'Select request type';
    if (!form.title.trim()) e.title = 'Title required';
    if (form.title.trim().length < 5) e.title = 'Title must be at least 5 characters long';
    if (!form.description.trim()) e.description = 'Description required';
    if (form.description.trim().length < 20) e.description = 'Description must be at least 20 characters long';
    if (!form.priority) e.priority = 'Select priority level';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const desc = form.justification 
        ? `${form.description}\n\nJustification: ${form.justification}`
        : form.description;
      await supportService.create({
        title: form.title,
        description: desc,
        type: form.type,
        priority: form.priority
      });
      addNotification({ 
        type: 'support', 
        title: 'Support Request Submitted', 
        message: `Your "${form.type}" request has been submitted.`, 
        icon: 'package' 
      });
      navigate('/support');
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.error || err.message;
      setErrors({ submit: typeof detail === 'object' ? JSON.stringify(detail) : detail });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/support')}><ArrowLeft size={18} /></button>
          <div>
            <h1 className="page-title">New Support Request</h1>
            <p className="page-subtitle">Submit a request for resources, support, or prayer</p>
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 300px', gap: 20 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Request Type */}
          <div className="card">
            <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Request Type</h3></div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {REQUEST_TYPES.map(t => (
                  <button key={t} type="button"
                    style={{ padding: '12px', borderRadius: 'var(--radius)', border: `2px solid ${form.type === t ? 'var(--primary)' : 'var(--border)'}`, background: form.type === t ? 'var(--primary-50)' : 'var(--bg-input)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.85rem', color: form.type === t ? 'var(--primary)' : 'var(--text-primary)', transition: 'all var(--transition)' }}
                    onClick={() => set('type', t)}>{t}</button>
                ))}
              </div>
              {errors.type && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: 8 }}>{errors.type}</p>}
            </div>
          </div>

          {/* Details */}
          <div className="card">
            <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Request Details</h3></div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Request Title <span>*</span></label>
                <input className="form-control" placeholder="Brief title of your request" value={form.title} onChange={e => set('title', e.target.value)} />
                {errors.title && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{errors.title}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Description <span>*</span></label>
                <textarea className="form-control" rows={4} placeholder="Describe what you need and why..."
                  value={form.description} onChange={e => set('description', e.target.value)} />
                {errors.description && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{errors.description}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Justification</label>
                <textarea className="form-control" rows={3} placeholder="Explain how this will impact ministry activities..."
                  value={form.justification} onChange={e => set('justification', e.target.value)} />
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Region</label>
                  <select className="form-control form-select" value={form.region} onChange={e => set('region', e.target.value)}>
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Requested By Date</label>
                  <input className="form-control" type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Priority */}
          <div className="card">
            <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Priority Level</h3></div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {PRIORITIES.map(p => (
                  <button key={p.val} type="button"
                    style={{ padding: '14px 10px', borderRadius: 'var(--radius)', border: `2px solid ${form.priority === p.val ? p.color : 'var(--border)'}`, background: form.priority === p.val ? p.color + '15' : 'var(--bg-input)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all var(--transition)', textAlign: 'center' }}
                    onClick={() => set('priority', p.val)}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: form.priority === p.val ? p.color : 'var(--text-primary)', marginBottom: 4 }}>{p.label}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>{p.desc}</div>
                  </button>
                ))}
              </div>
              {errors.priority && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: 8 }}>{errors.priority}</p>}
            </div>
          </div>

          {/* Attachments */}
          <div className="card">
            <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Supporting Documents</h3></div>
            <div className="card-body">
              <div className="upload-zone" onClick={() => document.getElementById('support-files').click()}>
                <Upload size={28} style={{ color: 'var(--text-muted)', marginBottom: 10 }} />
                <p style={{ fontWeight: 600 }}>Upload supporting documents</p>
                <p className="text-muted text-sm">Quotes, forms, schedules, or any relevant files</p>
                <input id="support-files" type="file" multiple hidden onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files).map(f => ({ name: f.name }))])} />
              </div>
              {files.map((f, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginTop: 8 }}>
                  <span style={{ fontSize: '0.82rem' }}>{f.name}</span>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setFiles(p => p.filter((_, j) => j !== i))}><X size={14} /></button>
                </div>
              ))}
            </div>
          </div>

          {errors.submit && (
            <div className="alert alert-danger" style={{ fontSize: '0.85rem' }}>
              {errors.submit}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/support')}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
              <Send size={16} />{submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-header"><h3 style={{ fontSize: '0.9rem' }}>Request Summary</h3></div>
            <div className="card-body" style={{ paddingTop: 12 }}>
              {[
                { label: 'Type', val: form.type || '—' },
                { label: 'Priority', val: form.priority || '—' },
                { label: 'Region', val: form.region || '—' },
                { label: 'Deadline', val: form.deadline || '—' },
                { label: 'Files', val: `${files.length} attached` },
              ].map(({ label, val }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontWeight: 500 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="alert alert-info">
            <CheckCircle size={16} />
            <div style={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
              <strong>What happens next?</strong><br />
              Your request will be reviewed within 24–48 hours. You'll receive a notification when it's been assigned and updated.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
