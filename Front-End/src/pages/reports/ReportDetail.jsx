import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, Edit, RotateCcw, MapPin, Calendar, Users, FileText, Heart, MessageSquare, Download, ThumbsUp, ThumbsDown, Sparkles, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { reportService } from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  approved: { cls: 'badge-success', icon: CheckCircle, label: 'Approved' },
  submitted: { cls: 'badge-info', icon: Clock, label: 'Submitted' },
  submitted_to_coordinator: { cls: 'badge-info', icon: Clock, label: 'Submitted to Coordinator' },
  submitted_to_manager: { cls: 'badge-info', icon: Clock, label: 'Submitted to Manager' },
  draft: { cls: 'badge-gray', icon: Edit, label: 'Draft' },
  returned: { cls: 'badge-danger', icon: RotateCcw, label: 'Returned' },
  returned_by_coordinator: { cls: 'badge-danger', icon: RotateCcw, label: 'Returned by Coordinator' },
  returned_by_manager: { cls: 'badge-danger', icon: RotateCcw, label: 'Returned by Manager' },
};

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  const [status, setStatus] = useState('draft');
  const [analyzing, setAnalyzing] = useState(false);
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);

  const fetchReport = () => {
    reportService.get(id)
      .then(data => {
        setReport(data);
        setStatus(data.status);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching report:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReport();
  }, [id]);

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center' }}>Loading report details...</div>;
  }

  if (!report) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <h3>Report Not Found</h3>
        <button className="btn btn-primary" onClick={() => navigate('/reports')}>Back to Reports</button>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const Icon = cfg.icon;
  const canApprove = user?.role === 'administrator' || user?.role === 'national_manager' || (user?.role === 'regional_coordinator' && user?.region === report.region);

  const approve = async () => {
    try {
      await reportService.updateStatus(id, 'approved', comment || 'Approved');
      setStatus('approved');
      addNotification({ type: 'report', title: 'Report Approved', message: `"${report.title}" has been approved.`, icon: 'check' });
      setComment('');
      fetchReport();
    } catch (err) {
      console.error(err);
      addNotification({ type: 'error', title: 'Action Failed', message: err.response?.data?.error || 'Could not approve report.', icon: 'x' });
    }
  };

  const returnReport = async () => {
    try {
      await reportService.updateStatus(id, 'returned', comment || 'Returned for Revision');
      setStatus('returned');
      addNotification({ type: 'report', title: 'Report Returned', message: `"${report.title}" has been returned for revision.`, icon: 'alert' });
      setComment('');
      fetchReport();
    } catch (err) {
      console.error(err);
      addNotification({ type: 'error', title: 'Action Failed', message: err.response?.data?.error || 'Could not return report.', icon: 'x' });
    }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      await reportService.analyze(id);
      addNotification({ type: 'success', title: 'AI Job Queued', message: 'SU-Connect AI analysis has been started.', icon: 'check' });
      setTimeout(() => {
        fetchReport();
        setAnalyzing(false);
      }, 3000);
    } catch (err) {
      console.error(err);
      addNotification({ type: 'error', title: 'AI Analysis Failed', message: err.response?.data?.error || 'Could not analyze report.', icon: 'x' });
      setAnalyzing(false);
    }
  };

  const handleRevealAndAnalyze = () => {
    setShowAiAnalysis(true);
    if (!report?.ai_category && !report?.aiCategory) {
      runAnalysis();
    }
  };

  const handleOverride = async (category) => {
    try {
      await reportService.aiOverride(id, category);
      addNotification({ type: 'success', title: 'Category Overridden', message: `Report category changed to ${category}.`, icon: 'check' });
      fetchReport();
    } catch (err) {
      console.error(err);
      addNotification({ type: 'error', title: 'Override Failed', message: err.response?.data?.error || 'Could not override category.', icon: 'x' });
    }
  };

  const handleExportWord = () => {
    if (!report) return;
    
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>${report.title}</title>
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
            font-size: 0.95rem;
            color: #6b7280;
          }
          .meta-grid {
            background: #f4f6f4;
            padding: 12px;
            border: 1px solid #e2e8e2;
            margin-bottom: 20px;
          }
          h3 {
            color: #2e7d32;
            border-bottom: 1.5px solid #2e7d32;
            padding-bottom: 6px;
            margin-top: 30px;
            margin-bottom: 12px;
          }
          .content-block {
            padding: 15px;
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
          <h2>${report.title}</h2>
          <p class="subtitle">${report.type} · ${report.region} · Status: ${report.status}</p>
        </div>

        <div class="meta-grid">
          <p><strong>Date:</strong> ${report.date}</p>
          <p><strong>Duration:</strong> ${report.duration || 'N/A'}</p>
          <p><strong>Location:</strong> ${report.location || 'N/A'}</p>
          <p><strong>Participants:</strong> ${report.participants.toLocaleString()}</p>
        </div>

        <h3>Activity Description</h3>
        <div class="content-block">
          ${report.description || 'No description provided.'}
        </div>

        <h3>Outcomes & Impact</h3>
        <div class="content-block">
          ${report.outcomes || 'No outcomes provided.'}
        </div>

        <h3>Challenges Encountered</h3>
        <div class="content-block">
          ${report.challenges || 'No challenges listed.'}
        </div>

        ${report.prayerRequests ? `
          <h3>Prayer Requests</h3>
          <div class="content-block" style="font-style: italic;">
            ${report.prayerRequests}
          </div>
        ` : ''}

        <h3>Attendance & Demographics</h3>
        <table>
          <thead>
            <tr>
              <th>Group</th>
              <th>Count</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Male Participants</strong></td>
              <td>${report.male}</td>
              <td>${report.participants > 0 ? Math.round((report.male / report.participants) * 100) : 0}%</td>
            </tr>
            <tr>
              <td><strong>Female Participants</strong></td>
              <td>${report.female}</td>
              <td>${report.participants > 0 ? Math.round((report.female / report.participants) * 100) : 0}%</td>
            </tr>
            <tr>
              <td><strong>Youth (under 25)</strong></td>
              <td>${report.youth}</td>
              <td>${report.participants > 0 ? Math.round((report.youth / report.participants) * 100) : 0}%</td>
            </tr>
            <tr>
              <td><strong>Adults (25+)</strong></td>
              <td>${report.adults}</td>
              <td>${report.participants > 0 ? Math.round((report.adults / report.participants) * 100) : 0}%</td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;
    
    const blob = new Blob(["\uFEFF", content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `su_connect_report_${report.id}_${new Date().toISOString().slice(0,10)}.doc`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Word document exported successfully!");
  };

  const handleExportPDF = () => {
    if (!report) return;
    const printWindow = window.open('', '_blank');
    const reportTitle = report.title;
    
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
            border-bottom: 2px solid #2e7d32;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 1.25rem;
            font-weight: 800;
            color: #2e7d32;
            margin-bottom: 4px;
          }
          .title-area {
            margin-top: 15px;
          }
          .report-title {
            font-size: 1.75rem;
            font-weight: 800;
            color: #1a2e1a;
            margin: 0 0 8px 0;
          }
          .subtitle {
            font-size: 0.95rem;
            color: #6b7280;
            margin: 0;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 30px;
          }
          .meta-card {
            background: #f4f6f4;
            border: 1px solid #e2e8e2;
            padding: 12px 16px;
            border-radius: 8px;
          }
          .meta-label {
            font-size: 0.72rem;
            text-transform: uppercase;
            color: #6b7280;
            font-weight: 600;
            letter-spacing: 0.05em;
          }
          .meta-value {
            font-weight: 700;
            font-size: 0.95rem;
            margin-top: 4px;
            color: #1a2e1a;
          }
          h3 {
            color: #2e7d32;
            border-bottom: 1.5px solid #2e7d32;
            padding-bottom: 6px;
            margin-top: 30px;
            margin-bottom: 12px;
            font-size: 1.15rem;
          }
          .content-block {
            background: #fff;
            border: 1px solid #e2e8e2;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 0.9rem;
            line-height: 1.7;
          }
          .demographics-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.85rem;
            margin-bottom: 30px;
          }
          .demographics-table th, .demographics-table td {
            border: 1px solid #e2e8e2;
            padding: 10px 12px;
            text-align: left;
          }
          .demographics-table th {
            background: #f4f6f4;
            font-weight: 600;
            color: #2e7d32;
          }
          .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
          }
          .badge-success { background: #e8f5e9; color: #2e7d32; }
          .badge-info { background: #e3f2fd; color: #1565c0; }
          .badge-gray { background: #f5f5f5; color: #616161; }
          .badge-danger { background: #ffebee; color: #c62828; }
          @media print {
            body { margin: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="header" style="display: flex; align-items: center; border-bottom: 2px solid #2e7d32; padding-bottom: 20px; margin-bottom: 30px;">
          <img src="/SU-Logo.png" alt="SU Logo" style="height: 60px; filter: invert(34%) sepia(87%) saturate(1518%) hue-rotate(94deg) brightness(95%) contrast(85%); margin-right: 15px;" />
          <div style="text-align: left;">
            <div style="font-size: 1.5rem; font-weight: 800; color: #2e7d32; line-height: 1.2;">Scripture Union Rwanda</div>
            <div class="subtitle" style="font-size: 0.95rem; color: #6b7280; margin-top: 4px;">SU Connect Platform</div>
          </div>
        </div>
        <div style="margin-top: 20px;">
            <h1 class="report-title">${report.title}</h1>
            <p class="subtitle">${report.type} · ${report.region} · <span class="badge ${report.status === 'approved' ? 'badge-success' : report.status === 'submitted' ? 'badge-info' : report.status === 'returned' ? 'badge-danger' : 'badge-gray'}">${report.status}</span></p>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-card">
            <div class="meta-label">Date</div>
            <div class="meta-value">${report.date}</div>
          </div>
          <div class="meta-card">
            <div class="meta-label">Duration</div>
            <div class="meta-value">${report.duration || 'N/A'}</div>
          </div>
          <div class="meta-card">
            <div class="meta-label">Location</div>
            <div class="meta-value">${report.location || 'N/A'}</div>
          </div>
          <div class="meta-card">
            <div class="meta-label">Participants</div>
            <div class="meta-value">${report.participants.toLocaleString()}</div>
          </div>
        </div>

        <h3>Activity Description</h3>
        <div class="content-block">
          ${report.description || 'No description provided.'}
        </div>

        <h3>Outcomes & Impact</h3>
        <div class="content-block">
          ${report.outcomes || 'No outcomes provided.'}
        </div>

        <h3>Challenges Encountered</h3>
        <div class="content-block">
          ${report.challenges || 'No challenges listed.'}
        </div>

        ${report.prayerRequests ? `
          <h3>Prayer Requests</h3>
          <div class="content-block" style="font-style: italic; background: #fdf2f8; border-left: 4px solid #db2777;">
            ${report.prayerRequests}
          </div>
        ` : ''}

        <h3>Attendance & Demographics</h3>
        <table class="demographics-table">
          <thead>
            <tr>
              <th>Group</th>
              <th>Count</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Male Participants</strong></td>
              <td>${report.male}</td>
              <td>${report.participants > 0 ? Math.round((report.male / report.participants) * 100) : 0}%</td>
            </tr>
            <tr>
              <td><strong>Female Participants</strong></td>
              <td>${report.female}</td>
              <td>${report.participants > 0 ? Math.round((report.female / report.participants) * 100) : 0}%</td>
            </tr>
            <tr>
              <td><strong>Youth (under 25)</strong></td>
              <td>${report.youth}</td>
              <td>${report.participants > 0 ? Math.round((report.youth / report.participants) * 100) : 0}%</td>
            </tr>
            <tr>
              <td><strong>Adults (25+)</strong></td>
              <td>${report.adults}</td>
              <td>${report.participants > 0 ? Math.round((report.adults / report.participants) * 100) : 0}%</td>
            </tr>
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
    printWindow.onafterprint = () => {
      printWindow.close();
    };
  };

  const handleDeleteReport = async () => {
    if (!window.confirm(`Are you sure you want to delete the report "${report.title}"?`)) return;
    try {
      const res = await reportService.delete(report.id);
      if (res.success) {
        toast.success(res.message || "Report deleted successfully");
        navigate('/reports');
      } else {
        toast.error(res.error || "Failed to delete report");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "An error occurred while deleting the report");
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/reports')}><ArrowLeft size={18} /></button>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.25rem' }}>{report.title}</h1>
            <p className="page-subtitle">{report.type} · {report.region}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <span className={`badge ${cfg.cls}`}><Icon size={11} />{cfg.label}</span>
          {canApprove && status === 'submitted' && (
            <>
              <button className="btn btn-primary btn-sm" onClick={approve}><ThumbsUp size={14} />Approve</button>
              <button className="btn btn-danger btn-sm" onClick={returnReport}><ThumbsDown size={14} />Return</button>
            </>
          )}
          {report.submitted_by?.id === user?.id && ['draft', 'returned', 'submitted'].includes(status) && (
            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/reports/${report.id}/edit`)}>
              <Edit size={14} />Edit
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={handleExportPDF}><Download size={14} />Export PDF</button>
          {(user?.role === 'administrator' || user?.role === 'national_manager' || user?.role === 'regional_coordinator') && (
            <button className="btn btn-secondary btn-sm" onClick={handleExportWord}><Download size={14} />Export Word</button>
          )}
          {(report.submitted_by?.id === user?.id || user?.role === 'administrator') && (
            <button className="btn btn-secondary btn-sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={handleDeleteReport}>
              <Trash2 size={14} />Delete
            </button>
          )}
        </div>
      </div>

      {/* Meta cards */}
      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        {[
          { icon: Calendar, label: 'Date', val: report.date },
          { icon: Clock, label: 'Duration', val: report.duration },
          { icon: MapPin, label: 'Location', val: report.location },
          { icon: Users, label: 'Participants', val: report.participants.toLocaleString() },
        ].map(({ icon: I, label, val }) => (
          <div key={label} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="stat-icon green" style={{ width: 36, height: 36 }}><I size={16} /></div>
              <div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{val}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="page-layout-grid" style={{ gap: 20 }}>
        <div>
          {/* Tabs */}
          <div className="tabs" style={{ marginBottom: 20 }}>
            {['details', 'attendance', 'prayer', 'comments'].map(t => (
              <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === 'details' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                { title: 'Activity Description', icon: FileText, content: report.description },
                { title: 'Outcomes & Impact', icon: CheckCircle, content: report.outcomes },
                { title: 'Challenges Encountered', icon: RotateCcw, content: report.challenges },
              ].map(({ title, icon: I, content }) => (
                <div key={title} className="card">
                  <div className="card-header" style={{ paddingBottom: 12 }}><h3 style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}><I size={16} />{title}</h3></div>
                  <div className="card-body" style={{ paddingTop: 8 }}>
                    <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text-primary)' }}>{content}</p>
                  </div>
                </div>
              ))}
              
              {/* Supporting Documents Card */}
              <div className="card">
                <div className="card-header" style={{ paddingBottom: 12 }}>
                  <h3 style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileText size={16} /> Supporting Documents
                  </h3>
                </div>
                <div className="card-body" style={{ paddingTop: 8 }}>
                  {report.attachments && report.attachments.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {report.attachments.map(doc => (
                        <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius)', border: '1px solid var(--border-light)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: '1.2rem' }}>
                              {doc.type?.toLowerCase() === 'pdf' ? '📄' : doc.type?.toLowerCase() === 'docx' ? '📝' : doc.type?.toLowerCase() === 'xlsx' ? '📊' : doc.type?.toLowerCase() === 'zip' ? '🗜️' : ['jpg', 'jpeg', 'png'].includes(doc.type?.toLowerCase()) ? '🖼️' : '📄'}
                            </span>
                            <div>
                              <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>{doc.name}</p>
                              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{(doc.size / 1024).toFixed(1)} KB · {doc.type?.toUpperCase()}</p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <a 
                              href={`http://localhost:8000/api/documents/${doc.id}/download`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="btn btn-secondary btn-xs"
                              style={{ display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', padding: '4px 8px', fontSize: '0.75rem' }}
                              title="View Document"
                            >
                              <FileText size={12} /> View
                            </a>
                            <a 
                              href={`http://localhost:8000/api/documents/${doc.id}/download?download=1`} 
                              download={doc.name}
                              className="btn btn-secondary btn-xs"
                              style={{ display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', padding: '4px 8px', fontSize: '0.75rem' }}
                              title="Download to Device"
                            >
                              <Download size={12} /> Download
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No supporting documents uploaded.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="card">
              <div className="card-header"><h3 style={{ fontSize: '0.95rem' }}>Attendance Statistics</h3></div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { label: 'Male Participants', val: report.demographics.male, color: '#1565c0' },
                    { label: 'Female Participants', val: report.demographics.female, color: '#9c27b0' },
                    { label: 'Youth (under 25)', val: report.demographics.youth, color: '#2e7d32' },
                    { label: 'Adults (25+)', val: report.demographics.adults, color: '#e65100' },
                  ].map(({ label, val, color }) => (
                    <div key={label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{label}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{val} ({Math.round((val / report.participants) * 100)}%)</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${(val / report.participants) * 100}%`, background: color }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ padding: '16px', background: 'var(--primary-50)', borderRadius: 'var(--radius)', marginTop: 8 }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-dark)' }}>Total Participants: {report.participants}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'prayer' && (
            <div className="card">
              <div className="card-header">
                <h3 style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}><Heart size={16} />Prayer Requests</h3>
              </div>
              <div className="card-body">
                <div style={{ background: '#fce7f3', borderRadius: 'var(--radius)', padding: '16px', border: '1px solid #f9a8d4' }}>
                  <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: '#831843' }}>{report.prayerRequests}</p>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 12 }}>This prayer request has been shared with the organizational prayer team.</p>
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="card">
              <div className="card-header"><h3 style={{ fontSize: '0.95rem' }}><MessageSquare size={16} style={{ marginRight: 8 }} />Comments & Review</h3></div>
              <div className="card-body">
                <div style={{ marginBottom: 20 }}>
                  <textarea className="form-control" rows={3} placeholder="Add a comment or review note..."
                    value={comment} onChange={e => setComment(e.target.value)} style={{ marginBottom: 10 }} />
                  <button className="btn btn-primary btn-sm" disabled={!comment.trim()}>Post Comment</button>
                </div>
                <div className="empty-state" style={{ padding: '30px 0' }}>
                  <MessageSquare size={32} className="empty-state-icon" />
                  <p>No comments yet. Be the first to add a review.</p>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-header"><h3 style={{ fontSize: '0.9rem' }}>Report Info</h3></div>
            <div className="card-body" style={{ paddingTop: 12 }}>
              {[
                { label: 'Submitted by', val: report.submittedBy },
                { label: 'Department', val: report.department },
                { label: 'Region', val: report.region },
                { label: 'Attachments', val: `${report.attachmentsCount || 0} files` },
              ].map(({ label, val }) => (
                <div key={label} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>{label}</span>
                  <span style={{ fontWeight: 600 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recipients Card */}
          <div className="card">
            <div className="card-header"><h3 style={{ fontSize: '0.9rem' }}>Share Recipients</h3></div>
            <div className="card-body" style={{ paddingTop: 12 }}>
              {report.recipients && report.recipients.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {report.recipients.map(r => (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar" style={{ width: 28, height: 28, fontSize: '0.65rem' }}>
                        {r.avatar || r.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block' }}>{r.name}</span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', textTransform: 'capitalize' }}>
                          {r.role ? r.role.replace('_', ' ') : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No direct recipients selected.</p>
              )}
            </div>
          </div>

          {/* Gemini AI Analysis Card */}
          {(status === 'submitted' || status === 'approved' || report.ai_category || report.aiCategory) && (
            <>
              {!showAiAnalysis ? (
                <div className="card" style={{ border: '1px dashed var(--primary-100)', background: 'linear-gradient(to bottom right, var(--primary-50), white)', padding: '16px', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                    SU-Connect AI Analysis is hidden.
                  </p>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    onClick={handleRevealAndAnalyze}
                    disabled={analyzing}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <Sparkles size={14} /> {analyzing ? 'Analyzing...' : (report.ai_category || report.aiCategory ? 'Show SU-Connect AI Analysis' : 'Run SU-Connect AI Analysis')}
                  </button>
                </div>
              ) : (
                <div className="card" style={{ border: '1px solid var(--primary-100)', background: 'linear-gradient(to bottom right, var(--primary-50), white)' }}>
                  <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12 }}>
                    <h3 style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary-dark)', margin: 0 }}>
                      <Sparkles size={16} /> SU-Connect AI Analysis
                    </h3>
                    <button 
                      className="btn btn-ghost btn-xs" 
                      onClick={() => setShowAiAnalysis(false)} 
                      style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                    >
                      Hide
                    </button>
                  </div>
                  <div className="card-body" style={{ paddingTop: 8 }}>
                    {report.ai_category || report.aiCategory ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Category Classification</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                            <span className="badge badge-primary" style={{ textTransform: 'capitalize', fontSize: '0.85rem' }}>
                              {report.ai_category || report.aiCategory}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              ({report.confidence || 0}% confidence)
                            </span>
                          </div>
                        </div>

                        {report.ai_summary && (
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Executive Summary</span>
                            <p style={{ fontSize: '0.8rem', lineHeight: 1.5, marginTop: 4, fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                              "{report.ai_summary}"
                            </p>
                          </div>
                        )}

                        {report.keywords && (
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Keywords</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {(Array.isArray(report.keywords) ? report.keywords : (() => {
                                try {
                                  return typeof report.keywords === 'string' ? JSON.parse(report.keywords) : [];
                                } catch(e) {
                                  return typeof report.keywords === 'string' ? report.keywords.split(',').map(k => k.trim()) : [];
                                }
                              })()).map(kw => (
                                <span key={kw} className="badge badge-gray" style={{ fontSize: '0.7rem' }}>{kw}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {canApprove && (
                          <div style={{ marginTop: 8, borderTop: '1px solid var(--border-light)', paddingTop: 12 }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Override Category</span>
                            <select 
                              className="form-control" 
                              style={{ fontSize: '0.8rem', padding: '4px 8px', height: 'auto' }}
                              value={report.ai_category || report.aiCategory || ''}
                              onChange={(e) => handleOverride(e.target.value)}
                            >
                              <option value="Outreach">Outreach</option>
                              <option value="Bible Study">Bible Study</option>
                              <option value="Training">Training</option>
                              <option value="Meeting">Meeting</option>
                              <option value="Community Event">Community Event</option>
                              <option value="Prayer Meeting">Prayer Meeting</option>
                              <option value="Youth Program">Youth Program</option>
                            </select>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '10px 0' }}>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                          No AI analysis is available for this report yet.
                        </p>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          onClick={runAnalysis}
                          disabled={analyzing}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                        >
                          <Sparkles size={14} /> {analyzing ? 'Analyzing...' : 'Run SU-Connect AI Analysis'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Status timeline */}
          <div className="card">
            <div className="card-header"><h3 style={{ fontSize: '0.9rem' }}>Status Timeline</h3></div>
            <div className="card-body" style={{ paddingTop: 12 }}>
              <div className="timeline">
                {(() => {
                  const formatTimelineDate = (dateTimeStr) => {
                    if (!dateTimeStr) return '';
                    const date = new Date(dateTimeStr);
                    const pad = (n) => String(n).padStart(2, '0');
                    const y = date.getFullYear();
                    const m = pad(date.getMonth() + 1);
                    const d = pad(date.getDate());
                    const hr = pad(date.getHours());
                    const min = pad(date.getMinutes());
                    return `${y}-${m}-${d} · ${hr}:${min}`;
                  };

                  const timelineItems = [
                    { label: 'Report Created', time: formatTimelineDate(report.created_at || report.createdAt), done: true }
                  ];

                  if (report.updated_at || report.updatedAt) {
                    const cTime = new Date(report.created_at || report.createdAt).getTime();
                    const uTime = new Date(report.updated_at || report.updatedAt).getTime();
                    if (Math.abs(uTime - cTime) > 10000) {
                      timelineItems.push({ 
                        label: 'Report Updated', 
                        time: formatTimelineDate(report.updated_at || report.updatedAt), 
                        done: true 
                      });
                    }
                  }

                  timelineItems.push({ 
                    label: 'Submitted for Review', 
                    time: (report.submitted_at || report.submittedAt) 
                      ? formatTimelineDate(report.submitted_at || report.submittedAt) 
                      : 'Pending', 
                    done: status !== 'draft' 
                  });

                  timelineItems.push({ 
                    label: status === 'approved' ? 'Approved' : status === 'returned' ? 'Returned for Revision' : 'Awaiting Review', 
                    time: status === 'approved' && (report.approved_at || report.approvedAt)
                      ? formatTimelineDate(report.approved_at || report.approvedAt)
                      : status === 'returned' && (report.returned_at || report.returnedAt)
                        ? formatTimelineDate(report.returned_at || report.returnedAt)
                        : 'Pending', 
                    done: status === 'approved' || status === 'returned' 
                  });

                  return timelineItems.map((s, i) => (
                    <div key={i} className="timeline-item">
                      <div className="timeline-dot" style={{ background: s.done ? 'var(--primary-50)' : 'var(--border)' }}>
                        <CheckCircle size={14} color={s.done ? 'var(--primary)' : 'var(--text-light)'} />
                      </div>
                      <div className="timeline-content">
                        <p style={{ fontSize: '0.8rem', fontWeight: 600 }}>{s.label}</p>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.time}</p>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
