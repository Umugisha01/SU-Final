import React, { useState } from 'react';
import { MapPin, ArrowUpRight, TrendingUp } from 'lucide-react';

export default function RegionalMap({ regionalPerformance }) {
  const [activeRegion, setActiveRegion] = useState(null);

  // Fallback data in case the API doesn't return anything or is empty
  const defaultPerformance = [
    { region: 'Kigali City', reports: 0, participants: 0, growth: '0%', colorCode: 'average' },
    { region: 'Eastern Province', reports: 0, participants: 0, growth: '0%', colorCode: 'average' },
    { region: 'Northern Province', reports: 0, participants: 0, growth: '0%', colorCode: 'average' },
    { region: 'Western Province', reports: 0, participants: 0, growth: '0%', colorCode: 'average' },
    { region: 'Southern Province', reports: 0, participants: 0, growth: '0%', colorCode: 'average' },
  ];

  const perfData = regionalPerformance && regionalPerformance.length > 0
    ? regionalPerformance
    : defaultPerformance;

  // Find a specific region's data
  const getRegionData = (name) => {
    return perfData.find(p => p.region.toLowerCase().includes(name.toLowerCase())) || {
      region: name,
      reports: 0,
      participants: 0,
      growth: '0%',
      colorCode: 'average'
    };
  };

  const getRegionColor = (colorCode) => {
    switch (colorCode) {
      case 'excellent':
        return 'var(--primary)';
      case 'good':
        return 'var(--primary-light)';
      case 'average':
        return 'var(--info)';
      case 'needs-attention':
      default:
        return 'var(--warning)';
    }
  };

  // Styled SVG map layout of Rwanda with five coordinates
  // Width: 400, Height: 300
  const regions = [
    {
      id: 'northern',
      name: 'Northern Province',
      path: 'M 100,50 L 300,50 L 260,130 L 150,130 Z', // Top middle
      textX: 180,
      textY: 85,
    },
    {
      id: 'western',
      name: 'Western Province',
      path: 'M 40,80 L 150,130 L 120,250 L 40,200 Z', // Left side
      textX: 80,
      textY: 160,
    },
    {
      id: 'southern',
      name: 'Southern Province',
      path: 'M 150,130 L 250,130 L 280,240 L 190,260 L 120,250 Z', // Bottom left-middle
      textX: 190,
      textY: 200,
    },
    {
      id: 'eastern',
      name: 'Eastern Province',
      path: 'M 300,50 L 370,80 L 370,220 L 280,240 L 250,130 L 260,130 Z', // Right side
      textX: 310,
      textY: 150,
    },
    {
      id: 'kigali',
      name: 'Kigali City',
      path: 'M 190,120 L 260,120 L 250,160 L 190,160 Z', // Center
      textX: 225,
      textY: 145,
      isCapital: true
    }
  ];

  const highlightedRegion = activeRegion ? getRegionData(activeRegion) : null;

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={18} color="var(--primary)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>National Distribution Map</h3>
        </div>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Hover provinces to inspect outreach KPIs</span>
      </div>

      <div className="card-body" style={{ display: 'flex', gap: '20px', flexDirection: 'column', padding: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', justifyContent: 'center' }}>
          {/* SVG Map Container */}
          <div style={{ flex: '1 1 300px', maxWidth: '400px', position: 'relative' }}>
            <svg viewBox="0 0 400 300" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
              {regions.map(r => {
                const data = getRegionData(r.name);
                const isHovered = activeRegion === r.name;
                const baseColor = getRegionColor(data.colorCode);
                return (
                  <g key={r.id}>
                    <path
                      d={r.path}
                      fill={baseColor}
                      fillOpacity={isHovered ? 0.95 : 0.75}
                      stroke="var(--bg-card)"
                      strokeWidth={isHovered ? 3 : 1.5}
                      style={{ cursor: 'pointer', transition: 'all 0.2s ease-in-out' }}
                      onMouseEnter={() => setActiveRegion(r.name)}
                      onMouseLeave={() => setActiveRegion(null)}
                    />
                    <text
                      x={r.textX}
                      y={r.textY}
                      fill="#fff"
                      fontSize={r.isCapital ? '9px' : '10px'}
                      fontWeight="bold"
                      textAnchor="middle"
                      style={{ pointerEvents: 'none', fillShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                    >
                      {r.isCapital ? '★ Kigali' : r.name.replace(' Province', '')}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* KPI Panel on the right */}
          <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
            {highlightedRegion ? (
              <div className="slide-in" style={{ padding: '16px', borderRadius: 'var(--radius)', background: 'var(--bg-input)', border: `1.5px solid ${getRegionColor(highlightedRegion.colorCode)}` }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: getRegionColor(highlightedRegion.colorCode) }} />
                  {highlightedRegion.region}
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Submitted Reports:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{highlightedRegion.reports}</strong>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Outreach Participants:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{highlightedRegion.participants.toLocaleString()}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', borderTop: '1px solid var(--border-light)', paddingTop: '8px', marginTop: '2px' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <TrendingUp size={12} color="var(--primary)" /> Growth (MoM):
                    </span>
                    <strong style={{ color: highlightedRegion.growth.startsWith('-') ? 'var(--danger)' : 'var(--success)' }}>
                      {highlightedRegion.growth}
                    </strong>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '24px 16px', borderRadius: 'var(--radius)', border: '1px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', height: '100%', minHeight: '140px' }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                  Hover any region on the map to visualize detailed activity breakdown and performance analytics.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Legend Map */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '12px', marginTop: '8px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)' }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--primary)' }} />
              High Activity (&ge;40)
            </span>
            <span style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)' }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--primary-light)' }} />
              Good (30 - 39)
            </span>
            <span style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)' }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--info)' }} />
              Average (20 - 29)
            </span>
            <span style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)' }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--warning)' }} />
              Attention Required (&lt;20)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
