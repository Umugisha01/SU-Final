import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send, Upload, X, CheckCircle, Users } from 'lucide-react';
import { REGIONS } from '../../data/mockData';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { supportService, userService } from '../../services/api';

const REQUEST_TYPES = ['Material', 'Financial', 'Personnel', 'Training', 'Prayer', 'Other'];
const PRIORITIES = [
  { val: 'low', label: 'Low', desc: 'Can wait 2–4 weeks', color: '#6b7280' },
  { val: 'medium', label: 'Medium', desc: 'Needed within 1–2 weeks', color: '#3b82f6' },
  { val: 'high', label: 'High', desc: 'Needed within days', color: '#f59e0b' },
  { val: 'urgent', label: 'Urgent', desc: 'Needed immediately', color: '#ef4444' },
];

export default function SupportForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [form, setForm] = useState({ type: '', title: '', description: '', justification: '', priority: '', deadline: '', region: user?.region || '', recipientIds: [] });
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [usersList, setUsersList] = useState([]);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  useEffect(() => {
    userService.getDirectory()
      .then(data => setUsersList(data || []))
      .catch(console.error);
  }, []);

  // Load existing request data in edit mode
  useEffect(() => {
    if (isEditMode) {
      setLoadingEdit(true);
      supportService.get(id)
        .then(data => {
          // Split description to extract justification if it was appended
          let desc = data.description || '';
          let justification = '';
          const justIdx = desc.indexOf('\n\nJustification: ');
          if (justIdx !== -1) {
            justification = desc.substring(justIdx + '\n\nJustification: '.length);
            desc = desc.substring(0, justIdx);
          }
          setForm({
            type: data.type || '',
            title: data.title || '',
            description: desc,
            justification: justification,
            priority: data.priority || '',
            deadline: data.deadline || '',
            region: data.region || user?.region || '',
            recipientIds: data.recipientIds || [],
          });
        })
        .catch(err => {
          console.error('Error loading support request for edit:', err);
          setErrors({ submit: 'Failed to load support request. It may have been deleted.' });
        })
        .finally(() => setLoadingEdit(false));
    }
  }, [id, isEditMode]);

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

  const handleGetSuggestion = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      setErrors(prev => ({ ...prev, suggestion: 'Title and Description are required to get AI suggestion.' }));
      return;
    }
    setLoadingSuggestion(true);
    setErrors(prev => {
      const copy = { ...prev };
      delete copy.suggestion;
      return copy;
    });
    try {
      const data = await supportService.suggestPriority(
        form.title,
        form.description + (form.justification ? `\n\nJustification: ${form.justification}` : ''),
        form.type || 'Other'
      );
      setAiSuggestion(data);
    } catch (err) {
      console.error(err);
      setErrors(prev => ({ ...prev, suggestion: 'Failed to fetch AI priority suggestion. Make sure the local LLM server is online.' }));
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const desc = form.justification 
        ? `${form.description}\n\nJustification: ${form.justification}`
        : form.description;
      
      const payload = {
        title: form.title,
        description: desc,
        type: form.type,
        priority: form.priority,
        recipientIds: form.recipientIds
      };

      if (isEditMode) {
        await supportService.update(id, payload);
        addNotification({ 
          type: 'support', 
          title: 'Support Request Updated', 
          message: `Your "${form.type}" request has been updated.`, 
          icon: 'package' 
        });
      } else {
        await supportService.create(payload);
        addNotification({ 
          type: 'support', 
          title: 'Support Request Submitted', 
          message: `Your "${form.type}" request has been submitted.`, 
          icon: 'package' 
        });
      }
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
            <h1 className="page-title">{isEditMode ? 'Edit Support Request' : 'New Support Request'}</h1>
            <p className="page-subtitle">{isEditMode ? 'Update your support request details' : 'Submit a request for resources, support, or prayer'}</p>
          </div>
        </div>
      </div>

      <div className="page-layout-grid">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Request Type */}
          <div className="card">
            <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Request Type</h3></div>
            <div className="card-body">
              <div className="responsive-grid-3">
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

          {/* AI Suggestion Section */}
          <div className="card" style={{ border: '1px solid var(--primary-300)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--primary)', color: 'white', fontSize: '0.65rem', padding: '3px 10px', borderBottomLeftRadius: 'var(--radius)', fontWeight: 700 }}>
              AI ASSISTANT
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  🤖 AI Priority Suggestion
                </p>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm" 
                  onClick={handleGetSuggestion} 
                  disabled={loadingSuggestion}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  {loadingSuggestion ? 'Analyzing...' : 'Analyze Request Content'}
                </button>
              </div>
              
              {errors.suggestion && (
                <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: 10, marginBottom: 0 }}>{errors.suggestion}</p>
              )}

              {aiSuggestion && (
                <div style={{ marginTop: 14, background: 'var(--bg-input)', padding: '12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: '0.85rem' }}>
                      Suggested Priority: <strong style={{ textTransform: 'capitalize' }}>{aiSuggestion.priority}</strong> <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>({aiSuggestion.confidence}% confidence)</span>
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-primary btn-sm" 
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      onClick={() => {
                        set('priority', aiSuggestion.priority);
                        if (addNotification) {
                          addNotification({
                            type: 'system',
                            title: 'AI Priority Applied',
                            message: `Set priority to ${aiSuggestion.priority}.`,
                            icon: 'check-circle'
                          });
                        }
                      }}
                    >
                      Apply Suggestion
                    </button>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 8, marginBottom: 0, lineHeight: 1.5 }}>
                    <strong>Reason:</strong> {aiSuggestion.reason}
                  </p>
                  {aiSuggestion.key_factors && aiSuggestion.key_factors.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Key Factors:</span>
                      {aiSuggestion.key_factors.map(f => (
                        <span key={f} className="badge badge-gray" style={{ fontSize: '0.65rem' }}>{f}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {!aiSuggestion && !errors.suggestion && (
                <p style={{ margin: '8px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Provide a Title and Description, then click "Analyze Request Content" to receive a recommended priority level and reasoning.
                </p>
              )}
            </div>
          </div>

          {/* Priority */}
          <div className="card">
            <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Priority Level</h3></div>
            <div className="card-body">
              <div className="responsive-grid-4">
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

          {/* Recipients Selector */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', margin: 0 }}>
                Share With (Recipients)
              </h3>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>
                {form.recipientIds.length} Selected
              </span>
            </div>
            <div className="card-body">
              <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: 12 }}>Select individuals or roles to share this support request with.</p>
              
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => selectRole('administrator')}>All Admins</button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => selectRole('national_manager')}>All Managers</button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => selectRole('regional_coordinator')}>All Coordinators</button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => selectRole('field_officer')}>All Staff</button>
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

          {errors.submit && (
            <div className="alert alert-danger" style={{ fontSize: '0.85rem' }}>
              {errors.submit}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/support')}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-lg" disabled={submitting || loadingEdit}>
              <Send size={16} />{submitting ? (isEditMode ? 'Updating...' : 'Submitting...') : (isEditMode ? 'Update Request' : 'Submit Request')}
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
                { label: 'Recipients', val: `${form.recipientIds.length} selected` },
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
