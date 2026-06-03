import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, CheckCircle, User, Briefcase, Lock, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { REGIONS, DEPARTMENTS } from '../../data/mockData';
import './Auth.css';

const ROLES = [
  { value: 'coordinator', label: 'Field Coordinator', desc: 'Submit reports from field activities', icon: '🌍' },
  { value: 'staff', label: 'Staff Member', desc: 'Organization staff with reporting access', icon: '👤' },
  { value: 'manager', label: 'Regional Manager', desc: 'Oversee regional activities and reports', icon: '📊' },
  { value: 'admin', label: 'Administrator', desc: 'Full system administration access', icon: '⚙️' },
];

const getPwStrength = (pw) => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];
  return { score, label: labels[score], color: colors[score] };
};

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ role: '', fullName: '', email: '', phone: '', region: '', position: '', department: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const pwStrength = getPwStrength(form.password);

  const validate = () => {
    const e = {};
    if (step === 1 && !form.role) e.role = 'Select a role';
    if (step === 2) {
      if (!form.fullName) e.fullName = 'Required';
      if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
      if (!form.phone) e.phone = 'Required';
      if (!form.region) e.region = 'Required';
    }
    if (step === 3) {
      if (!form.department) e.department = 'Required';
      if (!form.position) e.position = 'Required';
    }
    if (step === 4) {
      if (form.password.length < 8) e.password = 'Min 8 characters';
      if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate()) setStep(s => s + 1); };
  const back = () => setStep(s => s - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const res = await register(form);
    if (res.success) navigate('/dashboard');
  };

  const STEPS = ['Role', 'Personal Info', 'Department', 'Password'];

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-logo"><Leaf size={28} /></div>
          <h1>Join SU Connect</h1>
          <p>Create your account to get started</p>
        </div>
        <div className="auth-illustration">
          <div className="auth-feature-list">
            <div className="auth-feature"><CheckCircle size={16} /><span>Role-based access control</span></div>
            <div className="auth-feature"><CheckCircle size={16} /><span>Secure multi-factor authentication</span></div>
            <div className="auth-feature"><CheckCircle size={16} /><span>Regional activity tracking</span></div>
            <div className="auth-feature"><CheckCircle size={16} /><span>AI-powered report analysis</span></div>
          </div>
        </div>
        <p className="auth-footer-text">Scripture Union Rwanda © 2025</p>
      </div>

      <div className="auth-right">
        <div className="auth-card" style={{ maxWidth: 520 }}>
          <div className="auth-card-header">
            <h2>Create Account</h2>
            <p>Step {step} of 4 — {STEPS[step - 1]}</p>
          </div>

          <div className="stepper">
            {STEPS.map((s, i) => (
              <div key={i} className={`step ${step > i + 1 ? 'done' : ''} ${step === i + 1 ? 'active' : ''}`}>
                <div className="step-circle">
                  {step > i + 1 ? <CheckCircle size={16} /> : i + 1}
                </div>
                <span className="step-label">{s}</span>
              </div>
            ))}
          </div>

          <form onSubmit={step === 4 ? handleSubmit : e => { e.preventDefault(); next(); }}>
            {step === 1 && (
              <div>
                <p className="text-muted mb-4">Select your role in Scripture Union Rwanda:</p>
                <div className="role-cards">
                  {ROLES.map(r => (
                    <div key={r.value} className={`role-card ${form.role === r.value ? 'selected' : ''}`}
                      onClick={() => set('role', r.value)}>
                      <div className="role-card-icon">{r.icon}</div>
                      <div className="role-card-title">{r.label}</div>
                      <div className="role-card-desc">{r.desc}</div>
                    </div>
                  ))}
                </div>
                {errors.role && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: 8 }}>{errors.role}</p>}
              </div>
            )}

            {step === 2 && (
              <div>
                <div className="form-group">
                  <label className="form-label">Full Name <span>*</span></label>
                  <input className="form-control" placeholder="John Doe" value={form.fullName}
                    onChange={e => set('fullName', e.target.value)} />
                  {errors.fullName && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{errors.fullName}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address <span>*</span></label>
                  <input className="form-control" type="email" placeholder="you@example.com" value={form.email}
                    onChange={e => set('email', e.target.value)} />
                  {errors.email && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{errors.email}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number <span>*</span></label>
                  <input className="form-control" placeholder="+250 788 000 000" value={form.phone}
                    onChange={e => set('phone', e.target.value)} />
                  {errors.phone && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{errors.phone}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Region <span>*</span></label>
                  <select className="form-control form-select" value={form.region}
                    onChange={e => set('region', e.target.value)}>
                    <option value="">Select region...</option>
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  {errors.region && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{errors.region}</span>}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <div className="form-group">
                  <label className="form-label">Department <span>*</span></label>
                  <select className="form-control form-select" value={form.department}
                    onChange={e => set('department', e.target.value)}>
                    <option value="">Select department...</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {errors.department && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{errors.department}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Position / Job Title <span>*</span></label>
                  <input className="form-control" placeholder="e.g. Field Coordinator" value={form.position}
                    onChange={e => set('position', e.target.value)} />
                  {errors.position && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{errors.position}</span>}
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <div className="form-group">
                  <label className="form-label">Password <span>*</span></label>
                  <input className="form-control" type="password" placeholder="Min 8 characters" value={form.password}
                    onChange={e => set('password', e.target.value)} />
                  {form.password && (
                    <>
                      <div className="pw-strength">
                        <div className="pw-strength-fill" style={{ width: `${pwStrength.score * 25}%`, background: pwStrength.color }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', color: pwStrength.color, marginTop: 4, display: 'block' }}>
                        {pwStrength.label}
                      </span>
                    </>
                  )}
                  {errors.password && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{errors.password}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password <span>*</span></label>
                  <input className="form-control" type="password" placeholder="Repeat password" value={form.confirm}
                    onChange={e => set('confirm', e.target.value)} />
                  {errors.confirm && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{errors.confirm}</span>}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              {step > 1 && (
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={back}>
                  <ChevronLeft size={16} /> Back
                </button>
              )}
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                {step === 4 ? (loading ? 'Creating...' : 'Create Account') : 'Continue'} <ChevronRight size={16} />
              </button>
            </div>
          </form>

          <p className="text-center text-sm" style={{ marginTop: 16 }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
