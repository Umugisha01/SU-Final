import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, User, Briefcase, Lock, ChevronRight, ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { REGIONS, DEPARTMENTS } from '../../data/mockData';
import './Auth.css';

const ROLES = [
  { value: 'field_officer', label: 'Field Coordinator', desc: 'Submit reports, support tickets, and prayer requests', icon: '👤' },
  { value: 'field_officer_staff', label: 'Staff Member', desc: 'Coordinator permissions + document uploads and comments', icon: '👥' },
  { value: 'regional_coordinator', label: 'Regional Manager', desc: 'Approve reports, assign support requests, view analytics', icon: '🌍' },
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
  const [form, setForm] = useState({ 
    selectedRole: '', 
    role: '', 
    fullName: '', 
    email: '', 
    phone: '', 
    region: '', 
    location: '', 
    position: '', 
    department: '', 
    password: '', 
    confirm: '' 
  });
  const [errors, setErrors] = useState({});
  const [registered, setRegistered] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const pwStrength = getPwStrength(form.password);

  const handleRoleSelect = (val) => {
    setForm(f => {
      let role = val;
      let pos = f.position;
      if (val === 'field_officer_staff') {
        role = 'field_officer';
        pos = 'Staff Member';
      } else if (val === 'field_officer') {
        role = 'field_officer';
        pos = 'Field Coordinator';
      } else if (val === 'regional_coordinator') {
        role = 'regional_coordinator';
        pos = 'Regional Manager';
      }
      return { ...f, selectedRole: val, role, position: pos };
    });
  };

  const validate = () => {
    const e = {};
    if (step === 1 && !form.selectedRole) e.role = 'Select a role';
    if (step === 2) {
      if (!form.fullName) e.fullName = 'Required';
      if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
      if (!form.phone) e.phone = 'Required';
      if (!form.region) e.region = 'Required';
      if (!form.location) e.location = 'Required';
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
    if (res.success) {
      setRegistered(true);
    } else {
      setErrors({ apiError: res.error });
    }
  };

  const STEPS = ['Role', 'Personal Info', 'Department', 'Password'];

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-logo"><img src="/SU-Logo.png" alt="SU Logo" /></div>
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
          {registered ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(34, 197, 94, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px'
              }}>
                <CheckCircle size={36} color="var(--success)" />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12 }}>Verify Your Email</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: 24 }}>
                We have sent a verification link to <strong>{form.email}</strong>. Please check your inbox and verify your email address to proceed.
              </p>
              <p style={{ color: 'var(--text-light)', fontSize: '0.8rem', lineHeight: '1.5', marginBottom: 24 }}>
                Once verified, an administrator will review and activate your account. You will receive an email confirmation when your account is active.
              </p>
              <Link to="/login" className="btn btn-primary w-full">Return to Login</Link>
            </div>
          ) : (
            <>
              <div className="auth-card-header">
                <h2>Create Account</h2>
                <p>Step {step} of 4 — {STEPS[step - 1]}</p>
              </div>

              {errors.apiError && (
                <div className="alert alert-danger" style={{ marginBottom: 16 }}>
                  {errors.apiError}
                </div>
              )}

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
                        <div key={r.value} className={`role-card ${form.selectedRole === r.value ? 'selected' : ''}`}
                          onClick={() => handleRoleSelect(r.value)}>
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
                    <div className="form-group">
                      <label className="form-label">Location (District/Sector) <span>*</span></label>
                      <input className="form-control" placeholder="e.g. Gasabo, Kacyiru" value={form.location}
                        onChange={e => set('location', e.target.value)} />
                      {errors.location && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{errors.location}</span>}
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
                        onChange={e => set('position', e.target.value)} disabled={true} />
                      {errors.position && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{errors.position}</span>}
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div>
                    <div className="form-group">
                      <label className="form-label">Password <span>*</span></label>
                      <div style={{ position: 'relative' }}>
                        <input className="form-control" type={showPw ? 'text' : 'password'} placeholder="Min 8 characters" style={{ paddingRight: 40 }} value={form.password}
                          onChange={e => set('password', e.target.value)} />
                        <button type="button" className="pw-toggle" onClick={() => setShowPw(s => !s)}>
                          {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
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
                      <div style={{ position: 'relative' }}>
                        <input className="form-control" type={showConfirm ? 'text' : 'password'} placeholder="Repeat password" style={{ paddingRight: 40 }} value={form.confirm}
                          onChange={e => set('confirm', e.target.value)} />
                        <button type="button" className="pw-toggle" onClick={() => setShowConfirm(s => !s)}>
                          {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
