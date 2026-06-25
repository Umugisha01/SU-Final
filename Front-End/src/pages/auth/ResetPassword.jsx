import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Lock, Eye, EyeOff } from 'lucide-react';
import { authService } from '../../services/api';
import './Auth.css';

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

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const pwStrength = getPwStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Password reset token is missing.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.resetPassword(token, password);
      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.error || 'Failed to reset password.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password or link has expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-logo"><img src="/SU-Logo.png" alt="SU Logo" /></div>
          <h1>SU Connect</h1>
          <p>Reset Your Password</p>
        </div>
        <p className="auth-footer-text">Scripture Union Rwanda © 2025</p>
      </div>

      <div className="auth-right">
        <div className="auth-card" style={{ maxWidth: 440 }}>
          <div className="auth-card-header">
            <h2>New Password</h2>
            <p>Enter your new password below</p>
          </div>

          {success ? (
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
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 12 }}>Password Reset Successful!</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: 24 }}>
                Your password has been successfully updated. You can now use your new password to sign in.
              </p>
              <Link to="/login" className="btn btn-primary w-full">Sign In</Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="alert alert-danger" style={{ marginBottom: 16 }}>
                  <AlertCircle size={16} />{error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">New Password <span>*</span></label>
                  <div className="input-with-icon" style={{ position: 'relative' }}>
                    <Lock size={16} className="input-icon" />
                    <input className="form-control" type={showPw ? 'text' : 'password'} placeholder="Min 8 characters" style={{ paddingRight: 40 }}
                      value={password} onChange={e => setPassword(e.target.value)} required />
                    <button type="button" className="pw-toggle" onClick={() => setShowPw(s => !s)}>
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {password && (
                    <>
                      <div className="pw-strength" style={{ marginTop: 8 }}>
                        <div className="pw-strength-fill" style={{ width: `${pwStrength.score * 25}%`, background: pwStrength.color }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', color: pwStrength.color, marginTop: 4, display: 'block' }}>
                        Strength: {pwStrength.label}
                      </span>
                    </>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password <span>*</span></label>
                  <div className="input-with-icon" style={{ position: 'relative' }}>
                    <Lock size={16} className="input-icon" />
                    <input className="form-control" type={showConfirm ? 'text' : 'password'} placeholder="Repeat new password" style={{ paddingRight: 40 }}
                      value={confirm} onChange={e => setConfirm(e.target.value)} required />
                    <button type="button" className="pw-toggle" onClick={() => setShowConfirm(s => !s)}>
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                  {loading ? 'Updating...' : 'Reset Password'}
                </button>
              </form>

              <p className="text-center text-sm" style={{ marginTop: 20 }}>
                Remember your password? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
