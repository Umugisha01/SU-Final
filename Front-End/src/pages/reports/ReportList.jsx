import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Filter, FileText, Eye, Edit, CheckCircle, Clock, 
  AlertCircle, RotateCcw, Download, Trash2, MapPin, Calendar, 
  Users, SlidersHorizontal, ChevronDown, ChevronUp, CheckSquare, Square, X 
} from 'lucide-react';
import { ACTIVITY_TYPES, REGIONS } from '../../data/mockData';
import { useAuth } from '../../contexts/AuthContext';
import { reportService } from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  approved: { label: 'Approved ★', cls: 'badge-success', icon: CheckCircle },
  submitted: { label: 'Submitted', cls: 'badge-info', icon: Clock },
  submitted_to_coordinator: { label: 'Submitted', cls: 'badge-info', icon: Clock },
  submitted_to_manager: { label: 'Submitted ★', cls: 'badge-info', icon: Clock },
  draft: { label: 'Draft', cls: 'badge-gray', icon: Edit },
  returned: { label: 'Returned', cls: 'badge-danger', icon: RotateCcw },
  returned_by_coordinator: { label: 'Returned by Coordinator', cls: 'badge-danger', icon: RotateCcw },
  returned_by_manager: { label: 'Returned by Manager ★', cls: 'badge-danger', icon: RotateCcw },
};

const UNIQUE_STATUSES = [];
const seenLabels = new Set();
for (const [k, v] of Object.entries(STATUS_CONFIG)) {
  if (!seenLabels.has(v.label)) {
    seenLabels.add(v.label);
    UNIQUE_STATUSES.push({ key: k, ...v });
  }
}

