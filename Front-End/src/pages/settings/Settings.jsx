import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, Lock, Bell, Shield, Moon, Sun, Camera, CheckCircle, Eye, EyeOff, Clock, AlertTriangle, Mail } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { REGIONS, DEPARTMENTS } from '../../data/mockData';
import { userService, authService } from '../../services/api';

const NOTIF_PREFS_DEFAULT = { email: true, sms: false, inApp: true, deadlineReminders: true, reportUpdates: true, supportUpdates: true, prayerResponses: false };

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', region: user?.region || '', department: user?.department || '', position: user?.position || '', location: user?.location || '' });
  const [pw, setPw] = useState({ current: '', newPw: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });
  const [notifPrefs, setNotifPrefs] = useState(NOTIF_PREFS_DEFAULT);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaStep, setMfaStep] = useState(1);
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaQrUri, setMfaQrUri] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [emailStatus, setEmailStatus] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await userService.getProfile();
        setProfile({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          region: data.region || '',
          department: data.department || '',
          position: data.position || '',
          location: data.location || ''
        });
        setMfaEnabled(data.mfa_enabled);
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    };
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchSessions = async () => {
    try {
      const res = await authService.getSessions();
      if (res.success) {
        setSessions(res.sessions);
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'sessions') {
      fetchSessions();
    }
  }, [activeTab]);

  const handleProfileSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const updated = await userService.updateProfile(profile);
      setProfile({
        name: updated.name || '',
        email: updated.email || '',
        phone: updated.phone || '',
        region: updated.region || '',
        department: updated.department || '',
        position: updated.position || '',
        location: updated.location || ''
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    
    if (pw.newPw.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (pw.newPw !== pw.confirm) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setSaving(true);
      const res = await userService.changePassword(pw.current, pw.newPw);
      if (res.success) {
        setSaved(true);
        setPw({ current: '', newPw: '', confirm: '' });
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(res.error || 'Failed to update password.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update password.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleMfa = async () => {
    setError('');
    if (mfaEnabled) {
      try {
        const res = await authService.toggleMfa(false);
        if (res.success) {
          setMfaEnabled(false);
          setMfaStep(1);
          setMfaSecret('');
          setMfaQrUri('');
          setBackupCodes([]);
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to disable MFA.');
      }
    } else {
      try {
        const res = await authService.setupMfa();
        if (res.success) {
          setMfaSecret(res.secret);
          setMfaQrUri(res.provisioningUri);
          setMfaStep(2);
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to setup MFA.');
      }
    }
  };

  const handleVerifyMfaCode = async () => {
    setError('');
    try {
      const res = await authService.verifyMfa(otpCode);
      if (res.success) {
        const enableRes = await authService.toggleMfa(true);
        if (enableRes.success) {
          setMfaEnabled(true);
          const codes = Array.from({ length: 8 }, () => Math.random().toString(36).substring(2, 10).toUpperCase());
          setBackupCodes(codes);
          setMfaStep(3);
        }
      } else {
        setError(res.error || 'Verification failed.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid verification code.');
    }
  };

  const handleEmailMfa = async () => {
    setError('');
    setEmailStatus('');
    try {
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

  const handleRevokeSessions = async () => {
    try {
      const res = await authService.revokeSessions();
      if (res.success) {
        fetchSessions();
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error('Failed to revoke sessions:', err);
    }
  };

  const getPwStrength = (p) => {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return { score: s, color: ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'][s], label: ['', 'Weak', 'Fair', 'Good', 'Strong'][s] };
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title"><SettingsIcon size={24} style={{ verticalAlign: 'middle', marginRight: 10 }} />Settings</h1>
          <p className="page-subtitle">Manage your profile, security, and preferences</p>
        </div>
        {saved && <div className="alert alert-success" style={{ padding: '8px 16px' }}><CheckCircle size={14} />Changes saved!</div>}
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 20 }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 24 }}>
        {/* Tabs sidebar */}
        <div style={{ width: 200, flexShrink: 0 }}>
          <div className="card" style={{ padding: '8px 0' }}>
            {[
              { id: 'profile', icon: User, label: 'Profile' },
              { id: 'security', icon: Lock, label: 'Password' },
              { id: 'mfa', icon: Shield, label: 'MFA' },
              { id: 'sessions', icon: Clock, label: 'Sessions' },
              { id: 'appearance', icon: Moon, label: 'Appearance' },
            ].map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                style={{ width: '100%', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, background: activeTab === id ? 'var(--primary-50)' : 'transparent', color: activeTab === id ? 'var(--primary)' : 'var(--text-primary)', fontWeight: activeTab === id ? 600 : 400, fontSize: '0.875rem', border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderLeft: activeTab === id ? '3px solid var(--primary)' : '3px solid transparent', transition: 'all var(--transition)', textAlign: 'left' }}>
                <Icon size={16} />{label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Profile */}
          {activeTab === 'profile' && (
            <div className="card">
              <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Profile Information</h3></div>
              <div className="card-body">
                {/* Avatar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid var(--border-light)' }}>
                  <div className="avatar avatar-xl" style={{ position: 'relative' }}>
                    {user?.avatar}
                    <button style={{ position: 'absolute', bottom: -4, right: -4, width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Camera size={13} color="#fff" />
                    </button>
                  </div>
                  <div>
                    <h3 style={{ marginBottom: 4 }}>{user?.name}</h3>
                    <p style={{ color: 'var(--primary)', fontSize: '0.875rem', fontWeight: 500, textTransform: 'capitalize' }}>{user?.role.replace('_', ' ')}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{user?.department} · {user?.region}</p>
                  </div>
                </div>

                <div className="grid grid-2" style={{ marginBottom: 20 }}>
                  {[
                    { label: 'Full Name', key: 'name' },
                    { label: 'Email Address', key: 'email', type: 'email', disabled: true },
                    { label: 'Phone Number', key: 'phone' },
                    { label: 'Position', key: 'position', disabled: true },
                    { label: 'Location (District/Sector)', key: 'location' },
                  ].map(({ label, key, type = 'text', disabled = false }) => (
                    <div key={key} className="form-group">
                      <label className="form-label">{label}</label>
                      <input className="form-control" type={type} value={profile[key] || ''} onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))} disabled={disabled} />
                    </div>
                  ))}
                  <div className="form-group">
                    <label className="form-label">Region</label>
                    <select className="form-control form-select" value={profile.region || ''} disabled={true}>
                      {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select className="form-control form-select" value={profile.department || ''} disabled={true}>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <button className="btn btn-primary" onClick={handleProfileSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>

                <div style={{ marginTop: 28, padding: 20, background: 'var(--bg-input)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 16 }}>Account History & Metadata</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                    <div>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Join Date</p>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.join_date ? new Date(user.join_date).toLocaleDateString('en-RW', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Last Login</p>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.last_login ? new Date(user.last_login).toLocaleString('en-RW') : 'N/A'}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email Verification</p>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--success)' }}>✓ Verified</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Password */}
          {activeTab === 'security' && (
            <div className="card">
              <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Change Password</h3></div>
              <form onSubmit={handlePasswordUpdate} className="card-body" style={{ maxWidth: 440 }}>
                {[
                  { label: 'Current Password', key: 'current' },
                  { label: 'New Password', key: 'newPw' },
                  { label: 'Confirm New Password', key: 'confirm' },
                ].map(({ label, key }) => (
                  <div key={key} className="form-group">
                    <label className="form-label">{label}</label>
                    <div className="relative" style={{ position: 'relative' }}>
                      <input className="form-control" type={showPw[key] ? 'text' : 'password'} style={{ paddingRight: 40 }}
                        value={pw[key]} onChange={e => setPw(p => ({ ...p, [key]: e.target.value }))} required />
                      <button type="button" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
                        onClick={() => setShowPw(s => ({ ...s, [key]: !s[key] }))}>
                        {showPw[key] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {key === 'newPw' && pw.newPw && (
                      <>
                        <div className="pw-strength" style={{ marginTop: 8 }}>
                          <div className="pw-strength-fill" style={{ width: `${getPwStrength(pw.newPw).score * 25}%`, background: getPwStrength(pw.newPw).color }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', color: getPwStrength(pw.newPw).color }}>{getPwStrength(pw.newPw).label}</span>
                      </>
                    )}
                  </div>
                ))}
                <button type="submit" className="btn btn-primary" disabled={saving || !pw.current || !pw.newPw || pw.newPw !== pw.confirm}>{saving ? 'Updating...' : 'Update Password'}</button>
              </form>
            </div>
          )}

          {/* MFA */}
          {activeTab === 'mfa' && (
            <div className="card">
              <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Multi-Factor Authentication</h3></div>
              <div className="card-body">
                {mfaEnabled ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-lg)', marginBottom: 20 }}>
                      <div>
                        <p style={{ fontWeight: 700, color: 'var(--success)' }}>✓ Two-Factor Authentication Active</p>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Your account is secured with 2FA.</p>
                      </div>
                      <button className="btn btn-secondary btn-sm" onClick={handleToggleMfa} style={{ color: 'var(--danger)', borderColor: 'var(--danger)', background: 'transparent' }} disabled={user?.role === 'administrator'}>
                        Disable 2FA
                      </button>
                    </div>

                    {backupCodes.length > 0 && (
                      <div style={{ padding: 20, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 12, color: 'var(--success)' }}>Backup Recovery Codes</h4>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 16 }}>Save these backup codes in a safe place. They can be used to log in if you lose access to your authenticator app. Each code can only be used once.</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: 700 }}>
                          {backupCodes.map(c => <div key={c} style={{ background: 'var(--bg-card)', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', textAlign: 'center' }}>{c}</div>)}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {mfaStep === 1 && (
                      <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 20 }}>
                          Two-factor authentication adds an extra layer of security to your account by requiring a verification code from an authenticator app when you log in.
                        </p>
                        <button className="btn btn-primary" onClick={handleToggleMfa}>Enable 2FA</button>
                      </div>
                    )}

                    {mfaStep === 2 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div className="alert alert-info" style={{ fontSize: '0.82rem', lineHeight: '1.4' }}>
                          <span>Scan the QR code below using your authenticator app (such as Google Authenticator, Authy, or Microsoft Authenticator) and enter the 6-digit verification code.</span>
                        </div>
                        <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                          <div style={{ background: '#fff', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(mfaQrUri)}`} alt="MFA QR Code" style={{ display: 'block' }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 200 }}>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 8 }}>Or enter this secret key manually:</p>
                            <p style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 700, letterSpacing: 1.5, background: 'var(--bg-input)', padding: '10px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', userSelect: 'all', width: 'fit-content' }}>
                              {mfaSecret}
                            </p>
                          </div>
                        </div>

                        {emailStatus && (
                          <div className="alert alert-success" style={{ marginBottom: 16 }}>
                            <CheckCircle size={16} />{emailStatus}
                          </div>
                        )}

                        <div className="form-group" style={{ maxWidth: 300, marginTop: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <label className="form-label" style={{ margin: 0 }}>Enter 6-Digit Verification Code <span>*</span></label>
                            <button 
                              type="button" 
                              onClick={handleEmailMfa} 
                              style={{ 
                                fontSize: '0.78rem', 
                                background: 'transparent', 
                                border: 'none', 
                                color: 'var(--primary)', 
                                cursor: 'pointer', 
                                fontWeight: 600, 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 4,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--primary-50)'}
                              onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <Mail size={12} />
                              Email me the code
                            </button>
                          </div>
                          <input className="form-control" type="text" maxLength={6} placeholder="000000" style={{ letterSpacing: 6, fontSize: '1.2rem', textAlign: 'center', fontWeight: 700 }}
                            value={otpCode} onChange={e => setOtpCode(e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <button className="btn btn-primary" onClick={handleVerifyMfaCode} disabled={otpCode.length !== 6}>Verify & Enable</button>
                          <button className="btn btn-secondary" onClick={() => setMfaStep(1)}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sessions */}
          {activeTab === 'sessions' && (
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem' }}>Active Sessions</h3>
                {sessions.length > 1 && (
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', cursor: 'pointer' }} onClick={handleRevokeSessions}>
                    Logout other sessions
                  </button>
                )}
              </div>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Browser / Device</th>
                      <th>IP Address</th>
                      <th>Last Activity</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map(s => (
                      <tr key={s.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.8rem', background: s.isCurrent ? 'var(--primary)' : 'var(--border)' }}>
                              <Clock size={16} />
                            </div>
                            <div>
                              <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.browser}</p>
                              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Session ID: {s.id.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{s.ip}</td>
                        <td style={{ fontSize: '0.82rem' }}>{s.lastActivity ? new Date(s.lastActivity).toLocaleString('en-RW') : 'N/A'}</td>
                        <td>
                          {s.isCurrent ? (
                            <span className="badge badge-success">● Current Session</span>
                          ) : (
                            <span className="badge badge-gray">Active</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Appearance */}
          {activeTab === 'appearance' && (
            <div className="card">
              <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Appearance & Theme</h3></div>
              <div className="card-body">
                <p style={{ marginBottom: 16, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Choose how SU Connect looks to you.</p>
                <div className="responsive-grid-2" style={{ gap: 16, maxWidth: 400 }}>
                  {[
                    { val: 'light', icon: Sun, label: 'Light Mode', desc: 'Clean, bright interface' },
                    { val: 'dark', icon: Moon, label: 'Dark Mode', desc: 'Easy on the eyes at night' },
                  ].map(({ val, icon: Icon, label, desc }) => (
                    <div key={val} onClick={() => val !== theme && toggle()}
                      style={{ padding: '20px', borderRadius: 'var(--radius-lg)', border: `2px solid ${theme === val ? 'var(--primary)' : 'var(--border)'}`, background: theme === val ? 'var(--primary-50)' : 'var(--bg-input)', cursor: 'pointer', textAlign: 'center', transition: 'all var(--transition)' }}>
                      <Icon size={28} color={theme === val ? 'var(--primary)' : 'var(--text-muted)'} style={{ marginBottom: 10 }} />
                      <p style={{ fontWeight: 700, fontSize: '0.875rem', color: theme === val ? 'var(--primary)' : 'var(--text-primary)' }}>{label}</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>{desc}</p>
                      {theme === val && <span className="badge badge-primary" style={{ marginTop: 8 }}>Active</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
