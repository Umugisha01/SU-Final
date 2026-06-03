import { useState } from 'react';
import { Settings, User, Lock, Bell, Shield, Moon, Sun, Camera, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { REGIONS, DEPARTMENTS } from '../../data/mockData';

const NOTIF_PREFS_DEFAULT = { email: true, sms: false, inApp: true, deadlineReminders: true, reportUpdates: true, supportUpdates: true, prayerResponses: false };

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '', phone: '+250 788 000 000', region: user?.region || '', department: user?.department || '', position: 'Field Coordinator' });
  const [pw, setPw] = useState({ current: '', newPw: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });
  const [notifPrefs, setNotifPrefs] = useState(NOTIF_PREFS_DEFAULT);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaStep, setMfaStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
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
          <h1 className="page-title"><Settings size={24} style={{ verticalAlign: 'middle', marginRight: 10 }} />Settings</h1>
          <p className="page-subtitle">Manage your profile, security, and preferences</p>
        </div>
        {saved && <div className="alert alert-success" style={{ padding: '8px 16px' }}><CheckCircle size={14} />Changes saved!</div>}
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        {/* Tabs sidebar */}
        <div style={{ width: 200, flexShrink: 0 }}>
          <div className="card" style={{ padding: '8px 0' }}>
            {[
              { id: 'profile', icon: User, label: 'Profile' },
              { id: 'security', icon: Lock, label: 'Password' },
              { id: 'mfa', icon: Shield, label: 'MFA' },
              { id: 'notifications', icon: Bell, label: 'Notifications' },
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
                    <button style={{ position: 'absolute', bottom: -4, right: -4, width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', border: '2px solid var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none' }}>
                      <Camera size={13} color="#fff" />
                    </button>
                  </div>
                  <div>
                    <h3 style={{ marginBottom: 4 }}>{user?.name}</h3>
                    <p style={{ color: 'var(--primary)', fontSize: '0.875rem', fontWeight: 500, textTransform: 'capitalize' }}>{user?.role}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{user?.department} · {user?.region}</p>
                  </div>
                </div>

                <div className="grid grid-2">
                  {[
                    { label: 'Full Name', key: 'name' },
                    { label: 'Email Address', key: 'email', type: 'email' },
                    { label: 'Phone Number', key: 'phone' },
                    { label: 'Position', key: 'position' },
                  ].map(({ label, key, type = 'text' }) => (
                    <div key={key} className="form-group">
                      <label className="form-label">{label}</label>
                      <input className="form-control" type={type} value={profile[key]} onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))} />
                    </div>
                  ))}
                  <div className="form-group">
                    <label className="form-label">Region</label>
                    <select className="form-control form-select" value={profile.region} onChange={e => setProfile(p => ({ ...p, region: e.target.value }))}>
                      {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select className="form-control form-select" value={profile.department} onChange={e => setProfile(p => ({ ...p, department: e.target.value }))}>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </div>
          )}

          {/* Password */}
          {activeTab === 'security' && (
            <div className="card">
              <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Change Password</h3></div>
              <div className="card-body" style={{ maxWidth: 440 }}>
                {[
                  { label: 'Current Password', key: 'current' },
                  { label: 'New Password', key: 'newPw' },
                  { label: 'Confirm New Password', key: 'confirm' },
                ].map(({ label, key }) => (
                  <div key={key} className="form-group">
                    <label className="form-label">{label}</label>
                    <div className="relative">
                      <input className="form-control" type={showPw[key] ? 'text' : 'password'} style={{ paddingRight: 40 }}
                        value={pw[key]} onChange={e => setPw(p => ({ ...p, [key]: e.target.value }))} />
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
                <button className="btn btn-primary" onClick={save} disabled={!pw.current || !pw.newPw || pw.newPw !== pw.confirm}>Update Password</button>
              </div>
            </div>
          )}

          {/* MFA */}
          {activeTab === 'mfa' && (
            <div className="card">
              <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Multi-Factor Authentication</h3></div>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-lg)', marginBottom: 20 }}>
                  <div>
                    <p style={{ fontWeight: 700 }}>Two-Factor Authentication</p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{mfaEnabled ? 'Your account is secured with 2FA.' : 'Add an extra layer of security to your account.'}</p>
                  </div>
                  <div className={`toggle ${mfaEnabled ? 'on' : ''}`} onClick={() => setMfaEnabled(e => !e)} style={{ transform: 'scale(1.2)' }}>
                    <div className="toggle-thumb" />
                  </div>
                </div>

                {!mfaEnabled && (
                  <div className="alert alert-warning">
                    <Shield size={16} />
                    <span>Enable 2FA for enhanced account security. Administrators are required to use multi-factor authentication.</span>
                  </div>
                )}

                {mfaEnabled && (
                  <div className="alert alert-success">
                    <CheckCircle size={16} />
                    <span>2FA is enabled. Your account is protected with authenticator app verification.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className="card">
              <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Notification Preferences</h3></div>
              <div className="card-body">
                <p style={{ fontWeight: 700, marginBottom: 12 }}>Delivery Channels</p>
                {[
                  { key: 'inApp', label: 'In-App', desc: 'Notifications within the platform' },
                  { key: 'email', label: 'Email', desc: 'Sent to your registered email' },
                  { key: 'sms', label: 'SMS', desc: 'Text messages to your phone' },
                ].map(({ key, label, desc }) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
                    <div><p style={{ fontWeight: 500 }}>{label}</p><p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{desc}</p></div>
                    <div className={`toggle ${notifPrefs[key] ? 'on' : ''}`} onClick={() => setNotifPrefs(p => ({ ...p, [key]: !p[key] }))}><div className="toggle-thumb" /></div>
                  </div>
                ))}

                <p style={{ fontWeight: 700, marginTop: 20, marginBottom: 12 }}>Notification Types</p>
                {[
                  { key: 'reportUpdates', label: 'Report Updates' },
                  { key: 'deadlineReminders', label: 'Deadline Reminders' },
                  { key: 'supportUpdates', label: 'Support Request Updates' },
                  { key: 'prayerResponses', label: 'Prayer Responses' },
                ].map(({ key, label }) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                    <span style={{ fontSize: '0.875rem' }}>{label}</span>
                    <div className={`toggle ${notifPrefs[key] ? 'on' : ''}`} onClick={() => setNotifPrefs(p => ({ ...p, [key]: !p[key] }))}><div className="toggle-thumb" /></div>
                  </div>
                ))}

                <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={save}>Save Preferences</button>
              </div>
            </div>
          )}

          {/* Appearance */}
          {activeTab === 'appearance' && (
            <div className="card">
              <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Appearance & Theme</h3></div>
              <div className="card-body">
                <p style={{ marginBottom: 16, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Choose how SU Connect looks to you.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 400 }}>
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
