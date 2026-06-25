import React from 'react';

export default function LoadingSkeleton({ type = 'card', count = 1 }) {
  const renderSkeleton = (index) => {
    switch (type) {
      case 'card':
        return (
          <div key={index} className="stat-card" style={{ minHeight: '135px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: 'var(--radius)' }} />
              <div className="skeleton" style={{ width: '60px', height: '16px' }} />
            </div>
            <div style={{ marginTop: '16px' }}>
              <div className="skeleton" style={{ width: '100px', height: '32px', marginBottom: '8px' }} />
              <div className="skeleton" style={{ width: '150px', height: '14px' }} />
            </div>
          </div>
        );
      case 'table':
        return (
          <div key={index} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="skeleton" style={{ flex: 1, height: '20px' }} />
              <div className="skeleton" style={{ flex: 2, height: '20px' }} />
              <div className="skeleton" style={{ flex: 1, height: '20px' }} />
              <div className="skeleton" style={{ flex: 1, height: '20px' }} />
            </div>
            <div className="skeleton" style={{ height: '1px', width: '100%', opacity: 0.5 }} />
          </div>
        );
      case 'list':
        return (
          <div key={index} style={{ display: 'flex', gap: '16px', padding: '12px 0', alignItems: 'center' }}>
            <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div className="skeleton" style={{ width: '40%', height: '14px' }} />
              <div className="skeleton" style={{ width: '80%', height: '12px' }} />
            </div>
            <div className="skeleton" style={{ width: '60px', height: '12px' }} />
          </div>
        );
      case 'chart':
        return (
          <div key={index} className="card" style={{ padding: '24px', minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div className="skeleton" style={{ width: '150px', height: '20px' }} />
              <div className="skeleton" style={{ width: '100px', height: '30px', borderRadius: 'var(--radius)' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', height: '180px', padding: '0 10px' }}>
              <div className="skeleton" style={{ flex: 1, height: '40%' }} />
              <div className="skeleton" style={{ flex: 1, height: '70%' }} />
              <div className="skeleton" style={{ flex: 1, height: '55%' }} />
              <div className="skeleton" style={{ flex: 1, height: '90%' }} />
              <div className="skeleton" style={{ flex: 1, height: '30%' }} />
              <div className="skeleton" style={{ flex: 1, height: '65%' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
              <div className="skeleton" style={{ width: '40px', height: '12px' }} />
              <div className="skeleton" style={{ width: '40px', height: '12px' }} />
              <div className="skeleton" style={{ width: '40px', height: '12px' }} />
              <div className="skeleton" style={{ width: '40px', height: '12px' }} />
              <div className="skeleton" style={{ width: '40px', height: '12px' }} />
              <div className="skeleton" style={{ width: '40px', height: '12px' }} />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const skeletons = Array.from({ length: count }, (_, i) => renderSkeleton(i));

  if (type === 'card') {
    return <div className="grid grid-4">{skeletons}</div>;
  }
  return <div style={{ width: '100%' }}>{skeletons}</div>;
}
