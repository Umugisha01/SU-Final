import React from 'react';
import { ShieldAlert, Server, Database, HardDrive, Cpu, Activity, RefreshCw } from 'lucide-react';

export default function SystemHealth({ health, onRefresh, loading = false }) {
  if (!health) return null;

  const getStatusBadge = (statusVal) => {
    const norm = String(statusVal).toLowerCase();
    if (norm === 'online' || norm === 'ok' || norm === 'active' || norm === 'good') {
      return <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>Active</span>;
    } else if (norm === 'warning' || norm === 'degraded' || norm === 'slow') {
      return <span className="badge badge-warning" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>Degraded</span>;
    } else {
      return <span className="badge badge-danger" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>Offline</span>;
    }
  };

  const getStatusColor = (statusVal) => {
    const norm = String(statusVal).toLowerCase();
    if (norm === 'online' || norm === 'ok' || norm === 'active' || norm === 'good') {
      return '#22c55e'; // Green
    } else if (norm === 'warning' || norm === 'degraded' || norm === 'slow') {
      return '#f59e0b'; // Yellow
    } else {
      return '#ef4444'; // Red
    }
  };

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} color="var(--primary)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>System Health & Infrastructure</h3>
        </div>
        {onRefresh && (
          <button 
            onClick={onRefresh} 
            className="btn btn-secondary btn-icon" 
            disabled={loading}
            style={{ padding: '6px', borderRadius: '50%' }}
            title="Refresh Health Data"
          >
            <RefreshCw size={14} className={loading ? 'spin-animation' : ''} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        )}
      </div>
      
      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '16px' }}>
        {/* Services Status */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {/* API Node */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius)', border: '1px solid var(--border-light)' }}>
            <div style={{ position: 'relative' }}>
              <Server size={20} color="var(--text-secondary)" />
              <span style={{ position: 'absolute', bottom: -2, right: -2, width: 8, height: 8, borderRadius: '50%', backgroundColor: getStatusColor(health.apiStatus) }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, margin: 0 }}>API Server</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-light)', margin: 0, textTransform: 'capitalize' }}>Response: Nominal</p>
            </div>
            {getStatusBadge(health.apiStatus)}
          </div>

          {/* Database */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius)', border: '1px solid var(--border-light)' }}>
            <div style={{ position: 'relative' }}>
              <Database size={20} color="var(--text-secondary)" />
              <span style={{ position: 'absolute', bottom: -2, right: -2, width: 8, height: 8, borderRadius: '50%', backgroundColor: getStatusColor(health.databaseStatus) }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, margin: 0 }}>Database (PSQL)</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-light)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {health.databaseStorage || 'Connected'}
              </p>
            </div>
            {getStatusBadge(health.databaseStatus)}
          </div>

          {/* Redis Cache */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius)', border: '1px solid var(--border-light)' }}>
            <div style={{ position: 'relative' }}>
              <Cpu size={20} color="var(--text-secondary)" />
              <span style={{ position: 'absolute', bottom: -2, right: -2, width: 8, height: 8, borderRadius: '50%', backgroundColor: getStatusColor(health.redisStatus) }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, margin: 0 }}>Redis Memory</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-light)', margin: 0 }}>
                {health.redisMemory || 'Ok'}
              </p>
            </div>
            {getStatusBadge(health.redisStatus)}
          </div>

          {/* Celery */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius)', border: '1px solid var(--border-light)' }}>
            <div style={{ position: 'relative' }}>
              <HardDrive size={20} color="var(--text-secondary)" />
              <span style={{ position: 'absolute', bottom: -2, right: -2, width: 8, height: 8, borderRadius: '50%', backgroundColor: getStatusColor(health.celeryStatus) }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, margin: 0 }}>Celery Workers</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-light)', margin: 0 }}>
                Queue size: {health.celeryTasks || 0}
              </p>
            </div>
            {getStatusBadge(health.celeryStatus)}
          </div>
        </div>

        {/* Security / Logs telemetry */}
        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
            Security telemetry (Last 24h)
          </h4>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(239, 68, 68, 0.04)', borderRadius: 'var(--radius)', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={16} color="var(--danger)" />
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Failed Login Blockages</span>
            </div>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: health.failedLogins24h > 5 ? 'var(--danger)' : 'var(--text-primary)' }}>
              {health.failedLogins24h || 0}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(245, 158, 11, 0.04)', borderRadius: 'var(--radius)', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={16} color="var(--warning)" />
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Critical System Warnings</span>
            </div>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: health.criticalAlerts24h > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>
              {health.criticalAlerts24h || 0}
            </span>
          </div>
        </div>

        {/* Uptime footer */}
        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-light)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
          <span>System Uptime</span>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{health.uptime || 'N/A'}</span>
        </div>
      </div>
    </div>
  );
}
