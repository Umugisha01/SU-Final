import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function EmptyState({ 
  title = 'No Data Available', 
  description = 'There are no items to display at this time.', 
  icon: Icon = AlertCircle,
  actionText = '',
  onAction = null
}) {
  return (
    <div className="empty-state" style={{ padding: '48px 24px', borderRadius: 'var(--radius-lg)', border: '1.5px dashed var(--border)', background: 'var(--bg-card)' }}>
      <div className="empty-state-icon" style={{ marginBottom: '16px', color: 'var(--text-light)' }}>
        <Icon size={48} />
      </div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>{title}</h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '320px', margin: '0 auto 16px auto', lineHeight: 1.5 }}>
        {description}
      </p>
      {actionText && onAction && (
        <button className="btn btn-primary" onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
}
