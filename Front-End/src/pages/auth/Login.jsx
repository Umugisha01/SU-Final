import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Leaf, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

export default function Login() {
  const { login, setUser, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [remember, setRemember] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [pendingUser, setPendingUser] = useState(null);

  const DEMO_CREDS = [
    { role: 'Admin', email: 'admin@su.rw', pw: 'Admin@123', color: '#dc2626' },
    { role: 'Manager', email: 'manager@su.rw', pw: 'Manager@123', color: '#1565c0' },
    { role: 'Staff', email: 'staff@su.rw', pw: 'Staff@123', color: '#2e7d32' },
    { role: 'Coordinator', email: 'coordinator@su.rw', pw: 'Coord@123', color: '#6a1b9a' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return; }
    const res = await login(form.email, form.password);
    if (res.success) {
      if (res.mfaRequired) {
        localStorage.setItem('su-access-token', res.accessToken);
        setPendingUser(res.user);
        setMfaRequired(true);
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(res.error);
    }
  };

  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!otpCode) { setError('Please enter your verification code.'); return; }
    try {
      const { authService } = await import('../../services/api');
      const res = await authService.verifyMfa(otpCode);
      if (res.success) {
        setUser(pendingUser);
        localStorage.setItem('su-user', JSON.stringify(pendingUser));
        navigate('/dashboard');
      } else {
        setError(res.error || 'Verification failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid verification code');
    }
  };

  const quickLogin = async (email, pw) => {
    setForm({ email, password: pw });
    setError('');
    const res = await login(email, pw);
    if (res.success) {
      if (res.mfaRequired) {
        localStorage.setItem('su-access-token', res.accessToken);
        setPendingUser(res.user);
        setMfaRequired(true);
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-logo"><Leaf size={28} /></div>
          <h1>SU Connect</h1>
          <p>AI-Powered Reporting & Support System</p>
        </div>
        <div className="auth-illustration">
          <div className="auth-feature-list">
            {['Digitize activity reporting', 'AI-powered report analysis', 'Regional coordination', 'Prayer request management', 'Real-time analytics'].map((f, i) => (
              <div key={i} className="auth-feature"><CheckCircle size={16} /><span>{f}</span></div>
            ))}
          </div>
        </div>
        <p className="auth-footer-text">Scripture Union Rwanda © 2025</p>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          {mfaRequired ? (
            <>
              <div className="auth-card-header">
                <h2>Security Verification</h2>
                <p>Enter the 6-digit OTP code from your Google Authenticator app</p>
              </div>

              {error && (
                <div className="alert alert-danger" style={{ marginBottom: 16 }}>
                  <AlertCircle size={16} />{error}
                </div>
              )}

              <form onSubmit={handleMfaSubmit}>
                <div className="form-group">
                  <label className="form-label">OTP Verification Code <span>*</span></label>
                  <div className="input-with-icon">
                    <Lock size={16} className="input-icon" />
                    <input className="form-control" type="text" maxLength={6} placeholder="000000"
                      value={otpCode} onChange={e => setOtpCode(e.target.value)} />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-lg w-full" style={{ marginBottom: 10 }}>
                  Verify & Login
                </button>
                <button type="button" className="btn btn-secondary btn-lg w-full" onClick={() => { setMfaRequired(false); setError(''); }}>
                  Back to Login
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="auth-card-header">
                <h2>Welcome back</h2>
                <p>Sign in to SU Connect</p>
              </div>

              {error && (
                <div className="alert alert-danger" style={{ marginBottom: 16 }}>
                  <AlertCircle size={16} />{error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Email Address <span>*</span></label>
                  <div className="input-with-icon">
                    <Mail size={16} className="input-icon" />
                    <input id="email" className="form-control" type="email" placeholder="your@email.com"
                      value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Password <span>*</span></label>
                  <div className="input-with-icon" style={{ position: 'relative' }}>
                    <Lock size={16} className="input-icon" />
                    <input id="password" className="form-control" type={showPw ? 'text' : 'password'}
                      placeholder="Enter your password" style={{ paddingRight: 40 }}
                      value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                    <button type="button" className="pw-toggle" onClick={() => setShowPw(s => !s)}>
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <label className="checkbox-wrapper" onClick={() => setRemember(r => !r)}>
                    <div className={`checkbox ${remember ? 'checked' : ''}`}>
                      {remember && <CheckCircle size={12} color="#fff" />}
                    </div>
                    <span className="text-sm">Remember me</span>
                  </label>
                  <Link to="/forgot-password" className="text-sm" style={{ color: 'var(--primary)', fontWeight: 500 }}>Forgot password?</Link>
                </div>

                <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className="auth-divider"><span>Quick Demo Login</span></div>

              <div className="demo-creds">
                {DEMO_CREDS.map(d => (
                  <button key={d.role} className="demo-btn" style={{ '--demo-color': d.color }}
                    onClick={() => quickLogin(d.email, d.pw)} disabled={loading}>
                    <span className="demo-role">{d.role}</span>
                    <span className="demo-email">{d.email}</span>
                  </button>
                ))}
              </div>

              <p className="text-center text-sm" style={{ marginTop: 20 }}>
                Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Register here</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
