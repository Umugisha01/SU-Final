import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function MetricCard({ 
  value, 
  label, 
  icon: Icon, 
  color = 'green', 
  trend = '', 
  trendType = '', 
  trendLabel = '', 
  loading = false 
}) {
  if (loading) {
    return (
      <div className="stat-card skeleton-loading" style={{ minHeight: '135px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: 'var(--radius)' }} />
          <div className="skeleton" style={{ width: '60px', height: '18px' }} />
        </div>
        <div style={{ marginTop: '12px' }}>
          <div className="skeleton" style={{ width: '80px', height: '32px', marginBottom: '8px' }} />
          <div className="skeleton" style={{ width: '120px', height: '14px' }} />
        </div>
      </div>
    );
  }

  // Determine trend status if trendType is not explicitly provided
  let trendClass = 'stat-change';
  let TrendIcon = Minus;
  
  const cleanTrend = typeof trend === 'string' ? trend.trim() : '';
  const isUp = trendType === 'up' || cleanTrend.startsWith('+') || (parseFloat(cleanTrend) > 0 && !cleanTrend.startsWith('-'));
  const isDown = trendType === 'down' || cleanTrend.startsWith('-') || parseFloat(cleanTrend) < 0;

  if (isUp) {
    trendClass += ' up';
    TrendIcon = TrendingUp;
  } else if (isDown) {
    trendClass += ' down';
    TrendIcon = TrendingDown;
  }

  return (
    <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className={`stat-icon ${color}`}>
          {Icon && <Icon size={22} />}
        </div>
        
        {trend && (
          <div className={trendClass} style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.78rem', fontWeight: 600 }}>
            <TrendIcon size={12} />
            <span>{trend}</span>
          </div>
        )}
      </div>

      <div style={{ marginTop: '16px' }}>
        <div className="stat-value" style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          {value !== undefined && value !== null ? value : '0'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: '2px' }}>
          <span className="stat-label" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
          {trendLabel && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '2px' }}>{trendLabel}</span>
          )}
        </div>
      </div>
    </div>
  );
}