export default function ReportList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterRegion, setFilterRegion] = useState(user?.role === 'regional_coordinator' ? user.region : 'all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [view, setView] = useState('table');
  const [selectedReportIds, setSelectedReportIds] = useState([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const activeFilterCount = (filterStatus !== 'all' ? 1 : 0) +
    (filterType !== 'all' ? 1 : 0) +
    (filterRegion !== 'all' ? 1 : 0) +
    (startDate || endDate ? 1 : 0);

  const handleToggleSelectReport = (id) => {
    setSelectedReportIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleShareSelected = async () => {
    if (selectedReportIds.length === 0) return;
    try {
      const res = await reportService.share(selectedReportIds);
      if (res.success) {
        toast.success(res.message || `Successfully shared ${selectedReportIds.length} reports.`);
        setSelectedReportIds([]);
        reportService.list()
          .then(setReports)
          .catch(console.error);
      } else {
        toast.error(res.error || "Failed to share reports.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "An error occurred while sharing reports.");
    }
  };

  useEffect(() => {
    reportService.list()
      .then(data => {
        setReports(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching reports:', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (user?.role === 'regional_coordinator' && user?.region) {
      setFilterRegion(user.region);
    }
  }, [user]);

  const filtered = reports.filter(r => {
    if (search) {
      const s = search.toLowerCase();
      const matchTitle = (r.title || '').toLowerCase().includes(s);
      const matchSubmitter = (r.submittedBy || '').toLowerCase().includes(s);
      const matchRegion = (r.region || '').toLowerCase().includes(s);
      const matchType = (r.type || '').toLowerCase().includes(s);
      const matchDept = (r.department || '').toLowerCase().includes(s);
      const matchLocation = (r.location || '').toLowerCase().includes(s);
      const matchDesc = (r.description || '').toLowerCase().includes(s);
      if (!matchTitle && !matchSubmitter && !matchRegion && !matchType && !matchDept && !matchLocation && !matchDesc) return false;
    }
    if (filterStatus !== 'all') {
      const filterLabel = STATUS_CONFIG[filterStatus]?.label;
      const reportLabel = STATUS_CONFIG[r.status]?.label || r.status;
      if (filterLabel !== reportLabel) return false;
    }
    if (filterType !== 'all' && r.type !== filterType) return false;
    if (filterRegion !== 'all' && r.region !== filterRegion) return false;
    
    // Date range filtering
    if (startDate && r.date < startDate) return false;
    if (endDate && r.date > endDate) return false;

    if (user?.role === 'field_officer') {
      const isRecipient = r.recipients && r.recipients.some(recip => recip.id === user.id);
      return r.submittedBy === user.name || isRecipient;
    }
    if (user?.role === 'regional_coordinator') {
      const isRecipient = r.recipients && r.recipients.some(recip => recip.id === user.id);
      return r.region === user.region || isRecipient;
    }
    return true;
  });

  const handleDeleteReport = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete the report "${title}"?`)) return;
    try {
      const res = await reportService.delete(id);
      if (res.success) {
        toast.success(res.message || "Report deleted successfully");
        setReports(prev => prev.filter(r => r.id !== id));
      } else {
        toast.error(res.error || "Failed to delete report");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "An error occurred while deleting the report");
    }
  };

  const handleExportExcel = () => {
    if (!filtered || filtered.length === 0) {
      toast.error("No reports data available to export");
      return;
    }
    const headers = ['Report Title', 'Type', 'Region', 'Activity Date', 'Participants', 'Submitted By', 'Status'];
    const rows = filtered.map(r => [
      r.title,
      r.type,
      r.region,
      r.date || 'N/A',
      r.participants || 0,
      r.submittedBy || 'Unknown',
      r.status
    ]);

    const csvHeader = headers.join(',') + '\n';
    const csvRows = rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
    
    const blob = new Blob(["\uFEFF", csvHeader, csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `su_connect_activity_reports_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Excel sheet exported successfully!");
  };

  const handleExportPDF = () => {
    if (!filtered || filtered.length === 0) {
      toast.error("No reports data available to export");
      return;
    }
    const printWindow = window.open('', '_blank');
    const reportTitle = `SU Connect Activity Reports`;
    const totalParticipants = filtered.reduce((sum, r) => sum + (r.participants || 0), 0);
    
    const html = `
      <html>
      <head>
        <title>${reportTitle}</title>
        <style>
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            color: #1a2e1a;
            margin: 40px;
            line-height: 1.6;
          }
          .header {
            display: flex;
            align-items: center;
            border-bottom: 2px solid #2e7d32;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo-container {
            margin-right: 16px;
            display: flex;
            align-items: center;
          }
          .logo-img {
            height: 60px;
            filter: invert(34%) sepia(87%) saturate(1518%) hue-rotate(94deg) brightness(95%) contrast(85%);
          }
          .title-area {
            text-align: left;
          }
          .org-title {
            font-size: 1.5rem;
            font-weight: 800;
            color: #2e7d32;
            margin: 0;
          }
          .doc-subtitle {
            font-size: 0.9rem;
            color: #6b7280;
            margin-top: 4px;
          }
          .metadata {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            font-size: 0.85rem;
            background: #f4f6f4;
            padding: 12px 16px;
            border-radius: 6px;
            border: 1px solid #e2e8e2;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 30px;
          }
          .stat-card {
            background: #fff;
            border: 1px solid #e2e8e2;
            padding: 16px;
            border-radius: 8px;
            text-align: center;
          }
          .stat-value {
            font-size: 1.8rem;
            font-weight: 800;
            color: #2e7d32;
          }
          .stat-label {
            font-size: 0.75rem;
            text-transform: uppercase;
            color: #6b7280;
            margin-top: 4px;
          }
          h3 {
            color: #2e7d32;
            border-bottom: 1.5px solid #2e7d32;
            padding-bottom: 6px;
            margin-top: 30px;
            margin-bottom: 12px;
            font-size: 1.1rem;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.85rem;
            margin-bottom: 30px;
          }
          th, td {
            border: 1px solid #e2e8e2;
            padding: 10px 12px;
            text-align: left;
          }
          th {
            background: #f4f6f4;
            font-weight: 600;
            color: #2e7d32;
          }
          .status {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.72rem;
            font-weight: 600;
            text-transform: uppercase;
          }
          .status-approved { background: #e8f5e9; color: #2e7d32; }
          .status-submitted { background: #e3f2fd; color: #1565c0; }
          .status-draft { background: #f5f5f5; color: #616161; }
          .status-returned { background: #ffebee; color: #c62828; }
          @media print {
            body { margin: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-container">
            <img class="logo-img" src="/SU-Logo.png" alt="SU Logo" />
          </div>
          <div class="title-area">
            <h1 class="org-title">Scripture Union Rwanda</h1>
            <h2>Activity Reports Directory</h2>
            <div class="doc-subtitle">Exported on ${new Date().toLocaleDateString('en-RW')}</div>
          </div>
        </div>
        
        <div class="metadata">
          <div><strong>Filtered List:</strong> ${filtered.length} reports matches</div>
          <div><strong>Total Reach:</strong> ${totalParticipants.toLocaleString()} cumulative participants</div>
        </div>

        <div class="grid">
          <div class="stat-card">
            <div class="stat-value">${filtered.length}</div>
            <div class="stat-label">Total Reports</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${totalParticipants.toLocaleString()}</div>
            <div class="stat-label">Cumulative Participants</div>
          </div>
        </div>

        <h3>Reports Table</h3>
        <table>
          <thead>
            <tr>
              <th>Report Title</th>
              <th>Type</th>
              <th>Region</th>
              <th>Date</th>
              <th>Participants</th>
              <th>Submitted By</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(r => `
              <tr>
                <td><strong>${r.title}</strong></td>
                <td>${r.type}</td>
                <td>${r.region}</td>
                <td>${r.date}</td>
                <td><strong>${r.participants}</strong></td>
                <td>${r.submittedBy}</td>
                <td><span class="status status-${r.status}">${r.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  const handleExportWord = () => {
    if (!filtered || filtered.length === 0) {
      toast.error("No reports data available to export");
      return;
    }
    const totalParticipants = filtered.reduce((sum, r) => sum + (r.participants || 0), 0);
    const dateStr = new Date().toLocaleDateString('en-RW');
    
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>SU Connect Activity Reports Directory</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #1a2e1a;
            margin: 40px;
          }
          .header {
            border-bottom: 2px solid #2e7d32;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .title {
            font-size: 1.5rem;
            font-weight: bold;
            color: #2e7d32;
          }
          .subtitle {
            font-size: 0.9rem;
            color: #6b7280;
          }
          .metadata {
            background: #f4f6f4;
            padding: 12px;
            border: 1px solid #e2e8e2;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th, td {
            border: 1px solid #e2e8e2;
            padding: 8px 10px;
            text-align: left;
          }
          th {
            background: #f4f6f4;
            font-weight: bold;
            color: #2e7d32;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">Scripture Union Rwanda</div>
          <h2>Activity Reports Directory</h2>
          <div class="subtitle">Exported on ${dateStr}</div>
        </div>
        
        <div class="metadata">
          <p><strong>Filtered List:</strong> ${filtered.length} reports matches</p>
          <p><strong>Total Reach:</strong> ${totalParticipants.toLocaleString()} cumulative participants</p>
        </div>

        <h3>Reports Table</h3>
        <table>
          <thead>
            <tr>
              <th>Report Title</th>
              <th>Type</th>
              <th>Region</th>
              <th>Date</th>
              <th>Participants</th>
              <th>Submitted By</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(r => `
              <tr>
                <td><strong>${r.title}</strong></td>
                <td>${r.type}</td>
                <td>${r.region}</td>
                <td>${r.date}</td>
                <td><strong>${r.participants}</strong></td>
                <td>${r.submittedBy}</td>
                <td>${r.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    
    const blob = new Blob(["\uFEFF", content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `su_connect_reports_${new Date().toISOString().slice(0,10)}.doc`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Word document exported successfully!");
  };

  const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status];
    const Icon = cfg.icon;
    return <span className={`badge ${cfg.cls}`}><Icon size={11} />{cfg.label}</span>;
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Activity Reports</h1>
          <p className="page-subtitle">{filtered.length} reports found</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/reports/new')}><Plus size={16} />New Report</button>
      </div>

      {/* Desktop Filters (>=768px) */}
      <div className="card reports-filter-desktop" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div className="reports-filter-panel">
            <div className="reports-filter-row-top">
              <div className="search-wrapper reports-search-box">
                <Search size={16} className="search-icon" />
                <input className="form-control" style={{ paddingLeft: 40 }} placeholder="Search reports..."
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="reports-select-item">
                <select className="form-control form-select" style={{ width: '100%' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="all">All Status</option>
                  {UNIQUE_STATUSES.map(v => <option key={v.key} value={v.key}>{v.label}</option>)}
                </select>
              </div>
              <div className="reports-select-item">
                <select className="form-control form-select" style={{ width: '100%' }} value={filterType} onChange={e => setFilterType(e.target.value)}>
                  <option value="all">All Types</option>
                  {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              {(user?.role === 'administrator' || user?.role === 'national_manager' || user?.role === 'regional_coordinator') && (
                <div className="reports-select-item">
                  <select 
                    className="form-control form-select" 
                    style={{ width: '100%' }} 
                    value={filterRegion} 
                    onChange={e => setFilterRegion(e.target.value)}
                    disabled={user?.role === 'regional_coordinator'}
                  >
                    {user?.role !== 'regional_coordinator' && <option value="all">All Regions</option>}
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              )}
            </div>
            
            <div className="reports-filter-row-bottom">
              <div className="reports-date-box">
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>From:</span>
                <input type="date" className="form-control" style={{ width: 140, fontSize: '0.78rem' }} 
                  value={startDate} onChange={e => setStartDate(e.target.value)} />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>To:</span>
                <input type="date" className="form-control" style={{ width: 140, fontSize: '0.78rem' }} 
                  value={endDate} onChange={e => setEndDate(e.target.value)} />
                {(startDate || endDate) && (
                  <button className="btn btn-ghost btn-sm" style={{ padding: '6px 8px' }} 
                    onClick={() => { setStartDate(''); setEndDate(''); }}>
                    <RotateCcw size={13} style={{ marginRight: 4 }} />Reset Dates
                  </button>
                )}
              </div>

              <div className="reports-export-btns">
                <button className="btn btn-secondary btn-sm" onClick={handleExportPDF}><Download size={14} /> Export PDF</button>
                {(user?.role === 'administrator' || user?.role === 'national_manager' || user?.role === 'regional_coordinator') && (
                  <button className="btn btn-secondary btn-sm" onClick={handleExportWord}><Download size={14} /> Export Word</button>
                )}
                <button className="btn btn-secondary btn-sm" onClick={handleExportExcel}><Download size={14} /> Export Excel</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filter Bar & Drawer (<768px) */}
      <div className="reports-filter-mobile">
        <div className="reports-mobile-top-bar">
          <div className="search-wrapper" style={{ flex: 1 }}>
            <Search size={16} className="search-icon" />
            <input 
              className="form-control" 
              style={{ paddingLeft: 38 }} 
              placeholder="Search reports..."
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
            {search && (
              <button 
                type="button" 
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', padding: 4 }}
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button 
            className={`btn btn-secondary ${activeFilterCount > 0 ? 'active-filter' : ''}`}
            style={{ padding: '0 12px', minWidth: 44, position: 'relative' }}
            onClick={() => setShowMobileFilters(prev => !prev)}
            aria-label="Toggle Filters"
          >
            <SlidersHorizontal size={16} />
            {activeFilterCount > 0 && (
              <span className="mobile-filter-badge">{activeFilterCount}</span>
            )}
          </button>
          <button 
            className="btn btn-secondary"
            style={{ padding: '0 12px', minWidth: 44 }}
            onClick={() => setShowExportMenu(prev => !prev)}
            aria-label="Export Options"
          >
            <Download size={16} />
          </button>
        </div>

        {/* Mobile Export Menu Dropdown */}
        {showExportMenu && (
          <div className="mobile-export-dropdown card">
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-light)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              EXPORT DATA
            </div>
            <button className="mobile-export-item" onClick={() => { handleExportPDF(); setShowExportMenu(false); }}>
              <Download size={14} /> Export as PDF Document
            </button>
            {(user?.role === 'administrator' || user?.role === 'national_manager' || user?.role === 'regional_coordinator') && (
              <button className="mobile-export-item" onClick={() => { handleExportWord(); setShowExportMenu(false); }}>
                <Download size={14} /> Export as Word (.doc)
              </button>
            )}
            <button className="mobile-export-item" onClick={() => { handleExportExcel(); setShowExportMenu(false); }}>
              <Download size={14} /> Export as Excel / CSV
            </button>
          </div>
        )}

        {/* Mobile Filter Drawer */}
        {showMobileFilters && (
          <div className="mobile-filter-sheet card">
            <div className="mobile-filter-sheet-header">
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Filter Reports</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowMobileFilters(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="mobile-filter-sheet-body">
              <div className="form-group">
                <label className="form-label">Activity Type</label>
                <select className="form-control form-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
                  <option value="all">All Types</option>
                  {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {(user?.role === 'administrator' || user?.role === 'national_manager' || user?.role === 'regional_coordinator') && (
                <div className="form-group">
                  <label className="form-label">Region</label>
                  <select 
                    className="form-control form-select" 
                    value={filterRegion} 
                    onChange={e => setFilterRegion(e.target.value)}
                    disabled={user?.role === 'regional_coordinator'}
                  >
                    {user?.role !== 'regional_coordinator' && <option value="all">All Regions</option>}
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Date Range</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>From</span>
                    <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>To</span>
                    <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mobile-filter-sheet-footer">
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setFilterType('all');
                  if (user?.role !== 'regional_coordinator') setFilterRegion('all');
                  setStartDate('');
                  setEndDate('');
                }}
              >
                Reset
              </button>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => setShowMobileFilters(false)}
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status Summary chips */}
      <div className="support-chip-bar" style={{ marginBottom: 16 }}>
        {UNIQUE_STATUSES.map(v => {
          const count = reports.filter(r => (STATUS_CONFIG[r.status]?.label || r.status) === v.label).length;
          return (
            <button key={v.key} className={`chip ${filterStatus === v.key ? 'active' : ''}`}
              style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
              onClick={() => setFilterStatus(filterStatus === v.key ? 'all' : v.key)}>
              {v.label}: {count}
            </button>
          );
        })}
      </div>

      {/* Bulk Sharing Panel */}
      {user?.role === 'regional_coordinator' && selectedReportIds.length > 0 && (
        <div className="card" style={{ marginBottom: 16, background: 'var(--primary-50)', borderColor: 'var(--primary-200)' }}>
          <div className="card-body" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-dark)' }}>
              {selectedReportIds.length} report(s) selected
            </span>
            <button className="btn btn-primary btn-sm" onClick={handleShareSelected}>
              Share to National Manager
            </button>
          </div>
        </div>
      )}

      {/* Desktop Table View (>=768px) */}
      <div className="card desktop-reports-table">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                {user?.role === 'regional_coordinator' && <th>Select</th>}
                <th>Report Title</th>
                <th>Type</th>
                <th>Region</th>
                <th>Date</th>
                <th>Participants</th>
                <th>Submitted By</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={user?.role === 'regional_coordinator' ? 9 : 8} style={{ textAlign: 'center', padding: '40px' }}>Loading reports from database...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={user?.role === 'regional_coordinator' ? 9 : 8}>
                  <div className="empty-state">
                    <FileText size={40} className="empty-state-icon" />
                    <h3>No Reports Found</h3>
                    <p>Try adjusting your filters or submit a new report.</p>
                    <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/reports/new')}><Plus size={16} />New Report</button>
                  </div>
                </td></tr>
              ) : filtered.map(r => (
                <tr key={r.id}>
                  {user?.role === 'regional_coordinator' && (
                    <td data-label="Select" style={{ textAlign: 'center' }}>
                      {r.status === 'submitted_to_coordinator' && (
                        r.recipients && r.recipients.some(recip => recip.role === 'national_manager') ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Shared</span>
                        ) : (
                          <input 
                            type="checkbox" 
                            checked={selectedReportIds.includes(r.id)} 
                            onChange={() => handleToggleSelectReport(r.id)} 
                          />
                        )
                      )}
                    </td>
                  )}
                  <td data-label="Report Title">
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{r.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{Array.isArray(r.attachments) ? r.attachments.length : (r.attachments || 0)} attachments</div>
                  </td>
                  <td data-label="Type"><span className="chip" style={{ cursor: 'default' }}>{r.type}</span></td>
                  <td data-label="Region" style={{ fontSize: '0.82rem' }}>{r.region}</td>
                  <td data-label="Date" style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{r.date}</td>
                  <td data-label="Participants" style={{ fontWeight: 600 }}>{r.participants.toLocaleString()}</td>
                  <td data-label="Submitted By">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar" style={{ width: 28, height: 28, fontSize: '0.65rem' }}>
                        {r.submittedBy.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span style={{ fontSize: '0.82rem' }}>{r.submittedBy}</span>
                    </div>
                  </td>
                  <td data-label="Status"><StatusBadge status={r.status} /></td>
                  <td data-label="Actions">
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-icon btn-sm" title="View" onClick={() => navigate(`/reports/${r.id}`)}>
                        <Eye size={15} />
                      </button>
                      {['draft', 'returned'].includes(r.status) && (
                        <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => navigate(`/reports/${r.id}/edit`)}>
                          <Edit size={15} />
                        </button>
                      )}
                      {(r.submittedBy === user?.name || r.submitted_by?.id === user?.id || user?.role === 'administrator') && (
                        <button 
                          className="btn btn-ghost btn-icon btn-sm" 
                          style={{ color: 'var(--danger)' }}
                          title="Delete" 
                          onClick={() => handleDeleteReport(r.id, r.title)}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card-Based Reports View (<768px) */}
      <div className="mobile-reports-container">
        {loading ? (
          <div className="empty-state card" style={{ padding: '40px 16px' }}>
            <div style={{ animation: 'spin 1s linear infinite', fontSize: '2rem', marginBottom: 10 }}>⏳</div>
            <p>Loading activity reports...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state card" style={{ padding: '40px 16px' }}>
            <FileText size={38} className="empty-state-icon" />
            <h3 style={{ marginTop: 10 }}>No Reports Found</h3>
            <p>Try clearing filters or search terms.</p>
            <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => navigate('/reports/new')}>
              <Plus size={16} /> New Report
            </button>
          </div>
        ) : (
          <div className="mobile-reports-list">
            {filtered.map(r => {
              const isSelected = selectedReportIds.includes(r.id);
              const isSelectable = user?.role === 'regional_coordinator' && r.status === 'submitted_to_coordinator' &&
                !(r.recipients && r.recipients.some(recip => recip.role === 'national_manager'));
              const attachmentCount = Array.isArray(r.attachments) ? r.attachments.length : (r.attachments || 0);

              return (
                <div key={r.id} className={`mobile-report-card ${isSelected ? 'selected' : ''}`}>
                  <div className="mobile-report-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="chip chip-sm" style={{ fontWeight: 600, fontSize: '0.72rem' }}>{r.type}</span>
                      {isSelectable && (
                        <button 
                          type="button" 
                          className="mobile-card-select-btn"
                          onClick={() => handleToggleSelectReport(r.id)}
                          aria-label="Select report"
                        >
                          {isSelected ? <CheckSquare size={17} color="var(--primary)" /> : <Square size={17} color="var(--text-muted)" />}
                        </button>
                      )}
                    </div>
                    <StatusBadge status={r.status} />
                  </div>

                  <h3 className="mobile-report-title" onClick={() => navigate(`/reports/${r.id}`)}>
                    {r.title}
                  </h3>

                  <div className="mobile-report-meta-row">
                    <span className="mobile-meta-item">
                      <MapPin size={12} /> {r.region}
                    </span>
                    <span className="mobile-meta-item">
                      <Calendar size={12} /> {r.date}
                    </span>
                    {attachmentCount > 0 && (
                      <span className="mobile-meta-item">
                        📎 {attachmentCount} file{attachmentCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <div className="mobile-report-stats-row">
                    <div className="mobile-stat-pill">
                      <Users size={13} />
                      <span><strong>{r.participants.toLocaleString()}</strong> reach</span>
                    </div>
                    <div className="mobile-submitter-pill">
                      <div className="avatar" style={{ width: 22, height: 22, fontSize: '0.62rem' }}>
                        {r.submittedBy.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="mobile-submitter-name truncate">{r.submittedBy}</span>
                    </div>
                  </div>

                  <div className="mobile-report-card-footer">
                    <button 
                      className="btn btn-primary btn-sm mobile-action-btn-primary" 
                      onClick={() => navigate(`/reports/${r.id}`)}
                    >
                      <Eye size={14} /> View Details
                    </button>
                    <div className="mobile-action-btn-group">
                      {['draft', 'returned'].includes(r.status) && (
                        <button 
                          className="btn btn-ghost btn-icon btn-sm" 
                          title="Edit"
                          onClick={() => navigate(`/reports/${r.id}/edit`)}
                        >
                          <Edit size={15} />
                        </button>
                      )}
                      {(r.submittedBy === user?.name || r.submitted_by?.id === user?.id || user?.role === 'administrator') && (
                        <button 
                          className="btn btn-ghost btn-icon btn-sm" 
                          style={{ color: 'var(--danger)' }}
                          title="Delete" 
                          onClick={() => handleDeleteReport(r.id, r.title)}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
