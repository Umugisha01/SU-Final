import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
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
  const [showResend, setShowResend] = useState(false);
  const [resendStatus, setResendStatus] = useState('');
  const [emailStatus, setEmailStatus] = useState('');



  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setShowResend(false);
    setResendStatus('');
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
      if (res.unverified || res.error?.toLowerCase().includes('verify')) {
        setShowResend(true);
      }
    }
  };

  const handleEmailMfa = async () => {
    setError('');
    setEmailStatus('');
    try {
      const { authService } = await import('../../services/api');
      const res = await authService.sendMfaEmail();
      if (res.success) {
        setEmailStatus('MFA code sent to your email address!');
      } else {
        setError(res.error || 'Failed to send verification code.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send verification code.');
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

  const handleResend = async () => {
    try {
      const { authService } = await import('../../services/api');
      const res = await authService.resendVerification(form.email);
      if (res.success) {
        setResendStatus('Verification email sent! Please check your inbox.');
        setShowResend(false);
      } else {
        setError(res.error || 'Failed to resend verification email');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend verification email');
    }
  };



  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-logo"><img src="/SU-Logo.png" alt="SU Logo" /></div>
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

              {emailStatus && (
                <div className="alert alert-success" style={{ marginBottom: 16 }}>
                  <CheckCircle size={16} />{emailStatus}
                </div>
              )}

              <form onSubmit={handleMfaSubmit}>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label className="form-label" style={{ margin: 0 }}>OTP Verification Code <span>*</span></label>
                    <button 
                      type="button" 
                      onClick={handleEmailMfa} 
                      style={{ 
                        fontSize: '0.8rem', 
                        background: 'transparent', 
                        border: 'none', 
                        color: 'var(--primary)', 
                        cursor: 'pointer', 
                        fontWeight: 600, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 6,
                        padding: '4px 8px',
                        borderRadius: '4px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--primary-50)'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Mail size={14} />
                      Send code to my email
                    </button>
                  </div>
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
                <div className="alert alert-danger" style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{error}</span>
                  </div>
                  {showResend && (
                    <button type="button" onClick={handleResend} className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start', padding: '4px 8px', fontSize: '0.78rem', textDecoration: 'underline', color: '#fca5a5', cursor: 'pointer', background: 'transparent', border: 'none' }}>
                      Resend Verification Email
                    </button>
                  )}
                </div>
              )}

              {resendStatus && (
                <div className="alert alert-success" style={{ marginBottom: 16 }}>
                  <CheckCircle size={16} />{resendStatus}
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
