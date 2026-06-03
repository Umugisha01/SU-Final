import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Mail, CheckCircle, ArrowLeft } from 'lucide-react';
import './Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setSent(true);
    setLoading(false);
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
            <div className="auth-feature"><CheckCircle size={16} /><span>Secure password recovery</span></div>
            <div className="auth-feature"><CheckCircle size={16} /><span>Email verification required</span></div>
            <div className="auth-feature"><CheckCircle size={16} /><span>Multi-factor authentication</span></div>
          </div>
        </div>
        <p className="auth-footer-text">Scripture Union Rwanda © 2025</p>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          {!sent ? (
            <>
              <div className="auth-card-header">
                <h2>Reset Password</h2>
                <p>Enter your email and we'll send you a reset link</p>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Email Address <span>*</span></label>
                  <div className="input-with-icon">
                    <Mail size={16} className="input-icon" />
                    <input className="form-control" type="email" placeholder="your@email.com"
                      value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading || !email}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: 72, height: 72, background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <CheckCircle size={36} color="#22c55e" />
              </div>
              <h2 style={{ marginBottom: 8 }}>Check Your Email</h2>
              <p className="text-muted">We've sent a password reset link to <strong>{email}</strong>. Please check your inbox and follow the instructions.</p>
            </div>
          )}
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Link to="/login" style={{ color: 'var(--primary)', fontSize: '0.875rem', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeft size={14} /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
