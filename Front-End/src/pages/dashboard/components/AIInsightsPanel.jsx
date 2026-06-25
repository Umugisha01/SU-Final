import React, { useState } from 'react';
import { Sparkles, Send, HelpCircle, Loader, MessageSquare } from 'lucide-react';

export default function AIInsightsPanel({ insights = [] }) {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleQuerySubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setAnswer(null);

    // Dynamic mock intelligence engine that answers based on query keywords
    setTimeout(() => {
      const q = query.toLowerCase();
      let responseText = '';

      if (q.includes('kigali')) {
        responseText = "Kigali City is our highest performing hub, contributing 42% of youth outreach sessions. Bible Study programs are growing at 34% MoM. Recommendation: Allocate 15% more materials here to sustain this growth.";
      } else if (q.includes('attention') || q.includes('underreport') || q.includes('warning') || q.includes('low')) {
        responseText = "Southern Province and Northern Province are currently flagged as underreporting. Southern Province has reported only 1 outreach session in 30 days. Action recommended: Schedule an audit or check-in call with the Southern Province coordinator.";
      } else if (q.includes('grow') || q.includes('perform') || q.includes('best')) {
        responseText = "Kigali City and Eastern Province are experiencing the strongest performance growth. Eastern Province has logged +20% more participants due to active support from community leaders.";
      } else if (q.includes('support') || q.includes('equipment')) {
        responseText = "AI analysis indicates support request resolution is averaging 4.2 days. Most requests are for Material/Equipment (bible guides and transport allowence). Western Province has 3 unresolved requests pending.";
      } else {
        responseText = "Based on current report logs, overall outreach participation is up 12% nationwide. Registration approvals are healthy, but Southern Province requires attention to re-engage field officers.";
      }

      setAnswer(responseText);
      setLoading(false);
    }, 900);
  };

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="var(--purple)" style={{ animation: 'bounce 2s infinite' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Proactive AI Insights</h3>
        </div>
        <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>SU-Connect AI v2</span>
      </div>

      <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
        {/* Insight items list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {insights.map((insight, idx) => {
            const isWarning = insight.type === 'warning' || insight.title?.toLowerCase().includes('warning') || insight.title?.toLowerCase().includes('underreporting');
            return (
              <div 
                key={idx} 
                className="slide-in"
                style={{ 
                  padding: '12px 14px', 
                  borderRadius: 'var(--radius)', 
                  background: isWarning ? 'rgba(245, 158, 11, 0.04)' : 'rgba(34, 197, 94, 0.04)', 
                  borderLeft: `3px solid ${isWarning ? 'var(--warning)' : 'var(--success)'}`,
                  fontSize: '0.82rem'
                }}
              >
                <strong style={{ display: 'block', color: 'var(--text-primary)', marginBottom: '3px' }}>
                  {insight.title || (isWarning ? '⚠️ System Alert' : '🌟 Performance Surge')}
                </strong>
                <span style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>{insight.text || insight.message}</span>
              </div>
            );
          })}
        </div>

        {/* AI Query Response Box */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', background: 'var(--bg-input)', borderRadius: 'var(--radius)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <Loader size={14} className="spin-animation" style={{ animation: 'spin 1s linear infinite' }} />
            <span>Analyzing report databases and generating insight...</span>
          </div>
        )}

        {answer && (
          <div className="slide-in" style={{ padding: '14px', borderRadius: 'var(--radius)', background: 'var(--primary-50)', border: '1px solid var(--primary-100)', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <MessageSquare size={14} color="var(--primary-dark)" />
              <strong style={{ fontSize: '0.78rem', color: 'var(--primary-dark)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                AI Analysis Answer
              </strong>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.4, margin: 0 }}>
              {answer}
            </p>
          </div>
        )}

        {/* Query Input Box */}
        <form onSubmit={handleQuerySubmit} style={{ marginTop: 'auto', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <HelpCircle size={14} style={{ position: 'absolute', left: 12, color: 'var(--text-light)' }} />
            <input 
              type="text" 
              className="form-control"
              placeholder="Ask SU-AI about trends (e.g. Kigali, underreporting)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ paddingLeft: '34px', paddingRight: '44px', fontSize: '0.8rem', height: '38px', borderRadius: 'var(--radius-full)' }}
            />
            <button 
              type="submit" 
              className="btn btn-primary btn-icon"
              disabled={loading || !query.trim()}
              style={{ 
                position: 'absolute', 
                right: '3px', 
                width: '32px', 
                height: '32px', 
                padding: 0, 
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Send size={12} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
