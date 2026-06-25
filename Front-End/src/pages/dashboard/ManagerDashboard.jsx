import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Users, Clock, CheckCircle, 
  MapPin, Eye, FileSpreadsheet, PlusCircle, Heart, AlertTriangle
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { dashboardService } from '../../services/api';
import toast from 'react-hot-toast';
import MetricCard from './components/MetricCard';
import LoadingSkeleton from './components/LoadingSkeleton';
import EmptyState from './components/EmptyState';
import RegionalMap from './components/RegionalMap';
import AIInsightsPanel from './components/AIInsightsPanel';

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [insightsData, setInsightsData] = useState([]);

  const loadManagerData = async () => {
    try {
      setLoading(true);
      const [managerRes, aiRes] = await Promise.all([
        dashboardService.getManagerData(),
        dashboardService.getAIInsights()
      ]);
      if (managerRes.success) setData(managerRes);
      if (aiRes.success) setInsightsData(aiRes.insights);
    } catch (err) {
      console.error('Failed to load Manager dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadManagerData();
  }, []);

  const handleRegenerateAI = async () => {
    try {
      const aiRes = await dashboardService.getAIInsights();
      if (aiRes.success) {
        setInsightsData(aiRes.insights);
      }
    } catch (err) {
      console.error('Failed to regenerate AI insights');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <LoadingSkeleton type="card" count={4} />
        <div className="grid grid-2">
          <LoadingSkeleton type="chart" count={1} />
          <LoadingSkeleton type="list" count={4} />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <EmptyState 
        title="Dashboard Error" 
        description="Could not load Manager metrics. Please check network logs." 
        actionText="Retry"
        onAction={loadManagerData}
      />
    );
  }

  const { metrics, regional_performance, last_consolidated, trends } = data;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Global metrics grid */}
      <div className="grid grid-4">
        <MetricCard 
          value={metrics.reports_submitted?.toLocaleString()}
          label="TOTAL REACH"
          icon={Users}
          color="blue"
          trend={metrics.parts_trend}
          trendLabel="Participants this quarter"
        />

        <MetricCard 
          value={metrics.pending_review}
          label="PENDING NATIONWIDE"
          icon={Clock}
          color="amber"
          trend={metrics.pending_review > 0 ? `${metrics.pending_review} pending` : 'All caught up'}
          trendType={metrics.pending_review > 0 ? 'down' : 'up'}
          trendLabel="Reports need review"
        />

        <MetricCard 
          value={`${metrics.total_participants}%`}
          label="APPROVAL RATE"
          icon={CheckCircle}
          color="green"
          trend={metrics.reports_trend}
          trendLabel="This month"
        />

        <MetricCard 
          value={metrics.regions_covered}
          label="TOTAL PRAYERS"
          icon={Heart}
          color="purple"
          trend={metrics.regions_trend}
          trendLabel="Requests active"
        />
      </div>

      {/* Monthly Submission trends Recharts graph */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>📈 MONTHLY REPORT SUBMISSIONS — 2026</h3>
        </div>
        <div className="card-body" style={{ flex: 1, display: 'flex', alignItems: 'center', paddingTop: '16px' }}>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trends} margin={{ left: -20 }}>
              <defs>
                <linearGradient id="colorSubmitted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--success)" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="submitted" stroke="var(--primary)" fillOpacity={1} fill="url(#colorSubmitted)" name="Submitted Reports" />
              <Area type="monotone" dataKey="approved" stroke="var(--success)" fillOpacity={1} fill="url(#colorApproved)" name="Approved Reports" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Map, Regional breakdown & AI panel */}
      <div className="grid grid-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Regional Breakdown progress list */}
        <div className="card">
          <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>🗺️ REGIONAL BREAKDOWN</h3>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '16px' }}>
            {regional_performance && regional_performance.map((rp, idx) => {
              const maxVal = Math.max(...regional_performance.map(r => r.participants)) || 1;
              const rate = Math.round((rp.participants / maxVal) * 100);
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{rp.region}</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{rp.participants?.toLocaleString()} reached</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1, height: '8px', background: 'var(--border-light)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${rate}%`, height: '100%', background: 'var(--primary)', borderRadius: '4px' }} />
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-light)', minWidth: '60px', textAlign: 'right' }}>
                      {rp.reports} reports ({rp.growth})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI insights panel */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>🤖 AI INSIGHTS — EXECUTIVE SUMMARY</h3>
            </div>
            <div className="card-body" style={{ paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {insightsData && insightsData.map((ins, idx) => (
                <div 
                  key={idx}
                  className={`ai-insight-item ${ins.type === 'positive' ? 'positive' : 'attention'}`}
                >
                  {ins.text || ins.message}
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: '16px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)' }}>
            <button className="btn btn-secondary btn-sm" onClick={handleRegenerateAI}>
              Regenerate
            </button>
          </div>
        </div>
      </div>

      {/* Urgent Attention Alerts list */}
      <div className="card">
        <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--danger)' }}>⚠️ URGENT — Needs Attention</h3>
        </div>
        <div className="card-body" style={{ paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {data.urgent_alerts && data.urgent_alerts.length > 0 ? (
            data.urgent_alerts.map((alert, idx) => (
              <div 
                key={idx} 
                className={`dashboard-alert-item ${alert.type === 'danger' ? 'danger' : alert.type === 'warning' ? 'warning' : 'success'}`}
              >
                {alert.message}
              </div>
            ))
          ) : (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', margin: '10px 0' }}>
              All systems active. No pending issues.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
