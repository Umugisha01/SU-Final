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
      <div className="stat-card md3-metric-card skeleton-loading" style={{ minHeight: '115px' }}>
        <div className="md3-metric-top-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '10px' }} />
          <div className="skeleton" style={{ width: '56px', height: '18px', borderRadius: '12px' }} />
        </div>
        <div style={{ marginTop: '12px' }}>
          <div className="skeleton" style={{ width: '60px', height: '24px', marginBottom: '6px' }} />
          <div className="skeleton" style={{ width: '90px', height: '12px' }} />
        </div>
      </div>
    );
  }

  // Determine trend direction
  const cleanTrend = typeof trend === 'string' ? trend.trim() : '';
  const isUp = trendType === 'up' || cleanTrend.startsWith('+') || (parseFloat(cleanTrend) > 0 && !cleanTrend.startsWith('-'));
  const isDown = trendType === 'down' || cleanTrend.startsWith('-') || parseFloat(cleanTrend) < 0;

  let TrendIcon = Minus;
  if (isUp) TrendIcon = TrendingUp;
  else if (isDown) TrendIcon = TrendingDown;

  // MD3 color accent strip class
  const colorAccentMap = { green: 'mc-green', amber: 'mc-amber', purple: 'mc-purple', blue: 'mc-blue', red: 'mc-red' };
  const mdColor = colorAccentMap[color] || 'mc-green';
  const pillClass = isUp ? 'up' : isDown ? 'down' : 'neutral';

  return (
    <div className={`stat-card md3-metric-card ${mdColor}`} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      <div className="md3-metric-top-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
        <div className={`stat-icon ${color}`}>
          {Icon && <Icon size={20} />}
        </div>
        
        {trend && (
          <div className={`md3-metric-trend-pill ${pillClass}`} title={trend}>
            <TrendIcon size={11} style={{ flexShrink: 0 }} />
            <span>{trend}</span>
          </div>
        )}
      </div>

      <div className="md3-metric-body" style={{ marginTop: '12px' }}>
        <div className="md3-metric-value">
          {value !== undefined && value !== null ? value : '0'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: '4px' }}>
          <span className="stat-label" title={label}>{label}</span>
          {trendLabel && (
            <span className="md3-metric-subtext" title={trendLabel}>{trendLabel}</span>
          )}
        </div>
      </div>
    </div>
  );
}
