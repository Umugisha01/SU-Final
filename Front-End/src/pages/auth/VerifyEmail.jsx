import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader, Mail } from 'lucide-react';
import { authService } from '../../services/api';
import './Auth.css';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState('');
  const [resendError, setResendError] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const performVerification = async () => {
      if (!token) {
        setError('Verification token is missing.');
        setVerifying(false);
        return;
      }
      try {
        const res = await authService.verifyEmail(token);
        if (res.success) {
          setSuccess(true);
        } else {
          setError(res.error || 'Verification failed.');
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Verification link is invalid or has expired.');
      } finally {
        setVerifying(false);
      }
    };
    
    performVerification();
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail) return;
    setResending(true);
    setResendStatus('');
    setResendError('');
    try {
      const res = await authService.resendVerification(resendEmail);
      if (res.success) {
        setResendStatus('Verification email sent! Please check your inbox.');
      } else {
        setResendError(res.error || 'Failed to resend email.');
      }
    } catch (err) {
      setResendError(err.response?.data?.error || 'Failed to resend email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-logo"><img src="/SU-Logo.png" alt="SU Logo" /></div>
          <h1>SU Connect</h1>
          <p>Secure Organization Management</p>
        </div>
        <p className="auth-footer-text">Scripture Union Rwanda © 2025</p>
      </div>

      <div className="auth-right">
        <div className="auth-card" style={{ maxWidth: 460 }}>
          {verifying ? (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <Loader className="animate-spin" size={40} color="var(--primary)" style={{ margin: '0 auto 20px', animation: 'spin 1.5s linear infinite' }} />
              <h3>Verifying your email...</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 10 }}>Please wait while we secure your account details.</p>
            </div>
          ) : success ? (
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
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12 }}>Email Verified!</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: 20 }}>
                Your email has been verified successfully.
              </p>
              <div className="alert alert-info" style={{ marginBottom: 28, fontSize: '0.82rem', textAlign: 'left', lineHeight: '1.4' }}>
                <strong>What happens next?</strong> An administrator will review your profile to activate your access. You will receive an email confirmation once activated.
              </div>
              <Link to="/login" className="btn btn-primary w-full">Go to Login</Link>
            </div>
          ) : (
            <div style={{ padding: '10px 0' }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px'
              }}>
                <XCircle size={36} color="var(--danger)" />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12, textAlign: 'center' }}>Verification Failed</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: 24, textAlign: 'center' }}>
                {error}
              </p>

              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 24, marginTop: 16 }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 8 }}>Request a new verification link:</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginBottom: 16 }}>Enter your email address below to resend the activation link.</p>
                
                {resendStatus && <div className="alert alert-success mb-3">{resendStatus}</div>}
                {resendError && <div className="alert alert-danger mb-3">{resendError}</div>}
                
                <form onSubmit={handleResend} style={{ display: 'flex', gap: 10 }}>
                  <div className="input-with-icon" style={{ flex: 1, margin: 0 }}>
                    <Mail size={16} className="input-icon" />
                    <input className="form-control" type="email" placeholder="your@email.com" required
                      value={resendEmail} onChange={e => setResendEmail(e.target.value)} />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={resending} style={{ whiteSpace: 'nowrap' }}>
                    {resending ? 'Sending...' : 'Send'}
                  </button>
                </form>
              </div>

              <Link to="/login" className="btn btn-secondary w-full" style={{ marginTop: 24 }}>Back to Login</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
